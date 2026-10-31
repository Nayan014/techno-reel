import { renderSettings } from './settings.js';
import { splitCaptions } from './captions.mjs';
const app = document.querySelector('#app');
let projects = [], last = '', search = '';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const url = (p, category, name) => '/files/' + [p.slug, category, ...name.split('/')].map(encodeURIComponent).join('/');
const has = (p, category, name) => p.files[category].some(f => f.name === name);
const size = n => n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`;
const date = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'New';
const badge = (text, style = '') => `<span class="badge ${style}">${escape(text)}</span>`;
function fileList(p, category) {
    const files = p.files[category];
    return files.length ? `<ul class="files">${files.map(f => `<li><a href="${url(p, category, f.name)}" target="_blank" rel="noopener">${escape(f.name)}</a><small>${size(f.bytes)}</small></li>`).join('')}</ul>` : `<p class="muted">No ${category} files yet.</p>`;
}
function freshness(p, kind) {
    const state = p.freshness[kind];
    return badge(state === 'current' ? 'Up to date' : state === 'outdated' ? 'Needs updating' : 'Not verified', state === 'current' ? 'good' : 'warn');
}
function renderHome() {
    app.innerHTML = `<div class="eyebrow">Your local studio</div><h1>Every reel. One place.</h1><p class="description">Create and revise with your AI assistant. Come here to review the footage, storyboard, and finished reel.</p><div class="toolbar"><input id="search" type="search" placeholder="Find a project…" aria-label="Find a project" value="${escape(search)}"><span class="count">${projects.length} PROJECT${projects.length === 1 ? '' : 'S'}</span></div><div id="cards" class="grid"></div><div class="notice"><strong>Start a project in your AI chat</strong><p>“Create a project called my-reel. Plan it first.” Or run <code>npm run project -- my-reel</code>, then drop originals into <code>projects/my-reel/raw/</code>.</p></div>`;
    document.querySelector('#search').addEventListener('input', e => { search = e.target.value; renderCards(); });
    renderCards();
}
function renderCards() {
    const filtered = projects.filter(p => (p.name + ' ' + p.slug).toLowerCase().includes(search.toLowerCase()));
    document.querySelector('#cards').innerHTML = filtered.map(p => `<a class="card" href="#${encodeURIComponent(p.slug)}"><div class="poster">${has(p, 'export', 'cover.png') ? `<img src="${url(p, 'export', 'cover.png')}" alt="${escape(p.name)} cover">` : `<span class="placeholder">${escape(p.slug.slice(0, 2))}.</span>`}</div><div class="card-body">${badge(p.stage)}<h2>${escape(p.name)}</h2><p class="muted">${escape(p.nextAction)}</p><div class="card-meta"><span>${p.files.raw.length} source files · ${has(p, 'export', p.slug + '.mp4') ? 'Export available' : 'In progress'}</span><span>${date(p.updated)}</span></div></div></a>`).join('') || '<div class="empty">No projects found. Create your first project through your AI assistant.</div>';
}
function video(p, category, name) { const poster = category === 'export' && has(p, 'export', 'cover.png') ? ` poster="${url(p, 'export', 'cover.png')}"` : ''; return `<div class="video-wrap"><video controls preload="metadata"${poster} src="${url(p, category, name)}"></video></div>`; }
function projectSettings(p) {
    const s = p.script || {}, voice = p.voice;
    const tags = [`Style · ${s.style || 'flat'}`, `Palette · ${s.palette || 'clay'}`, voice ? `${voice.provider} · ${voice.voice}` : 'Voice not recorded', s.take ? 'Original recording' : s.host === 'character' ? 'My character' : s.host === false ? 'No presenter' : s.style === 'print' ? 'Paper presenter' : 'No presenter', s.music ? `Music · ${s.music}` : 'No music', s.handle].filter(Boolean);
    return `<section class="panel project-settings"><div class="section-label">BEHIND THIS REEL</div><h2>Look & sound</h2><div class="tag-list">${tags.map(t => badge(t)).join('')}</div><p class="muted">From this project’s script and recorded voice. Use these as a starting point for your next reel.</p><a class="button secondary" href="#settings">Explore video settings ↗</a></section>`;
}
function renderProject(p, tab) {
    const tabs = ['overview', 'raw', 'preview', 'export', 'working'];
    if (!tabs.includes(tab))
        tab = 'overview';
    app.innerHTML = `<a class="back" href="#">← ALL PROJECTS</a><div class="project-heading"><div><div class="eyebrow">Project workspace</div><h1>${escape(p.name)}</h1><div class="path">projects/${escape(p.slug)}/</div></div><div class="heading-actions"><button id="open-folder" class="secondary">Open export folder</button><button id="copy-path" class="secondary">Copy folder path</button><span id="folder-status" aria-live="polite"></span></div></div><nav class="tabs">${tabs.map(t => `<a class="${t === tab ? 'active' : ''}" href="#${encodeURIComponent(p.slug)}/${t}">${t[0].toUpperCase() + t.slice(1)}</a>`).join('')}</nav><div id="content"></div>`;
    document.querySelector('#open-folder').onclick = async () => {
        const status = document.querySelector('#folder-status');
        try {
            const response = await fetch(`/api/projects/${encodeURIComponent(p.slug)}/open-export`, {method: 'POST', headers: {'X-Dashboard-Action': 'open-folder'}});
            if (!response.ok) throw Error('Unable to open folder');
            status.textContent = 'Opened';
        } catch { status.textContent = 'Could not open folder. Use Copy folder path.'; }
    };
    document.querySelector('#copy-path').onclick = async (e) => { try {
        await navigator.clipboard.writeText(`projects/${p.slug}/`);
        e.target.textContent = 'Copied';
    }
    catch {
        e.target.textContent = `projects/${p.slug}/`;
    } };
    const content = document.querySelector('#content');
    if (tab === 'overview') {
        const final = has(p, 'export', p.slug + '.mp4');
        const latest = final ? video(p, 'export', p.slug + '.mp4') : has(p, 'preview', 'draft.mp4') ? video(p, 'preview', 'draft.mp4') : '<div class="empty"><h2>Your next reel starts here.</h2><p class="muted">Ask your assistant to prepare the script and storyboard.</p></div>';
        const checks = Object.entries(p.checks).filter(([name]) => name !== 'pace-draft');
        const tags = checks.map(([name, c]) => { const warnings = (c.results || []).some(([level]) => level.toLowerCase() === 'warn'); return badge(`${name === 'check' ? 'Timing' : name === 'pace' ? 'Motion' : name}: ${!c.current ? 'Outdated' : !c.passed ? 'Failed' : warnings ? 'Warnings' : 'Checked'}`, c.current && c.passed && !warnings ? 'good' : 'warn'); }).join('');
        const reviews = p.mode === 'plan' ? Object.entries(p.approvals).map(([name, a]) => badge(`${name}: ${!a.current ? 'Outdated' : a.status || 'Recorded'}`, a.current && a.status === 'approved' ? 'good' : 'warn')).join('') : '';
        const details = checks.map(([name, c]) => (c.results || []).map(([level, message]) => `<p class="${level === 'FAIL' ? 'error' : 'muted'}"><strong>${escape(name)} · ${escape(level)}</strong> ${escape(message)}</p>`).join('')).join('');
        content.innerHTML = `<div class="overview-layout"><section class="panel media-panel"><div class="panel-title"><div><div class="section-label">YOUR REEL</div><h2>${final ? 'Final video' : 'Latest preview'}</h2></div></div>${latest}</section><section class="panel cover-panel"><div class="panel-title"><div><div class="section-label">YOUR THUMBNAIL</div><h2>Cover image</h2></div></div>${has(p, 'export', 'cover.png') ? `<div class="cover-link"><img class="cover overview-cover" src="${url(p, 'export', 'cover.png')}" alt="${escape(p.name)} cover"></div>` : '<p class="muted">No cover yet.</p>'}</section><div class="project-sidebar"><section class="panel status-panel"><div><div class="section-label">PROJECT STATUS</div><div class="tag-list">${badge(p.stage)} ${freshness(p, 'export')} ${tags || badge('Checks not run', 'warn')} ${reviews}</div><p class="next-action">${escape(p.nextAction)}</p></div>${details || p.errors.length ? `<details><summary>Check details</summary>${details}${p.errors.map(error => `<p class="error">${escape(error)}</p>`).join('')}</details>` : ''}</section>${projectSettings(p)}</div><section class="panel caption-panel"><div class="panel-title"><div><div class="section-label">READY TO SHARE</div><h2>Captions</h2></div></div><div id="caption-view" class="caption-view muted">${has(p, 'export', 'caption.txt') ? 'Loading captions…' : 'No caption yet.'}</div></section></div>`;
        if (has(p, 'export', 'caption.txt')) fetch(url(p, 'export', 'caption.txt')).then(r => { if (!r.ok) throw Error('Unavailable'); return r.text(); }).then(text => {
            const view = document.querySelector('#caption-view');
            if (!view || !location.hash.startsWith(`#${encodeURIComponent(p.slug)}`)) return;
            view.classList.remove('muted');
            const parts = splitCaptions(text);
            const field = (key, label, spoken) => parts[key] ? `<div class="caption-item"><div class="caption-item-heading"><h4>${escape(label)}</h4><button class="secondary copy-part" data-part="${key}" aria-label="Copy ${escape(spoken)}">Copy</button></div><p>${escape(parts[key])}</p></div>` : '';
            const instagram = parts.instagram ? `<section class="caption-group"><h3 class="platform-label">Instagram</h3>${field('instagram', 'Caption', 'Instagram caption')}</section>` : '';
            const youtube = parts.title || parts.description ? `<section class="caption-group"><h3 class="platform-label">YouTube</h3>${field('title', 'Title', 'YouTube title')}${field('description', 'Description', 'YouTube description')}</section>` : '';
            const fallback = parts.fallback ? `<section class="caption-group">${field('fallback', 'Caption', 'caption')}</section>` : '';
            view.innerHTML = instagram + youtube + fallback;
            view.querySelectorAll('.copy-part').forEach(button => { button.onclick = async () => { try { await navigator.clipboard.writeText(parts[button.dataset.part]); button.textContent = 'Copied'; } catch { button.textContent = 'Select text to copy'; } }; });
        }).catch(() => { const view = document.querySelector('#caption-view'); if (view) view.textContent = 'Could not load captions.'; });
    }
    else if (tab === 'raw')
        content.innerHTML = `<section class="panel"><h2>Original footage & images</h2><p class="muted">Drop files into <code>projects/${escape(p.slug)}/raw/</code> using your file manager. Processing keeps originals untouched.</p>${fileList(p, 'raw')}</section>`;
    else if (tab === 'preview') {
        content.innerHTML = `${has(p, 'preview', 'plan.html') ? `<section class="panel"><h2>Storyboard ${freshness(p, 'plan')}</h2><iframe class="preview-frame" title="Project storyboard" sandbox src="${url(p, 'preview', 'plan.html')}"></iframe></section>` : ''}${has(p, 'preview', 'draft.mp4') ? `<section class="panel"><h2>Draft ${freshness(p, 'draft')}</h2>${video(p, 'preview', 'draft.mp4')}</section>` : ''}<section class="panel"><h2>Shot list</h2>${(p.script?.shots || []).map(s => `<div class="shot">${has(p, 'preview', `stills/${s.id}.png`) ? `<img src="${url(p, 'preview', `stills/${s.id}.png`)}" alt="Shot ${escape(s.id)}">` : `<span class="number">${escape(s.id)}</span>`}<div><h3>${escape(s.scene || s.layout || 'Shot')}</h3><p>${escape(s.say)}</p></div></div>`).join('') || '<p class="muted">No storyboard yet. Ask your assistant to plan this reel.</p>'}</section>`;
    }
    else if (tab === 'export') {
        content.innerHTML = `<div class="layout"><section class="panel"><h2>Final reel ${freshness(p, 'export')}</h2>${has(p, 'export', p.slug + '.mp4') ? video(p, 'export', p.slug + '.mp4') : '<p class="muted">Your finished video will appear here.</p>'}<div class="intro-note">${fileList(p, 'export')}</div></section><aside class="panel"><h2>Ready to post</h2>${has(p, 'export', 'cover.png') ? `<img class="cover" src="${url(p, 'export', 'cover.png')}" alt="Post cover">` : ''}<label for="caption">Post caption</label><textarea id="caption" class="caption" readonly placeholder="No caption yet."></textarea><button id="copy-caption">Copy caption</button></aside></div>`;
        if (has(p, 'export', 'caption.txt'))
            fetch(url(p, 'export', 'caption.txt')).then(r => r.text()).then(text => { const el = document.querySelector('#caption'); if (el)
                el.value = text; });
        document.querySelector('#copy-caption').onclick = async (e) => { try {
            await navigator.clipboard.writeText(document.querySelector('#caption').value);
            e.target.textContent = 'Copied';
        }
        catch {
            document.querySelector('#caption').select();
        } };
    }
    else
        content.innerHTML = `<section class="panel"><h2>Working files</h2><p class="muted">Managed by your AI assistant: script, transcripts, voice, assets, and project scenes.</p>${fileList(p, 'working')}</section>`;
}
function render() { if (location.hash === '#settings') return renderSettings(app, projects); const [slug, tab = 'overview'] = decodeURIComponent(location.hash.slice(1)).split('/'); if (!slug)
    return renderHome(); const p = projects.find(p => p.slug === slug); if (p)
    renderProject(p, tab);
else
    app.innerHTML = '<div class="empty">Project not found. <a href="#">Back to projects</a></div>'; }
async function refresh() { try {
    const r = await fetch('/api/projects');
    if (!r.ok)
        throw Error('Unavailable');
    const data = await r.json();
    const signature = JSON.stringify(data);
    if (signature !== last) {
        projects = data;
        last = signature;
        if (location.hash !== '#settings') render();
    }
}
catch {
    if (!last)
        app.innerHTML = '<p class="error">Cannot read projects. Check the dashboard terminal and refresh.</p>';
} }
window.addEventListener('hashchange', render);
if (location.hash === '#settings') render();
refresh();
setInterval(refresh, 5000);
