import { readSettings } from './settings.mjs';
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, readdirSync, statSync, lstatSync, rmSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { createHash } from 'node:crypto';
export function projectPaths(slug) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || ''))
        throw new Error('Project name must use lowercase letters, numbers and single hyphens.');
    const root = join('projects', slug);
    return { slug, root, raw: join(root, 'raw'), preview: join(root, 'preview'), exports: join(root, 'export'), working: join(root, 'working'), scenes: join(root, 'working', 'scenes') };
}
export function json(path, fallback = null) {
    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;
}
export function saveJson(path, value) {
    mkdirSync(resolve(path, '..'), { recursive: true });
    writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
}
export function createProject(slug, name = slug) {
    const p = projectPaths(slug);
    if (existsSync(p.root))
        throw new Error(`Project already exists: ${p.root}`);
    for (const path of [p.raw, p.preview, p.exports, p.working, p.scenes])
        mkdirSync(path, { recursive: true });
    const settings = readSettings();
    if (settings) saveJson(join(p.root, 'video-settings.json'), settings);
    saveJson(join(p.root, 'project.json'), { version: 1, name, createdAt: new Date().toISOString(), mode: 'plan', stage: 'new' });
    return p;
}
export function ensureExample() {
    const p = projectPaths('example');
    if (!existsSync(p.root)) {
        createProject('example', 'Example reel');
        cpSync('examples/example', p.working, { recursive: true });
    }
    return p;
}
// Public URLs remain reels/<slug>/…; disk storage has one canonical working directory.
export function assetPath(url) {
    const match = /^reels\/([^/]+)\/(.+)$/.exec(url);
    if (!match)
        throw new Error(`Not a project asset: ${url}`);
    const base = resolve(projectPaths(match[1]).working);
    const path = resolve(base, match[2]);
    if (!path.startsWith(base + sep))
        throw new Error('Asset escapes project');
    return path;
}
// Generated render staging is disposable, never a second editable project.
export function preparePublic(slug) {
    const p = projectPaths(slug);
    const target = resolve('.local', 'render', slug, 'public');
    rmSync(target, { recursive: true, force: true });
    mkdirSync(target, { recursive: true });
    for (const name of ['sfx', 'music'])
        if (existsSync(join('public', name)))
            cpSync(join('public', name), join(target, name), { recursive: true });
    if (existsSync('.local/host'))
        cpSync('.local/host', join(target, 'host'), { recursive: true });
    cpSync(p.working, join(target, 'reels', slug), { recursive: true, filter: path => !path.endsWith(`${sep}scenes`) && !path.includes('.pending.') && !path.endsWith(`${sep}pace.gray`) });
    return target;
}
export function filesUnder(dir, prefix = '') {
    if (!existsSync(dir) || lstatSync(dir).isSymbolicLink())
        return [];
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const path = join(dir, entry.name);
        // Never follow links from project data into files outside the project.
        if (entry.isSymbolicLink())
            return [];
        const name = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory())
            return filesUnder(path, name);
        if (!entry.isFile())
            return [];
        const s = statSync(path);
        return [{ name, bytes: s.size, modified: s.mtime.toISOString() }];
    });
}
export function fingerprint(slug) {
    const p = projectPaths(slug);
    const hash = createHash('sha256');
    for (const file of filesUnder(p.working).filter(f => !f.name.includes('.pending.') && f.name !== 'pace.gray').sort((a, b) => a.name.localeCompare(b.name))) {
        hash.update(file.name);
        hash.update(file.bytes > 1048576 ? `${file.bytes}:${file.modified}` : readFileSync(join(p.working, file.name)));
    }
    // Include shared rendering inputs; changing kit code or the host invalidates the export too.
    for (const dir of ['src', 'public/sfx', 'public/music', '.local/host']) {
        for (const file of filesUnder(dir).sort((a, b) => a.name.localeCompare(b.name))) {
            hash.update(`${dir}/${file.name}`);
            hash.update(readFileSync(join(dir, file.name)));
        }
    }
    return hash.digest('hex');
}
export function recordOutput(slug, kind, inputFingerprint = fingerprint(slug)) {
    const p = projectPaths(slug);
    const file = join(p.root, 'outputs.json');
    const outputs = json(file, {});
    outputs[kind] = { fingerprint: inputFingerprint, createdAt: new Date().toISOString() };
    saveJson(file, outputs);
}
export function recordGate(slug, kind, results) {
    const p = projectPaths(slug);
    const file = join(p.root, 'checks.json');
    const checks = json(file, {});
    const inputFingerprint = kind.startsWith('pace')
        ? json(join(p.root, 'outputs.json'), {})[kind === 'pace-draft' ? 'draft' : 'export']?.fingerprint || 'unverified'
        : fingerprint(slug);
    checks[kind] = { fingerprint: inputFingerprint, createdAt: new Date().toISOString(), passed: !results.some(([level]) => level === 'FAIL'), results };
    saveJson(file, checks);
}
