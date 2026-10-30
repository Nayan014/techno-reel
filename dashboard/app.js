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
function video(p, category, name) { return `<div class="video-wrap"><video controls preload="metadata" src="${url(p, category, name)}"></video></div>`; }
function renderProject(p, tab) {
    const tabs = ['overview', 'raw', 'preview', 'export', 'working'];
    if (!tabs.includes(tab))
        tab = 'overview';
    app.innerHTML = `<a class="back" href="#">← ALL PROJECTS</a><div class="project-heading"><div><div class="eyebrow">Project workspace</div><h1>${escape(p.name)}</h1><div class="path">projects/${escape(p.slug)}/</div></div><button id="copy-path" class="secondary">Copy folder path</button></div><nav class="tabs">${tabs.map(t => `<a class="${t === tab ? 'active' : ''}" href="#${encodeURIComponent(p.slug)}/${t}">${t[0].toUpperCase() + t.slice(1)}</a>`).join('')}</nav><div id="content"></div>`;
    document.querySelector('#copy-path').onclick = async (e) => { try {
        await navigator.clipboard.writeText(`projects/${p.slug}/`);
        e.target.textContent = 'Copied';
    }
    catch {
        e.target.textContent = `projects/${p.slug}/`;
    } };
    const content = document.querySelector('#content');
    if (tab === 'overview') {
        const latest = has(p, 'export', p.slug + '.mp4') ? video(p, 'export', p.slug + '.mp4') : has(p, 'preview', 'draft.mp4') ? video(p, 'preview', 'draft.mp4') : '<div class="empty"><h2>Your next reel starts here.</h2><p class="muted">Ask your assistant to prepare the script and storyboard. They will appear here as the files are created.</p></div>';
        content.innerHTML = `<div class="layout"><section class="panel"><h2>${has(p, 'export', p.slug + '.mp4') ? 'Latest export' : 'Latest preview'}</h2>${latest}</section><aside><section class="panel"><h2>Where things stand</h2><div class="status-row"><span>Stage recorded by AI</span>${badge(p.stage)}</div><div class="status-row"><span>Workflow</span>${badge(p.mode)}</div><p>${escape(p.nextAction)}</p><p class="muted">Give feedback and approvals in your AI chat. This dashboard only previews local files.</p></section><section class="panel"><h2>Checks & reviews</h2>${Object.entries(p.checks).map(([name, c]) => `<div class="status-row"><span>${escape(name)}</span>${badge(!c.current ? 'Outdated' : c.passed ? 'Passed' : 'Failed', c.current && c.passed ? 'good' : 'warn')}</div>${(c.results || []).map(([level, message]) => `<p class="${level === 'FAIL' ? 'error' : 'muted'}">${escape(message)}</p>`).join('')}`).join('') || '<p class="muted">No saved checks yet.</p>'}${Object.entries(p.approvals).map(([name, a]) => `<p>${escape(name)}: ${escape(a.current ? (a.status || 'recorded') : 'outdated approval')} ${a.note ? '— ' + escape(a.note) : ''}</p>`).join('')}<p class="muted">Export freshness: ${freshness(p, 'export')}</p></section>${p.errors.map(error => `<p class="error">${escape(error)}</p>`).join('')}</aside></div>`;
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
function render() { const [slug, tab = 'overview'] = decodeURIComponent(location.hash.slice(1)).split('/'); if (!slug)
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
        render();
    }
}
catch {
    if (!last)
        app.innerHTML = '<p class="error">Cannot read projects. Check the dashboard terminal and refresh.</p>';
} }
window.addEventListener('hashchange', render);
refresh();
setInterval(refresh, 5000);
