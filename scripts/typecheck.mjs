// Optional project argument checks its custom scenes alongside the kit.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { projectPaths, saveJson } from './projects.mjs';
const slug = process.argv[2];
let args = ['tsc', '--noEmit'];
if (slug) {
    const p = projectPaths(slug);
    const config = resolve('.local', 'typecheck', `${slug}.json`);
    saveJson(config, { extends: resolve('tsconfig.json'), include: [resolve('src'), resolve('remotion.config.ts'), resolve(p.scenes)] });
    args = ['tsc', '--project', config];
}
const result = spawnSync('npx', args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
