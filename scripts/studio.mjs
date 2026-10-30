import { spawnSync } from 'node:child_process';
import { ensureExample, projectPaths, preparePublic } from './projects.mjs';
const slug = process.argv[2] || 'example';
if (slug === 'example')
    ensureExample();
projectPaths(slug);
const publicDir = preparePublic(slug);
const result = spawnSync('npx', ['remotion', 'studio', '--public-dir', publicDir, '--props', JSON.stringify({ slug })], { stdio: 'inherit', env: { ...process.env, REEL_PROJECT: slug } });
process.exit(result.status ?? 1);
