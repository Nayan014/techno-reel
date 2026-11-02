import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, mkdirSync, readFileSync, writeFileSync, renameSync, chmodSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { projectPaths, json, fingerprint } from '../projects.mjs';

export function privateJson(file, data) {
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.${randomUUID()}.tmp`;
  writeFileSync(temporary, JSON.stringify(data, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  renameSync(temporary, file);
  chmodSync(file, 0o600);
}
export async function digest(file) {
  const hash = createHash('sha256');
  for await (const bytes of createReadStream(file)) hash.update(bytes);
  return hash.digest('hex');
}
export function ready(slug) {
  const p = projectPaths(slug);
  const current = fingerprint(slug);
  if (json(join(p.root, 'project.json'))?.stage !== 'exported') throw new Error('Project must be exported before publishing.');
  if (json(join(p.root, 'outputs.json'))?.export?.fingerprint !== current) throw new Error('Final export is missing or outdated. Render again.');
  const checks = json(join(p.root, 'checks.json'), {});
  for (const gate of ['check', 'pace']) {
    if (checks[gate]?.passed !== true || checks[gate]?.fingerprint !== current) throw new Error(`Current ${gate} gate must pass before publishing.`);
  }
  return { ...p, video: join(p.exports, `${slug}.mp4`), caption: readFileSync(join(p.exports, 'caption.txt'), 'utf8').trim() };
}
export function validatePlan(plan) {
  if (!plan || plan.version !== 1 || !Array.isArray(plan.platforms) || !plan.platforms.length || new Set(plan.platforms).size !== plan.platforms.length || plan.platforms.some(p => !['instagram', 'youtube'].includes(p))) throw new Error('Select instagram and/or youtube in platforms.');
  if (plan.at !== null && (typeof plan.at !== 'string' || !/(Z|[+-]\d\d:\d\d)$/.test(plan.at) || !Number.isFinite(Date.parse(plan.at)))) throw new Error('at must be null or an ISO date with timezone.');
  if (plan.platforms.includes('instagram') && (typeof plan.instagram?.caption !== 'string' || !plan.instagram.caption.trim() || [...plan.instagram.caption].length > 2200)) throw new Error('Instagram caption must contain 1–2200 characters.');
  if (plan.platforms.includes('youtube')) {
    const y = plan.youtube;
    if (!y || typeof y.title !== 'string' || !y.title.trim() || [...y.title].length > 100 || /[<>]/.test(y.title) || typeof y.description !== 'string' || Buffer.byteLength(y.description) > 5000 || /[<>]/.test(y.description) || !['private', 'unlisted', 'public'].includes(y.privacy) || typeof y.madeForKids !== 'boolean' || typeof y.containsSyntheticMedia !== 'boolean') throw new Error('Invalid YouTube title, description, privacy, or disclosure settings.');
  }
  return plan;
}
export async function snapshot(slug) {
  const p = ready(slug);
  const plan = validatePlan(json(join(p.root, 'publish.json')));
  const videoHash = await digest(p.video);
  const id = createHash('sha256').update(JSON.stringify({ slug, videoHash, plan })).digest('hex');
  return { id, slug, videoHash, plan, createdAt: new Date().toISOString(), targets: Object.fromEntries(plan.platforms.map(p => [p, { status: 'pending' }])) };
}
export function lockQueue(dir = '.local/publishing') {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = join(dir, 'worker.lock');
  let fd;
  try { fd = openSync(file, 'wx', 0o600); } catch { throw new Error('Publishing is locked. If a worker crashed, verify it has stopped before removing .local/publishing/worker.lock.'); }
  writeFileSync(fd, String(process.pid));
  return () => { closeSync(fd); unlinkSync(file); };
}
