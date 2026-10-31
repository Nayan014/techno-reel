import { randomUUID, createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { validateSettings } from './settings.mjs';
import { loadEnv, voiceStudio } from './lib.mjs';
const directory = '.local/avatar-references';
export const referencePattern = /^[a-f0-9-]{36}\.(png|jpg|webp)$/;
export function references() {
  return existsSync(directory) ? readdirSync(directory).filter(id => referencePattern.test(id)).map(id => ({id, url:`/media/avatar/${id}`})) : [];
}
export function referencePath(id) {
  if (!referencePattern.test(id)) throw Error('Invalid image');
  return join(directory, id);
}
export function uploadReference(bytes) {
  let ext;
  if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) ext = 'png';
  else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ext = 'jpg';
  else if (bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP') ext = 'webp';
  else throw Error('Choose a PNG, JPEG or WebP image.');
  const id = `${randomUUID()}.${ext}`;
  mkdirSync(directory, {recursive:true}); writeFileSync(referencePath(id), bytes, {mode:0o600});
  return {id, url:`/media/avatar/${id}`};
}
export const sampleText = 'Your next great idea deserves a voice. Let’s bring it to life.';
export async function voiceSample(value) {
  const s = validateSettings(value);
  loadEnv();
  const hash = createHash('sha256').update(JSON.stringify([s.provider,s.model,s.voice,sampleText])).digest('hex');
  if (s.provider !== 'voicestudio') throw Error('Only VoiceStudio previews are supported.');
  const file = `.local/cache/voice-samples/${hash}.wav`;
  if (!existsSync(file)) {
    mkdirSync('.local/cache/voice-samples', {recursive:true});
    const response = await fetch(`${voiceStudio.url()}/v1/audio/speech`, {
      method:'POST', headers:{'content-type':'application/json', ...voiceStudio.headers()},
      body:JSON.stringify({model:s.model,voice:s.voice,input:sampleText,response_format:'wav',speed:1}), signal:AbortSignal.timeout(60000)
    }).catch(() => { throw Error('VoiceStudio unavailable. Run npm run doctor, then retry.'); });
    if (!response.ok) throw Error(`VoiceStudio returned ${response.status}. Check the model setup and voice ID.`);
    writeFileSync(file,Buffer.from(await response.arrayBuffer()));
  }
  return {bytes:readFileSync(file), type:'audio/wav'};
}
