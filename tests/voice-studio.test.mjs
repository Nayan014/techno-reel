import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { studioCatalog, downloadStudioModel, cachedKokoroVoices, describeKokoroVoice, modelRepos } from '../scripts/voice-studio.mjs';
test('Kokoro voice discovery deduplicates actual cached files', t => {
  const cache = mkdtempSync(join(tmpdir(),'kokoro-'));
  t.after(() => rmSync(cache,{recursive:true,force:true}));
  const dir = join(cache,'models--mlx-community--Kokoro-82M-bf16','snapshots','revision','voices'); mkdirSync(dir,{recursive:true});
  for (const file of ['af_heart.pt','af_heart.safetensors','am_adam.pt','README.md']) writeFileSync(join(dir,file),'voice');
  assert.deepEqual(cachedKokoroVoices(cache).map(v => v.id),['af_heart','am_adam']);
});
test('OmniVoice lists profiles and prevents downloads until the user accepts its licence in VoiceStudio', async () => {
  let accepted = false, installed = false, downloads = 0;
  const api = async (path,body) => {
    if (path === '/models') return {models:[{repo_id:modelRepos.omnivoice,installed,size_gb:2.4,license_acceptance:{required:true,accepted}}]};
    if (path === '/v1/audio/voices') return {engines:[{id:'omnivoice',available:true}],voices:[{id:'alloy',type:'openai_alias'},{voice_id:'my-profile',name:'My voice',type:'profile'}]};
    if (path === '/models/install/status') return {jobs:[]};
    if (path === '/models/install') { downloads++; assert.equal(body.repo_id,modelRepos.omnivoice); return {status:'install_started'}; }
    throw Error('unexpected endpoint');
  };
  assert.deepEqual((await studioCatalog('omnivoice',api)).voices.map(v=>v.id),['my-profile']);
  await assert.rejects(downloadStudioModel('omnivoice',api),/licence/); assert.equal(downloads,0);
  accepted = true; assert.equal((await downloadStudioModel('omnivoice',api)).status,'install_started'); assert.equal(downloads,1);
  installed = true; assert.equal((await downloadStudioModel('omnivoice',api)).status,'already_installed'); assert.equal(downloads,1);
  await assert.rejects(studioCatalog('arbitrary',api),/Unknown/);
});

test('voice descriptions show documented gender and language without guessing unknown voices', () => {
  assert.equal(describeKokoroVoice('af_bella').label, 'Bella · Female · US English (af_bella)');
  assert.equal(describeKokoroVoice('bm_george').label, 'George · Male · British English (bm_george)');
  assert.equal(describeKokoroVoice('pf_dora').language, 'Brazilian Portuguese');
  assert.equal(describeKokoroVoice('zf_xiaobei').language, 'Mandarin Chinese');
  assert.equal(describeKokoroVoice('unknown-profile').gender, undefined);
  assert.equal(describeKokoroVoice('unknown-profile').label, 'unknown-profile');
});
