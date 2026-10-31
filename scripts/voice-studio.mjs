import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { loadEnv, voiceStudio } from './lib.mjs';
export const modelRepos = { 'mlx-audio':'mlx-community/Kokoro-82M-bf16', omnivoice:'k2-fsa/OmniVoice' };
async function request(path, body) {
  loadEnv();
  const response = await fetch(`${voiceStudio.url()}${path}`, {method:body ? 'POST':'GET',headers:{...voiceStudio.headers(),...(body ? {'content-type':'application/json'}:{})}, ...(body ? {body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)}).catch(() => {throw Error('VoiceStudio is unavailable. Run npm run doctor and retry.');});
  if (!response.ok) throw Error(`VoiceStudio returned ${response.status}. Open VoiceStudio to check setup or access.`);
  return response.json();
}
// Kokoro's published voice categories: https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md
const kokoroLanguages = {a:'US English', b:'British English', e:'Spanish', f:'French', h:'Hindi', i:'Italian', j:'Japanese', p:'Brazilian Portuguese', z:'Mandarin Chinese'};
export function describeKokoroVoice(id) {
  const match = /^([abefhijpz])([fm])_([a-z0-9_]+)$/.exec(id);
  if (!match) return {id,name:id,type:'preset',label:id,description:'No description available for this voice.'};
  const name = match[3].split('_').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
  const gender = match[2] === 'f' ? 'Female' : 'Male';
  const language = kokoroLanguages[match[1]];
  return {id,name,type:'preset',gender,language,label:`${name} · ${gender} · ${language} (${id})`,description:`${gender} voice · ${language} · Kokoro preset`};
}
export function cachedKokoroVoices(cache) {
  const snapshots = join(cache, 'models--mlx-community--Kokoro-82M-bf16', 'snapshots');
  if (!existsSync(snapshots)) return [];
  const voices = new Set();
  for (const revision of readdirSync(snapshots)) {
    const dir = join(snapshots,revision,'voices');
    if (existsSync(dir)) for (const file of readdirSync(dir)) if (/^[a-z]{2}_[a-z0-9_]+\.(safetensors|pt)$/.test(file) && existsSync(join(dir,file))) voices.add(file.replace(/\.(safetensors|pt)$/,''));
  }
  return [...voices].sort().map(describeKokoroVoice);
}
export async function studioCatalog(model, api = request) {
  if (!modelRepos[model]) throw Error('Unknown voice model');
  const [catalog, voices, installs] = await Promise.all([api('/models'),api('/v1/audio/voices'),api('/models/install/status')]);
  const row = catalog.models.find(m => m.repo_id === modelRepos[model]);
  if (!row) throw Error('This VoiceStudio version does not list the requested model.');
  const engine = voices.engines.find(e => e.id === model);
  let available = [];
  let note = '';
  if (model === 'mlx-audio') {
    available = (engine?.preset_voices || []).map(describeKokoroVoice);
    if (!available.length) {
      let cache = process.env.HF_HUB_CACHE || join(process.env.HF_HOME || join(homedir(),'.cache/huggingface'),'hub');
      // Older VoiceStudio APIs omit Kokoro presets. Read its configured local model cache.
      try { cache = (await api('/api/settings/storage/models-dir')).effective || cache; } catch {}
      loadEnv();
      if (['localhost','127.0.0.1','[::1]'].includes(new URL(voiceStudio.url()).hostname)) available = [...new Map([...cachedKokoroVoices(cache),...cachedKokoroVoices(join(cache,'hub'))].map(v => [v.id,v])).values()];
      note = available.length ? 'Voice IDs discovered from downloaded Kokoro voice files. Non-English presets require matching language setup in VoiceStudio.' : 'This VoiceStudio API does not publish Kokoro presets. Download the model locally, then refresh the voices.';
    }
  } else {
    available = (voices.voices || []).filter(v => v.type === 'profile').map(v => ({id:v.voice_id || v.id,name:v.name,type:'profile',language:v.language}));
    note = 'OmniVoice uses saved voice profiles, rather than a fixed list of preset speakers. Create profiles in VoiceStudio to add more voices.';
  }
  const job = (installs.jobs || []).find(j => j.repo_id === row.repo_id);
  return {model, studioUrl:new URL(voiceStudio.url()).origin, repo:row.repo_id, installed:row.installed && !row.incomplete, sizeGB:row.size_gb, engineAvailable:!!engine?.available, reason:engine?.reason || '', licenceRequired:!!row.license_acceptance?.required, licenceAccepted:!row.license_acceptance?.required || !!row.license_acceptance?.accepted, voices:available, note, job:job ? {state:job.state,percent:job.pct ?? null} : null};
}
export async function downloadStudioModel(model, api = request) {
  const status = await studioCatalog(model,api);
  if (!status.licenceAccepted) throw Error('Review and accept this model’s licence in VoiceStudio first, then refresh.');
  if (status.installed) return {status:'already_installed'};
  if (!status.engineAvailable) throw Error('Set up the engine in VoiceStudio before downloading its weights.');
  return api('/models/install',{repo_id:status.repo});
}
