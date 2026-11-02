import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { recordOutput, recordGate } from '../scripts/projects.mjs';
import { privateJson, snapshot, lockQueue, validatePlan } from '../scripts/publishing/state.mjs';
import { youtube, instagram, request, trustedUpload } from '../scripts/publishing/providers.mjs';
import { main, runQueue } from '../scripts/publish.mjs';
const original = process.cwd();
const env = { YOUTUBE_CLIENT_ID: 'test-client', YOUTUBE_CLIENT_SECRET: 'test-secret', YOUTUBE_REFRESH_TOKEN: 'test-refresh', INSTAGRAM_ACCOUNT_ID: '123', INSTAGRAM_ACCESS_TOKEN: 'test-token', META_GRAPH_VERSION: 'v25.0' };
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'reel-publishing-'));
  process.chdir(dir);
  t.after(() => { process.chdir(original); rmSync(dir, { recursive: true, force: true }); });
  mkdirSync('projects/one/working', { recursive: true });
  mkdirSync('projects/one/export', { recursive: true });
  privateJson('projects/one/project.json', { stage: 'exported' });
  writeFileSync('projects/one/working/script.json', '{}');
  writeFileSync('projects/one/export/one.mp4', 'video-bytes');
  writeFileSync('projects/one/export/caption.txt', 'A caption');
  recordOutput('one', 'export'); recordGate('one', 'check', []); recordGate('one', 'pace', []);
}
const response = (body, status = 200, headers = {}) => new Response(body === null ? null : JSON.stringify(body), { status, headers });
test('plans validate timezone, platforms and disclosures', () => {
  const plan = { version: 1, platforms: ['instagram'], at: null, instagram: { caption: 'caption' } };
  assert.equal(validatePlan(plan), plan);
  assert.throws(() => validatePlan({ ...plan, platforms: ['tiktok'] }));
  assert.throws(() => validatePlan({ ...plan, at: '2026-12-01T18:00:00' }));
  assert.throws(() => validatePlan({ ...plan, platforms: ['youtube'], youtube: { title: 'hi' } }));
  assert.throws(() => trustedUpload('https://www.googleapis.com.attacker.test/upload', 'www.googleapis.com'));
});
test('queue snapshots content, rejects duplicate and stale exports; preview has no uploads', async t => {
  fixture(t);
  await main(['init', 'one']);
  await main(['preview', 'one']);
  assert.ok(!existsSync('.local/publishing/queue'));
  await main(['enqueue', 'one']);
  await assert.rejects(main(['enqueue', 'one']), /already queued/);
  let uploads = 0;
  const providers = { youtube: async () => { uploads++; return { status: 'uploaded', id: 'video' }; } };
  await runQueue({ providers, env }); assert.equal(uploads, 0);
  assert.equal(await runQueue({ execute: true, providers, env }), 0);
  await runQueue({ execute: true, providers, env }); assert.equal(uploads, 1);
  writeFileSync('projects/one/working/script.json', '{"changed":true}');
  await assert.rejects(snapshot('one'), /outdated/);
});
test('queue blocks changed media and concurrent mutations; state is private', async t => {
  fixture(t); await main(['init', 'one']); await main(['enqueue', 'one']);
  const unlock = lockQueue();
  await assert.rejects(main(['enqueue', 'one']), /locked/); unlock();
  const job = await snapshot('one');
  const file = `.local/publishing/queue/${job.id}.json`;
  assert.equal(statSync(file).mode & 0o777, 0o600);
  writeFileSync('projects/one/export/one.mp4', 'changed');
  let calls = 0;
  assert.equal(await runQueue({ execute: true, env, providers: { youtube: async () => { calls++; } } }), 1);
  assert.equal(calls, 0);
});
test('YouTube recovers completed session without starting a duplicate', async t => {
  fixture(t);
  const state = { session: 'https://www.googleapis.com/upload/session' };
  const calls = [];
  const result = await youtube('projects/one/export/one.mp4', {}, state, () => {}, env, async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1 ? response({ access_token: 'access' }) : response({ id: 'abc', status: { privacyStatus: 'private' } });
  });
  assert.equal(calls.length, 2); assert.equal(calls[1].options.method, 'PUT');
  assert.equal(result.status, 'uploaded'); assert.equal(result.privacy, 'private');
});
test('YouTube resumes only missing bytes after partial upload', async t => {
  fixture(t);
  let n = 0;
  const result = await youtube('projects/one/export/one.mp4', {}, { session: 'https://www.googleapis.com/upload/session' }, () => {}, env, async (_url, options) => {
    n++;
    if (n === 1) return response({ access_token: 'access' });
    if (n === 2) return response(null, 308, { range: 'bytes=0-4' });
    assert.equal(options.headers['Content-Range'], 'bytes 5-10/11');
    let body = ''; for await (const chunk of options.body) body += chunk;
    assert.equal(body, '-bytes');
    return response({ id: 'abc' });
  });
  assert.equal(result.id, 'abc');
});
test('Instagram streams bytes, polls processing and publishes once', async t => {
  fixture(t); let n = 0; const state = {}; let saves = 0;
  const result = await instagram('projects/one/export/one.mp4', { caption: 'caption' }, state, () => saves++, env, async (url, options) => {
    n++;
    if (n === 1) { assert.equal(options.body.get('upload_type'), 'resumable'); return response({ id: '456', uri: 'https://rupload.facebook.com/ig-api-upload/456' }); }
    if (n === 2) { let bytes = ''; for await (const chunk of options.body) bytes += chunk; assert.equal(bytes, 'video-bytes'); return response({ success: true }); }
    if (n === 3) return response({ status_code: 'FINISHED' });
    assert.equal(state.publishing, true); return response({ id: '789' });
  }, async () => {});
  assert.equal(result.id, '789'); assert.equal(saves, 3); assert.equal(n, 4);
});
test('Instagram uncertain publish never issues another publish request', async t => {
  fixture(t);
  const state = { container: '456', publishing: true };
  let n = 0;
  await assert.rejects(instagram('projects/one/export/one.mp4', {}, state, () => {}, env, async () => { n++; return response({ status_code: 'FINISHED' }); }), /uncertain/);
  assert.equal(n, 1);
  const result = await instagram('projects/one/export/one.mp4', {}, state, () => {}, env, async () => response({ status_code: 'PUBLISHED' }));
  assert.equal(result.status, 'published');
});
test('provider errors never echo credentials, response bodies or signed URLs', async () => {
  await assert.rejects(request('https://example.test', {}, async () => response({ secret: 'DO-NOT-PRINT' }, 400)), error => !error.message.includes('DO-NOT-PRINT') && error.message.includes('400'));
  await assert.rejects(request('https://example.test', {}, async () => { throw new Error('DO-NOT-PRINT'); }), error => !error.message.includes('DO-NOT-PRINT'));
});
test('public repository ignores real settings, credentials, queue and project plans', () => {
  const paths = ['.env', '.env.publishing', 'client_secret_download.json', 'credentials.json', 'token.json', '.local/publishing/client.json', '.local/publishing/queue/job.json', 'projects/one/publish.json'];
  const result = spawnSync('git', ['check-ignore', ...paths], { cwd: original, encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.deepEqual(result.stdout.trim().split('\n'), paths);
});
test('YouTube fresh upload sends reviewed metadata and persists session before bytes', async t => {
  fixture(t); const state = {}; let saved = false; let n = 0;
  const plan = { title: 'Reviewed title', description: 'Reviewed caption', privacy: 'private', madeForKids: true, containsSyntheticMedia: true };
  const result = await youtube('projects/one/export/one.mp4', plan, state, () => { saved = true; }, env, async (_url, options) => {
    n++;
    if (n === 1) return response({ access_token: 'access' });
    if (n === 2) {
      const body = JSON.parse(options.body);
      assert.equal(body.status.privacyStatus, 'private');
      assert.equal(body.status.selfDeclaredMadeForKids, true);
      assert.equal(body.status.containsSyntheticMedia, true);
      assert.equal(body.snippet.title, plan.title);
      return response(null, 200, { location: 'https://www.googleapis.com/upload/session' });
    }
    assert.equal(saved, true);
    for await (const _chunk of options.body) { /* consume the local file */ }
    return response({ id: 'new-video' });
  });
  assert.equal(result.id, 'new-video');
  assert.ok(!JSON.stringify(state).includes('test-secret'));
});
test('future jobs wait and a failed platform does not repeat a successful target', async t => {
  fixture(t); await main(['init', 'one']);
  const file = 'projects/one/publish.json';
  const plan = JSON.parse(readFileSync(file, 'utf8'));
  plan.platforms = ['youtube', 'instagram']; plan.at = '2026-12-01T18:00:00+01:00';
  privateJson(file, plan); await main(['enqueue', 'one']);
  let y = 0, i = 0;
  const providers = { youtube: async () => { y++; return { status: 'uploaded', id: 'abc' }; }, instagram: async () => { i++; if (i === 1) throw new Error('Provider unavailable'); return { status: 'published', id: '123' }; } };
  await runQueue({ execute: true, env, providers, now: Date.parse('2026-12-01T16:00:00Z') });
  assert.equal(y + i, 0);
  assert.equal(await runQueue({ execute: true, env, providers, now: Date.parse('2026-12-01T17:00:00Z') }), 1);
  assert.equal(await runQueue({ execute: true, env, providers, now: Date.parse('2026-12-01T17:01:00Z') }), 0);
  assert.equal(y, 1); assert.equal(i, 2);
});
