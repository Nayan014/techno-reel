import { createReadStream, statSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

// Never expose provider bodies, tokens, signed upload URLs or network error causes.
export async function request(url, options = {}, fetcher = fetch) {
  let response;
  try { response = await fetcher(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(15 * 60 * 1000) }); }
  catch { throw new Error('Provider connection failed; retry after checking the saved upload state.'); }
  if (!response.ok && response.status !== 308) throw new Error(`Provider request failed (HTTP ${response.status}). Check account permissions, token expiry and platform limits.`);
  return response;
}
async function data(response) {
  try { return await response.json(); } catch { throw new Error('Provider returned an invalid response.'); }
}
export function trustedUpload(value, host) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Missing upload URL.'); }
  if (url.protocol !== 'https:' || url.hostname !== host || url.port || url.username || url.password) throw new Error('Untrusted upload destination.');
  return url.href;
}
function required(env, names) {
  for (const name of names) if (!env[name]) throw new Error(`Set ${name} in your local .env first.`);
}
export function preflight(platform, env = process.env) {
  if (platform === 'youtube') required(env, ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN']);
  else {
    required(env, ['INSTAGRAM_ACCOUNT_ID', 'INSTAGRAM_ACCESS_TOKEN', 'META_GRAPH_VERSION']);
    if (!/^\d+$/.test(env.INSTAGRAM_ACCOUNT_ID) || !/^v\d+\.0$/.test(env.META_GRAPH_VERSION)) throw new Error('Invalid Instagram account ID or Meta API version.');
  }
}
export async function youtube(file, plan, state, save, env = process.env, fetcher = fetch) {
  preflight('youtube', env);
  const tokenResponse = await data(await request('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ client_id: env.YOUTUBE_CLIENT_ID, client_secret: env.YOUTUBE_CLIENT_SECRET, refresh_token: env.YOUTUBE_REFRESH_TOKEN, grant_type: 'refresh_token' }) }, fetcher));
  if (!tokenResponse.access_token) throw new Error('YouTube authorization did not return an access token.');
  const authorization = `Bearer ${tokenResponse.access_token}`;
  const size = statSync(file).size;
  let offset = 0;
  if (state.session) {
    const response = await request(trustedUpload(state.session, 'www.googleapis.com'), { method: 'PUT', headers: { authorization, 'Content-Range': `bytes */${size}`, 'Content-Length': '0' } }, fetcher);
    if (response.status !== 308) return youtubeResult(await data(response));
    const range = response.headers.get('range');
    if (range && !/^bytes=0-\d+$/.test(range)) throw new Error('Invalid upload offset.');
    offset = range ? Number(range.split('-')[1]) + 1 : 0;
    if (offset >= size) throw new Error('Upload completion is uncertain; inspect YouTube Studio before retrying.');
  } else {
    const response = await request('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST', headers: { authorization, 'Content-Type': 'application/json', 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(size) },
      body: JSON.stringify({ snippet: { title: plan.title, description: plan.description }, status: { privacyStatus: plan.privacy, selfDeclaredMadeForKids: plan.madeForKids, containsSyntheticMedia: plan.containsSyntheticMedia } }),
    }, fetcher);
    state.session = trustedUpload(response.headers.get('location'), 'www.googleapis.com');
    save();
  }
  const response = await request(state.session, { method: 'PUT', headers: { authorization, 'Content-Type': 'video/mp4', 'Content-Length': String(size - offset), 'Content-Range': `bytes ${offset}-${size - 1}/${size}` }, body: createReadStream(file, { start: offset }), duplex: 'half' }, fetcher);
  if (response.status === 308) throw new Error('Upload incomplete; run the queue again to resume.');
  return youtubeResult(await data(response));
}
function youtubeResult(result) {
  if (!/^[\w-]+$/.test(result.id || '')) throw new Error('YouTube did not return a video ID.');
  return { status: 'uploaded', id: result.id, url: `https://www.youtube.com/watch?v=${result.id}`, privacy: result.status?.privacyStatus, note: 'Upload accepted; processing and availability are managed by YouTube.' };
}
export async function instagram(file, plan, state, save, env = process.env, fetcher = fetch, sleep = delay) {
  preflight('instagram', env);
  const base = `https://graph.facebook.com/${env.META_GRAPH_VERSION}`;
  const headers = { authorization: `Bearer ${env.INSTAGRAM_ACCESS_TOKEN}` };
  const getStatus = async () => data(await request(`${base}/${state.container}?fields=status_code`, { headers }, fetcher));
  if (!state.container) {
    const result = await data(await request(`${base}/${env.INSTAGRAM_ACCOUNT_ID}/media`, { method: 'POST', headers, body: new URLSearchParams({ media_type: 'REELS', upload_type: 'resumable', caption: plan.caption, share_to_feed: 'true', thumb_offset: '0' }) }, fetcher));
    if (!/^\d+$/.test(result.id || '')) throw new Error('Instagram did not return a container ID.');
    state.container = result.id;
    state.uri = trustedUpload(result.uri, 'rupload.facebook.com');
    save();
  }
  if (state.publishing) {
    const result = await getStatus();
    if (result.status_code === 'PUBLISHED') return { status: 'published', container: state.container, note: 'Published; find the Reel on the connected Instagram profile.' };
    throw new Error('Instagram publish result is uncertain. Inspect your profile before any manual retry; automatic republishing is blocked.');
  }
  if (!state.uploaded) {
    const size = statSync(file).size;
    if (size > 1_000_000_000) throw new Error('Instagram video exceeds 1 GB.');
    const upload = await data(await request(trustedUpload(state.uri, 'rupload.facebook.com'), { method: 'POST', headers: { authorization: `OAuth ${env.INSTAGRAM_ACCESS_TOKEN}`, offset: '0', file_size: String(size), 'Content-Length': String(size), 'Content-Type': 'application/octet-stream' }, body: createReadStream(file), duplex: 'half' }, fetcher));
    if (upload.success !== true) throw new Error('Instagram did not confirm the file upload.');
    state.uploaded = true;
    save();
  }
  let finished = false;
  for (let i = 0; i < 30; i++) {
    const result = await getStatus();
    if (result.status_code === 'FINISHED') { finished = true; break; }
    if (['ERROR', 'EXPIRED'].includes(result.status_code)) throw new Error('Instagram processing failed or container expired. Inspect the container before creating a replacement.');
    await sleep(10000);
  }
  if (!finished) throw new Error('Instagram is still processing; run the queue again later.');
  state.publishing = true;
  save(); // A lost response must never cause an automatic duplicate publish.
  const result = await data(await request(`${base}/${env.INSTAGRAM_ACCOUNT_ID}/media_publish`, { method: 'POST', headers, body: new URLSearchParams({ creation_id: state.container }) }, fetcher));
  if (!/^\d+$/.test(result.id || '')) throw new Error('Instagram publish result is uncertain.');
  return { status: 'published', id: result.id };
}
