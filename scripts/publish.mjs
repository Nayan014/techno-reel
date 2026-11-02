import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { projectPaths, json } from './projects.mjs';
import { loadEnv } from './lib.mjs';
import { privateJson, snapshot, ready, digest, lockQueue } from './publishing/state.mjs';
import { preflight, youtube, instagram } from './publishing/providers.mjs';

const queue = '.local/publishing/queue';
const done = state => ['uploaded', 'published', 'cancelled'].includes(state.status);
export async function runQueue({ execute = false, providers = { youtube, instagram }, env = process.env, now = Date.now() } = {}) {
  const unlock = lockQueue();
  let failures = 0;
  try {
    for (const name of existsSync(queue) ? readdirSync(queue).filter(n => /^[a-f0-9]{64}\.json$/.test(n)).sort() : []) {
      const file = join(queue, name);
      const job = json(file);
      if (Object.values(job.targets).every(done)) continue;
      if (job.plan.at && Date.parse(job.plan.at) > now) continue;
      console.log(`${job.slug}: ${execute ? 'running' : 'due (preview only)'}`);
      if (!execute) continue;
      const save = () => privateJson(file, job);
      try {
        const p = ready(job.slug);
        if (await digest(p.video) !== job.videoHash) throw new Error('Video changed since queueing. Cancel this job and enqueue the reviewed revision.');
        // Check every unfinished target before making any upload.
        for (const platform of job.plan.platforms) if (!done(job.targets[platform])) preflight(platform, env);
        for (const platform of job.plan.platforms) {
          const state = job.targets[platform];
          if (done(state)) continue;
          try {
            Object.assign(state, await providers[platform](p.video, job.plan[platform], state, save, env));
            delete state.session; delete state.uri; delete state.error;
            save();
            console.log(`  ${platform}: ${state.status}${state.url ? ` ${state.url}` : ''}`);
          } catch (error) {
            state.error = error.message;
            save();
            failures++;
            console.error(`  ${platform}: ${error.message}`);
          }
        }
      } catch (error) { failures++; console.error(`  ${error.message}`); }
    }
  } finally { unlock(); }
  return failures;
}
export async function main(args = process.argv.slice(2)) {
  loadEnv();
  const [command, slug, ...flags] = args;
  if (command === 'run') {
    if (args.slice(1).some(a => a !== '--execute')) throw new Error('Usage: npm run publish -- run [--execute]');
    if (await runQueue({ execute: args.includes('--execute') })) process.exitCode = 1;
    return;
  }
  if (command === 'status') {
    for (const name of existsSync(queue) ? readdirSync(queue).filter(n => /^[a-f0-9]{64}\.json$/.test(n)) : []) {
      const job = json(join(queue, name));
      console.log(JSON.stringify({ id: job.id, slug: job.slug, at: job.plan.at, targets: Object.fromEntries(Object.entries(job.targets).map(([p, s]) => [p, { status: s.status, id: s.id, url: s.url, note: s.note, error: s.error }])) }, null, 2));
    }
    return;
  }
  if (command === 'cancel') {
    if (!/^[a-f0-9]{64}$/.test(slug || '')) throw new Error('Supply a job ID from status.');
    const unlock = lockQueue();
    try {
      const file = join(queue, `${slug}.json`), job = json(file);
      if (!job) throw new Error('Job not found.');
      for (const state of Object.values(job.targets)) if (!done(state)) state.status = 'cancelled';
      privateJson(file, job);
      console.log('Local job cancelled. Existing remote uploads/posts are unchanged.');
    } finally { unlock(); }
    return;
  }
  if (!['init', 'preview', 'enqueue'].includes(command) || !slug || flags.length) throw new Error('Usage: npm run publish -- init|preview|enqueue <slug> | run [--execute] | status | cancel <job-id>');
  const p = projectPaths(slug), planFile = join(p.root, 'publish.json');
  if (command === 'init') {
    const p = ready(slug);
    if (existsSync(planFile)) throw new Error('publish.json already exists; edit it locally.');
    privateJson(planFile, { version: 1, platforms: ['youtube'], at: null, instagram: { caption: p.caption }, youtube: { title: p.caption.split('\n')[0].slice(0, 100), description: p.caption, privacy: 'private', madeForKids: false, containsSyntheticMedia: false } });
    console.log(`Created ${planFile}. Review platforms, text, privacy, audience and synthetic-media disclosure before queueing.`);
    return;
  }
  const job = await snapshot(slug);
  if (command === 'preview') { console.log(JSON.stringify(job, null, 2)); return; }
  const unlock = lockQueue();
  try {
    // Prevent a changed caption or schedule from accidentally reposting the same video.
    for (const name of existsSync(queue) ? readdirSync(queue).filter(n => /^[a-f0-9]{64}\.json$/.test(n)) : []) {
      const old = json(join(queue, name));
      if (old.slug === job.slug && old.videoHash === job.videoHash && job.plan.platforms.some(p => old.targets[p] && old.targets[p].status !== 'cancelled')) throw new Error('This video is already queued or uploaded for an overlapping platform. Use status; cancel only an unposted job before replacing it.');
    }
    privateJson(join(queue, `${job.id}.json`), job);
    console.log(`Queued ${job.id}. No upload performed. Run the queue with --execute when ready.`);
  } finally { unlock(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.code === 'ENOENT' ? 'Required local file is missing. Check the project and publishing setup.' : error.message); process.exitCode = 1; });
}
