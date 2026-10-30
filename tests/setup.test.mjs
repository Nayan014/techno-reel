import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, readFileSync, realpathSync, rmSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

// Run the real CLI in a disposable project. External installation, services and Chrome
// are stubbed; orchestration, argument forwarding and exit statuses are real.
function fixture(t, script) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'techno-setup-')));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const put = (name, content, mode) => {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), content, { mode });
  };
  put('package.json', '{"type":"module"}');
  mkdirSync(join(dir, 'scripts'));
  copyFileSync(resolve(`scripts/${script}.mjs`), join(dir, `scripts/${script}.mjs`));
  put('.env.example', 'VOICE_PROVIDER=voicestudio\n');
  put('scripts/lib.mjs', `
    import {appendFileSync} from 'node:fs';
    export const fail = m => { console.error(m); process.exit(1); };
    export const loadEnv = () => {};
    export const nodeSupported = () => true;
    export const pickVoiceProvider = () => process.env.TEST_PROVIDER || 'voicestudio';
    export const hasFilters = () => false;
    export const voiceStudio = {
      ensure: async () => { appendFileSync('voice-called', 'ensure'); return false; },
      running: async () => { appendFileSync('voice-called', 'running'); return false; },
      canStart: () => false, dir: () => process.env.TEST_VOICESTUDIO_DIR || 'missing', url: () => 'http://127.0.0.1:1'
    };
  `);
  put('src/sound.ts', 'export const MUSIC = []; export const SFX = {}; export const musicFile = x => x; export const sfxFile = x => x;');
  put('node_modules/remotion/package.json', '{"name":"remotion"}');
  put('node_modules/@remotion/renderer/package.json', '{"type":"module","exports":"./index.js"}');
  put('node_modules/@remotion/renderer/index.js', `export async function ensureBrowser() { if (process.env.TEST_BROWSER_FAIL) throw new Error('browser failed'); }`);
  put('bin/npm', `#!${process.execPath}\n(await import('node:fs')).appendFileSync('npm-called', process.argv.slice(2).join(' ')); process.exit(Number(process.env.TEST_NPM_EXIT || 0));\n`, 0o755);
  for (const tool of ['git', 'uv'])
    put(`bin/${tool}`, `#!${process.execPath}\nconst args = process.argv.slice(2); if (args[0] !== '--version') (await import('node:fs')).appendFileSync(${JSON.stringify(join(dir, `${tool}-called`))}, args.join(' ') + '\\n');\n`, 0o755);
  const run = (args = [], env = {}) => spawnSync(process.execPath, [`scripts/${script}.mjs`, ...args], {
    cwd: dir, encoding: 'utf8', timeout: 10000,
    env: { PATH: `${join(dir, 'bin')}:${process.env.PATH}`, ...env },
  });
  return { dir, put, run, read: name => readFileSync(join(dir, name), 'utf8') };
}

for (const provider of ['say', 'elevenlabs']) {
  test(`setup respects ${provider}, refreshes installed packages and forwards doctor failure`, t => {
    const f = fixture(t, 'setup');
    f.put('scripts/doctor.mjs', 'process.exit(7)');
    const result = f.run([], { TEST_PROVIDER: provider });
    assert.equal(result.status, 1, result.stderr);
    assert.equal(f.read('npm-called'), 'ci');
    assert.match(result.stderr, /Checkup failed/);
    assert.throws(() => f.read('voice-called'), /ENOENT/);
  });
}

test('render-only setup forwards its mode, preserves settings and never touches voice', t => {
  const f = fixture(t, 'setup');
  f.put('.env', 'KEEP_ME=yes\n');
  f.put('scripts/doctor.mjs', `process.exit(process.argv.includes('--render-only') ? 0 : 5)`);
  const result = f.run(['--render-only']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.read('.env'), 'KEEP_ME=yes\n');
  assert.equal(f.read('npm-called'), 'ci');
  assert.throws(() => f.read('voice-called'), /ENOENT/);
});

test('setup reinstalls packages only when the lockfile is newer than the installed tree', t => {
  const f = fixture(t, 'setup');
  f.put('scripts/doctor.mjs', 'process.exit(0)');
  f.put('package-lock.json', '{}');
  f.put('node_modules/.package-lock.json', '{}');
  const installed = new Date('2026-01-02'), older = new Date('2026-01-01');
  utimesSync(join(f.dir, 'package-lock.json'), older, older);
  utimesSync(join(f.dir, 'node_modules/.package-lock.json'), installed, installed);
  const current = f.run(['--render-only']);
  assert.equal(current.status, 0, current.stderr);
  assert.match(current.stdout, /up to date/);
  assert.throws(() => f.read('npm-called'), /ENOENT/);

  utimesSync(join(f.dir, 'package-lock.json'), new Date('2026-01-03'), new Date('2026-01-03'));
  const changed = f.run(['--render-only']);
  assert.equal(changed.status, 0, changed.stderr);
  assert.equal(f.read('npm-called'), 'ci');
});

const appleSilicon = process.platform === 'darwin' && process.arch === 'arm64';

test('setup resumes its own VoiceStudio install but leaves one elsewhere alone', { skip: !appleSilicon }, t => {
  const f = fixture(t, 'setup');
  f.put('scripts/doctor.mjs', 'process.exit(0)');
  f.put('voicestudio/backend/main.py', '');
  f.put('elsewhere/backend/main.py', '');
  const own = f.run([], { TEST_VOICESTUDIO_DIR: join(f.dir, 'voicestudio') });
  assert.equal(own.status, 0, own.stderr);
  assert.equal(f.read('uv-called'), 'sync --locked --inexact\n');
  assert.throws(() => f.read('git-called'), /ENOENT/);

  rmSync(join(f.dir, 'uv-called'));
  const other = f.run([], { TEST_VOICESTUDIO_DIR: join(f.dir, 'elsewhere') });
  assert.equal(other.status, 0, other.stderr);
  assert.match(other.stdout, /installed at/);
  assert.throws(() => f.read('uv-called'), /ENOENT/);
});

test('failed package installation stops setup before voice or doctor', t => {
  const f = fixture(t, 'setup');
  f.put('scripts/doctor.mjs', 'throw new Error("must not run")');
  const result = f.run([], { TEST_NPM_EXIT: '1' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /npm ci failed/);
  assert.throws(() => f.read('voice-called'), /ENOENT/);
});

test('render-only doctor ignores even invalid voice settings and unused cloud keys', t => {
  const f = fixture(t, 'doctor');
  const result = f.run(['--render-only'], { TEST_PROVIDER: 'invalid', ELEVENLABS_API_KEY: 'unused' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Ready to render/);
  assert.throws(() => f.read('voice-called'), /ENOENT/);
});

test('ElevenLabs doctor fails on missing credentials without starting VoiceStudio', t => {
  const f = fixture(t, 'doctor');
  const result = f.run([], { TEST_PROVIDER: 'elevenlabs' });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /✗ ElevenLabs API key configured/);
  assert.match(result.stdout, /✗ ElevenLabs voice chosen/);
  assert.throws(() => f.read('voice-called'), /ENOENT/);
});

test('render-only doctor reports renderer failure through its exit status', t => {
  const f = fixture(t, 'doctor');
  const result = f.run(['--render-only'], { TEST_BROWSER_FAIL: '1' });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /browser failed/);
});

test('default doctor still requires VoiceStudio and reports its failure', t => {
  const f = fixture(t, 'doctor');
  const result = f.run();
  assert.equal(result.status, 1, result.stderr);
  assert.equal(f.read('voice-called'), 'ensure');
  assert.match(result.stdout, /✗ VoiceStudio not answering/);
});

test('setup gives an actionable renderer download failure and stops before doctor', t => {
  const f = fixture(t, 'setup');
  f.put('scripts/doctor.mjs', 'throw new Error("must not run")');
  const result = f.run(['--render-only'], { TEST_BROWSER_FAIL: '1' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Could not prepare headless Chrome: browser failed/);
  assert.match(result.stderr, /Check your network/);
});
