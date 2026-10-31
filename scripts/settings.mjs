import { existsSync, readFileSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';

export const settingsFile = '.local/video-settings.json';
export const defaults = { provider: 'voicestudio', model: 'mlx-audio', voice: 'af_heart', style: 'flat', palette: 'clay', host: 'default', handle: '', music: 'auto', avatarReference: '' };
const choices = { provider: ['voicestudio', 'elevenlabs', 'say'], model: ['mlx-audio', 'omnivoice'], style: ['auto', 'flat', 'print'], palette: ['auto', 'clay', 'cobalt', 'forest', 'mono'], host: ['default', 'character', 'none'], music: ['auto', 'lofi', 'upbeat', 'chill', 'funk', 'none'] };
export function validateSettings(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !(k in defaults))) throw new Error('Invalid settings');
  const result = { ...defaults, ...value };
  for (const [key, options] of Object.entries(choices)) if (!options.includes(result[key])) throw new Error(`Invalid ${key}`);
  for (const key of ['voice', 'handle']) if (typeof result[key] !== 'string' || result[key].length > 120 || /[\x00-\x1f]/.test(result[key])) throw new Error(`Invalid ${key}`);
  if (result.provider !== 'say' && !result.voice.trim()) throw new Error('Voice is required');
  if (typeof result.avatarReference !== 'string' || (result.avatarReference && !/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(result.avatarReference))) throw new Error('Invalid avatar reference');
  return result;
}
export function readSettings() { return existsSync(settingsFile) ? validateSettings(JSON.parse(readFileSync(settingsFile, 'utf8'))) : null; }
export function saveSettings(value) {
  const result = validateSettings(value);
  mkdirSync('.local', { recursive: true });
  const temp = `${settingsFile}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(result, null, 2) + '\n', { mode: 0o600 });
  renameSync(temp, settingsFile);
  return result;
}
export function hostStatus() {
  const files = ['host.json', ...['idle','point','present','think','shrug','shock','cheer','wave'].map(p => `${p}.png`)];
  return { ready: files.every(file => existsSync(join('.local/host', file))), missing: files.filter(file => !existsSync(join('.local/host', file))) };
}
export function applyVoiceSettings(settings, env = process.env) {
  if (!settings) return;
  env.VOICE_PROVIDER = settings.provider;
  if (settings.provider === 'voicestudio') { env.VOICESTUDIO_MODEL = settings.model; env.VOICESTUDIO_VOICE = settings.voice; }
  if (settings.provider === 'elevenlabs') env.ELEVENLABS_VOICE_ID = settings.voice;
  if (settings.provider === 'say') env.SAY_VOICE = settings.voice;
}
