const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const choices = (items, selected) => items.map(([v,label]) => `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${esc(label)}</option>`).join('');
const prompt = `Create a cartoon presenter from this reference photo. Use thick black outlines, flat cel shading, a plain top, and the same face and clothes in all eight poses. Make a 4-column, 2-row grid, waist up with room around the hands. Top row: relaxed, pointing right, presenting, thinking. Bottom row: shrugging, shocked, cheering, waving. Closed neutral smile in every cell. Pure solid magenta (#FF00FF) background, no shadows, text or borders. No pink or purple on the character.`;
let audioUrl;
export async function renderSettings(app, projects) {
    app.innerHTML = '<p>Loading settings…</p>';
    try {
        const response = await fetch('/api/settings'); if (!response.ok) throw Error();
        const data = await response.json(); if (location.hash !== '#settings') return;
        const s = data.settings;
        app.innerHTML = `<a class="back" href="#">← ALL PROJECTS</a><div class="eyebrow settings-eyebrow">Make it yours</div><h1>Your next reel, your way.</h1><p class="description">Explore the look and sound. Save your defaults for new projects, or leave the creative choices to AI.</p>
        <form id="settings-form"><div class="settings-stack">
        <section class="panel"><div class="section-label">01 · PRESENTER</div><h2>A familiar face</h2><div class="avatar-layout"><div><div class="avatar-current">${data.host.ready ? '<img src="/media/host" alt="Current animated character"><span class="badge good">Animated character ready</span>' : '<span class="avatar-empty">＋</span><p>No animated character yet</p>'}</div><label for="host">Presenter in new videos</label><select name="host" id="host">${choices([['default','Let the style decide'],['character','My animated character'],['none','No presenter']],s.host)}</select></div><div><h3>Create or update your character</h3><p class="muted">Start with a clear photo or illustration. Upload it here, then select the reference you want your assistant to use.</p><button type="button" class="secondary" id="choose-avatar">Upload reference image</button><input type="file" id="avatar-upload" accept="image/png,image/jpeg,image/webp" hidden><span id="upload-status" role="status"></span><div class="reference-gallery" id="references"></div><input type="hidden" name="avatarReference" value="${esc(s.avatarReference)}"><details class="avatar-guide"><summary>Turn a reference into an animated presenter</summary><ol><li>Select your reference above and save settings.</li><li>Use the prompt below with your preferred image AI to make a sheet with eight poses.</li><li>Ask your assistant to prepare that sheet as your cartoon host. It checks the cutouts and mouth positions before you use it.</li></ol><button type="button" id="copy-avatar-prompt" class="secondary">Copy character prompt</button><p class="muted">Uploading saves a reference on this device. The animated character is ready once its poses have been prepared.</p></details></div></div></section>
        <section class="panel"><div class="section-label">02 · NARRATION</div><h2>Hear it before you choose it</h2><input type="hidden" name="provider" value="voicestudio"><p class="muted">Powered by VoiceStudio · local audio on your device</p><div class="settings-fields"><div id="model-field"><label for="model">VoiceStudio model</label><select name="model" id="model">${choices([['mlx-audio','Kokoro · fast preset voices'],['omnivoice','OmniVoice · multilingual / cloning']],s.model)}</select></div><div><label for="voice">Voice</label><select name="voice" id="voice"><option value="">Loading voices…</option></select></div></div><p class="muted" id="voice-description" aria-live="polite"></p><div class="model-setup"><p id="model-status" role="status">Checking model installation…</p><button type="button" class="secondary" id="download-model" hidden>Download model</button><button type="button" class="secondary" id="refresh-voices">Refresh voices & status</button> <a id="open-voicestudio" href="http://127.0.0.1:3900" target="_blank" rel="noopener">Open VoiceStudio ↗</a></div><p class="muted" id="voice-help"></p><div class="voice-audition"><p>“Your next great idea deserves a voice. Let’s bring it to life.”</p><button type="button" id="preview-voice" class="secondary">▶ Listen to this voice</button><audio id="voice-player" controls hidden></audio><span id="voice-status" role="status"></span></div></section>
        <section class="panel"><div class="section-label">03 · LOOK & FEEL</div><h2>Choose a direction</h2><p class="muted">These are style sketches. Your content and scenes will vary with each video.</p><div class="style-choices">${[['auto','Let AI choose','Pick a style for the topic.'],['flat','Flat','Bold type, outlines and punchy cards.'],['print','Print','Paper layers, soft depth and a presenter.']].map(([id,title,detail]) => `<label class="style-choice"><input type="radio" name="style" value="${id}" ${s.style === id ? 'checked' : ''}><span class="style-sketch sketch-${id}">${id === 'auto' ? '<span>✧</span><b>A fresh direction</b>' : '<small>ONE GREAT IDEA</small><b>Make it<br>stand out.</b><span class="sketch-chip">YOUR NEXT REEL ↗</span>'}</span><strong>${title}</strong><span class="muted">${detail}</span></label>`).join('')}</div><div class="settings-fields"><div><label for="palette">Colour palette</label><select name="palette" id="palette">${choices([['auto','Let AI choose'],['clay','Clay · warm terracotta'],['cobalt','Cobalt · electric blue'],['forest','Forest · natural green'],['mono','Mono · black & white']],s.palette)}</select><div class="palette-preview" id="palette-preview" aria-label="Palette preview"></div></div><div><label for="music">Music</label><select name="music" id="music">${choices([['auto','Let AI choose for the topic'],['lofi','Lo-fi'],['upbeat','Upbeat'],['chill','Chill'],['funk','Funk'],['none','No music']],s.music)}</select></div><div><label for="handle">Social handle</label><input name="handle" id="handle" maxlength="120" value="${esc(s.handle)}" placeholder="@yourhandle"></div></div></section></div><div class="settings-save"><button type="submit">Save for future projects</button><span id="settings-status" role="status"></span><p class="muted">Existing projects keep their settings. You can ask for a different choice on any reel.</p></div></form>`;
        const form = app.querySelector('form');
        let refs = data.references;
        const gallery = () => {
            app.querySelector('#references').innerHTML = refs.map(r => `<button type="button" class="reference ${form.elements.avatarReference.value === r.id ? 'selected' : ''}" data-reference="${esc(r.id)}" aria-label="Select avatar reference" aria-pressed="${form.elements.avatarReference.value === r.id}"><img src="${esc(r.url)}" alt="Uploaded avatar reference"></button>`).join('');
            app.querySelectorAll('[data-reference]').forEach(b => b.onclick = () => { form.elements.avatarReference.value = b.dataset.reference; gallery(); });
        }; gallery();
        app.querySelector('#choose-avatar').onclick = () => app.querySelector('#avatar-upload').click();
        app.querySelector('#avatar-upload').onchange = async e => {
            const file = e.target.files[0]; if (!file) return; const status = app.querySelector('#upload-status');
            if (file.size > 6291456) {status.textContent = 'Choose an image under 6 MB.'; return;}
            status.textContent = 'Uploading…';
            try { const r = await fetch('/api/avatar-reference',{method:'POST',headers:{'X-Dashboard-Action':'upload-avatar'},body:file}); const image = await r.json(); if (!r.ok) throw Error(image.error); refs.push(image); form.elements.avatarReference.value = image.id; gallery(); status.textContent = 'Reference selected. Save to use it for future projects.'; } catch(error) {status.textContent = error.message;}
        };
        app.querySelector('#copy-avatar-prompt').onclick = async e => { try { await navigator.clipboard.writeText(prompt); e.target.textContent = 'Prompt copied'; } catch { e.target.insertAdjacentHTML('afterend',`<p>${esc(prompt)}</p>`); } };
        
        let canPreview = false;
        let voiceDetails = [];
        const describeVoice = () => {
            const voice = voiceDetails.find(v => v.id === form.elements.voice.value);
            app.querySelector('#voice-description').textContent = voice ? voice.description || `Saved voice profile${voice.language ? ' · ' + voice.language : ''}. Gender and accent details are not provided by VoiceStudio.` : '';
        };
        const resetPlayer = () => { app.querySelector('#voice-player').pause(); app.querySelector('#voice-player').hidden = true; app.querySelector('#voice-status').textContent = ''; };
        const loadVoices = async (preferred = form.elements.voice.value) => {
            const model = form.elements.model.value;
            app.querySelector('#model-status').textContent = 'Checking model and voices…';
            app.querySelector('#voice-description').textContent = '';
            canPreview = false;
            app.querySelector('#preview-voice').disabled = true;
            app.querySelector('#download-model').hidden = true;
            try {
                const r = await fetch(`/api/voice-model?model=${encodeURIComponent(model)}`), result = await r.json();
                if (!r.ok) throw Error(result.error);
                if (!form.isConnected || form.elements.model.value !== model) return;
                voiceDetails = result.voices;
                const list = result.voices.map(v => [v.id,v.label || `${v.name}${v.name !== v.id ? ' · ' + v.id : ''}${v.language ? ' · '+v.language : ''}`]);
                form.elements.voice.innerHTML = list.length ? choices(list,list.some(([id]) => id === preferred) ? preferred : list[0][0]) : '<option value="">No voices available yet</option>';
                describeVoice();
                const downloading = result.job && ['downloading','cancelling'].includes(result.job.state);
                app.querySelector('#model-status').textContent = `${result.installed ? 'Model downloaded' : downloading ? 'Downloading model…' : 'Model not downloaded'} · ${result.sizeGB} GB${!result.licenceAccepted ? ' · Licence review required in VoiceStudio' : ''}${result.job?.state === 'failed' ? ' · Last download failed; retry or check VoiceStudio' : ''}${!result.engineAvailable ? ' · Engine setup required in VoiceStudio' : ''}`;
                app.querySelector('#voice-help').textContent = result.note;
                app.querySelector('#open-voicestudio').href = result.studioUrl;
                const download = app.querySelector('#download-model');
                download.hidden = result.installed;
                download.disabled = downloading || !result.licenceAccepted || !result.engineAvailable;
                download.textContent = downloading ? 'Download in progress…' : `Download model · ${result.sizeGB} GB`;
                canPreview = result.installed && result.licenceAccepted && result.engineAvailable && !!list.length;
                app.querySelector('#preview-voice').disabled = !canPreview;
                if (downloading) setTimeout(() => {if (form.isConnected && form.elements.model.value === model) loadVoices();},3000);
            } catch(error) { if (form.isConnected && form.elements.model.value === model) {app.querySelector('#model-status').textContent = error.message; form.elements.voice.innerHTML = '<option value="">Unable to load voices</option>';}}
        };
        form.elements.model.onchange = () => { resetPlayer(); form.elements.voice.innerHTML = '<option value="">Loading voices…</option>'; loadVoices(''); };
        form.elements.voice.onchange = () => {resetPlayer(); describeVoice();};
        app.querySelector('#refresh-voices').onclick = () => loadVoices();
        app.querySelector('#download-model').onclick = async e => {
            e.target.disabled = true;
            const model = form.elements.model.value;
            try { const r = await fetch(`/api/voice-model?model=${encodeURIComponent(model)}`,{method:'POST',headers:{'X-Dashboard-Action':'download-model'}}); const result = await r.json(); if (!r.ok) throw Error(result.error); await loadVoices(); }
            catch(error) {app.querySelector('#model-status').textContent = error.message; e.target.disabled = false;}
        };
        loadVoices(s.provider === 'voicestudio' ? s.voice : 'af_heart');
        const values = () => Object.fromEntries(new FormData(form));
        app.querySelector('#preview-voice').onclick = async e => {
            const button = e.target, status = app.querySelector('#voice-status'), player = app.querySelector('#voice-player'); button.disabled = true; status.textContent = 'Preparing sample…'; player.pause(); player.hidden = true;
            const requested = JSON.stringify([form.elements.provider.value,form.elements.model.value,form.elements.voice.value]);
            try { const r = await fetch('/api/voice-sample',{method:'POST',headers:{'Content-Type':'application/json','X-Dashboard-Action':'preview-voice'},body:JSON.stringify(values())}); if (!r.ok) throw Error((await r.json()).error); const blob = await r.blob(); if (!form.isConnected || requested !== JSON.stringify([form.elements.provider.value,form.elements.model.value,form.elements.voice.value])) return; if (audioUrl) URL.revokeObjectURL(audioUrl); audioUrl = URL.createObjectURL(blob); player.src = audioUrl; player.hidden = false; status.textContent = 'Sample of the selected voice'; await player.play(); } catch(error) {status.textContent = error.message;} finally {button.disabled = !canPreview;}
        };
        const palette = () => { app.querySelector('#palette-preview').className = `palette-preview palette-${form.elements.palette.value}`; app.querySelector('#palette-preview').textContent = form.elements.palette.value === 'auto' ? 'AI will choose for your topic' : 'Aa · Your next great idea'; };
        form.elements.palette.onchange = palette; palette();
        form.onsubmit = async e => { e.preventDefault(); const status = app.querySelector('#settings-status'); try { const r = await fetch('/api/settings',{method:'POST',headers:{'Content-Type':'application/json','X-Dashboard-Action':'save-settings'},body:JSON.stringify(values())}); const result = await r.json(); if (!r.ok) throw Error(result.error); status.textContent = 'Saved for future projects.'; } catch(error) {status.textContent = error.message;} };
    } catch { if (location.hash === '#settings') app.innerHTML = '<p class="error">Could not load settings. Refresh to try again.</p>'; }
}
