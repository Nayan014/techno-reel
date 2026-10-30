// Copy-first migration: originals remain available for rollback. Default is a dry run.
import { existsSync, readdirSync, readFileSync, mkdirSync, copyFileSync, statSync, utimesSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { filesUnder, projectPaths, json, saveJson } from './projects.mjs';
const manifestFile = '.local/migration.json';
const digest = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const args = process.argv.slice(2);
try {
    if (args.includes('--rollback')) {
        const manifest = json(manifestFile, []);
        for (const entry of manifest)
            if (existsSync(entry.to) && digest(entry.to) !== entry.hash)
                throw new Error(`Changed since migration; keeping all files: ${entry.to}`);
        for (const entry of [...manifest].reverse())
            if (existsSync(entry.to))
                rmSync(entry.to);
        rmSync(manifestFile, { force: true });
        console.log('Removed unchanged migration copies. Originals are untouched. Empty project folders may be removed manually.');
    }
    else {
        const copies = [];
        const add = (from, to) => { if (existsSync(from))
            copies.push({ from, to }); };
        const addTree = (from, to) => { for (const file of filesUnder(from))
            add(join(from, file.name), join(to, file.name)); };
        const slugs = new Set();
        for (const base of ['public/reels', 'out']) {
            if (!existsSync(base))
                continue;
            for (const entry of readdirSync(base, { withFileTypes: true }))
                if (entry.isDirectory() && (base === 'public/reels' || existsSync(join('public/reels', entry.name))))
                    slugs.add(entry.name);
        }
        for (const slug of slugs) {
            const p = projectPaths(slug);
            addTree(join('public/reels', slug), p.working);
            for (const file of filesUnder(join('out', slug))) {
                const preview = file.name === 'plan.html' || file.name.includes('draft') || file.name.startsWith('stills/') || file.name.startsWith('icons/');
                const final = [slug + '.mp4', 'cover.png', 'caption.txt'].includes(file.name);
                if (preview || final)
                    add(join('out', slug, file.name), join(preview ? p.preview : p.exports, file.name === slug + '-draft.mp4' ? 'draft.mp4' : file.name));
                else
                    console.log(`Keeping unclassified legacy file: out/${slug}/${file.name}`);
            }
        }
        addTree('out/sfx-cache', '.local/cache/sfx');
        addTree('out/sfx', '.local/cache/sfx-preview');
        addTree('out/host', '.local/cache/host');
        addTree('public/host', '.local/host');
        add('out/voicestudio.log', '.local/logs/voicestudio.log');
        // Preflight the entire move before copying anything.
        for (const entry of copies)
            if (existsSync(entry.to) && digest(entry.from) !== digest(entry.to))
                throw new Error(`Destination conflict: ${entry.to}. No files copied.`);
        const missing = copies.filter(entry => !existsSync(entry.to));
        console.log(`${missing.length} files to copy; ${copies.length - missing.length} already migrated. Originals stay untouched.`);
        for (const slug of slugs)
            console.log(`  ${slug} → ${projectPaths(slug).root}`);
        if (args.includes('--apply')) {
            const manifest = json(manifestFile, []);
            for (const entry of missing) {
                mkdirSync(dirname(entry.to), { recursive: true });
                copyFileSync(entry.from, entry.to);
                const stat = statSync(entry.from);
                utimesSync(entry.to, stat.atime, stat.mtime);
                manifest.push({ ...entry, hash: digest(entry.to) });
                saveJson(manifestFile, manifest);
            }
            for (const slug of slugs) {
                const p = projectPaths(slug);
                for (const dir of [p.raw, p.preview, p.exports, p.scenes])
                    mkdirSync(dir, { recursive: true });
                if (!existsSync(join(p.root, 'project.json')))
                    saveJson(join(p.root, 'project.json'), { version: 1, name: slug, stage: 'migrated', mode: 'plan', createdAt: new Date().toISOString() });
            }
            console.log('Migration complete. Existing exports are shown as unverified until re-rendered. Rollback: npm run migrate -- --rollback');
        }
        else
            console.log('Preview only. Apply with: npm run migrate -- --apply');
        const localScenes = filesUnder('src/scenes/local').filter(f => f.name.endsWith('.tsx'));
        if (localScenes.length)
            console.log('Legacy custom scenes require assignment: copy each into its project working/scenes/ folder. Originals were preserved.');
    }
}
catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
