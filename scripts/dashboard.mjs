import { createServer } from 'node:http';
import { createReadStream, existsSync, realpathSync, statSync, readdirSync } from 'node:fs';
import { resolve, join, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectPaths, filesUnder, json, fingerprint } from './projects.mjs';
const ui = fileURLToPath(new URL('../dashboard/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4' };
const safeJson = (path, errors) => { try {
    return json(path);
}
catch {
    errors.push(`Cannot read ${path}`);
    return null;
} };
export function listProjects() {
    if (!existsSync('projects'))
        return [];
    return readdirSync('projects', { withFileTypes: true }).filter(e => e.isDirectory() && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.name)).map(e => {
        const p = projectPaths(e.name), errors = [];
        const metadata = safeJson(join(p.root, 'project.json'), errors) || {};
        const outputs = safeJson(join(p.root, 'outputs.json'), errors) || {};
        const checks = safeJson(join(p.root, 'checks.json'), errors) || {};
        const script = safeJson(join(p.working, 'script.json'), errors);
        const approvals = safeJson(join(p.root, 'approvals.json'), errors) || {};
        const files = Object.fromEntries(['raw', 'preview', 'export', 'working'].map(category => [category, filesUnder(join(p.root, category))]));
        const current = fingerprint(e.name);
        const freshness = Object.fromEntries(Object.entries(outputs).map(([kind, result]) => [kind, result?.fingerprint === current ? 'current' : 'outdated']));
        const updated = Object.values(files).flat().map(f => f.modified).sort().at(-1) || metadata.createdAt || '';
        return { slug: e.name, name: metadata.name || e.name, stage: metadata.stage || 'new', mode: metadata.mode || 'plan', nextAction: metadata.nextAction || 'Continue in your AI chat.', updated, files, script, errors, freshness, checks: Object.fromEntries(Object.entries(checks).map(([key, value]) => [key, { ...value, current: value?.fingerprint === current }])), approvals: Object.fromEntries(Object.entries(approvals).map(([key, value]) => [key, { ...value, current: value?.fingerprint === current }])) };
    }).sort((a, b) => b.updated.localeCompare(a.updated));
}
export function createDashboard() {
    return createServer((req, res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Referrer-Policy', 'no-referrer');
        // Block cross-origin access and DNS rebinding; no write routes exist.
        if (!/^127\.0\.0\.1(?::\d+)?$/.test(req.headers.host || '')) {
            res.writeHead(403);
            res.end();
            return;
        }
        if (!['GET', 'HEAD'].includes(req.method)) {
            res.writeHead(405);
            res.end();
            return;
        }
        try {
            const url = new URL(req.url, 'http://127.0.0.1');
            if (url.pathname === '/api/projects') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(listProjects()));
                return;
            }
            let path;
            if (url.pathname.startsWith('/files/')) {
                const [, , slug, category, ...parts] = decodeURIComponent(url.pathname).split('/');
                const p = projectPaths(slug);
                if (!['raw', 'preview', 'export', 'working'].includes(category))
                    throw new Error('Missing');
                const projectRoot = realpathSync(p.root);
                const base = realpathSync(join(p.root, category));
                if (!base.startsWith(projectRoot + sep))
                    throw new Error('Missing');
                path = realpathSync(resolve(base, ...parts));
                if (!path.startsWith(base + sep))
                    throw new Error('Missing');
                // Project HTML/SVG is untrusted content; forbid scripts, forms and external requests.
                res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; media-src 'self'");
            }
            else {
                const name = { '/': 'index.html', '/app.js': 'app.js', '/style.css': 'style.css' }[url.pathname];
                if (!name)
                    throw new Error('Missing');
                path = join(ui, name);
                res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self'; frame-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'");
            }
            const stat = statSync(path);
            if (!stat.isFile())
                throw new Error('Missing');
            res.setHeader('Content-Type', types[extname(path).toLowerCase()] || 'application/octet-stream');
            res.setHeader('Accept-Ranges', 'bytes');
            let start = 0, end = stat.size - 1;
            if (req.headers.range) {
                const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
                if (!match || (!match[1] && !match[2])) {
                    res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
                    res.end();
                    return;
                }
                if (match[1]) {
                    start = Number(match[1]);
                    end = match[2] ? Math.min(Number(match[2]), end) : end;
                }
                else
                    start = Math.max(0, stat.size - Number(match[2]));
                if (start > end || start >= stat.size) {
                    res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
                    res.end();
                    return;
                }
                res.statusCode = 206;
                res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
            }
            res.setHeader('Content-Length', Math.max(0, end - start + 1));
            if (req.method === 'HEAD' || stat.size === 0)
                res.end();
            else
                createReadStream(path, { start, end }).on('error', () => res.destroy()).pipe(res);
        }
        catch {
            res.writeHead(404);
            res.end('Not found');
        }
    });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const port = Number(process.env.DASHBOARD_PORT || 4173);
    const server = createDashboard();
    server.on('error', error => { console.error(`Dashboard: ${error.message}`); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`Techno Reel · http://127.0.0.1:${server.address().port}\nLocal preview only. Create and revise projects in your AI chat. Ctrl+C to stop.`));
}
