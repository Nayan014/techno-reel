import { createRequire } from 'node:module';
// Use the same webpack implementation already supplied by Remotion.
const require = createRequire(import.meta.url);
const webpack = createRequire(require.resolve('@remotion/bundler'))('webpack');
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectPaths } from './projects.mjs';
export function projectWebpack(slug) {
    const dir = resolve(projectPaths(slug).scenes);
    mkdirSync(dir, { recursive: true });
    return config => ({ ...config, plugins: [...(config.plugins || []), new webpack.ContextReplacementPlugin(/src[/\\]scenes[/\\]local$/, dir)] });
}
