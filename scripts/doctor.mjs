// Checks everything the kit needs and says how to fix what's missing.
// Usage: npm run doctor
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { MUSIC, SFX, musicFile, sfxFile } from "../src/sound.ts";
import {
  hasFilters,
  loadEnv,
  nodeSupported,
  pickVoiceProvider,
  voiceStudio,
} from "./lib.mjs";

loadEnv();
const env = process.env;

let healthy = true;
const row = (pass, label, fix) => {
  console.log(`${pass ? "✓" : "✗"} ${label}`);
  if (!pass) {
    healthy = false;
    if (fix) console.log(`    → ${fix}`);
  }
};
const note = (label, hint) => {
  console.log(`! ${label}`);
  if (hint) console.log(`    → ${hint}`);
};

row(
  nodeSupported(),
  `Node ${process.versions.node} (need ≥ 22.18)`,
  "Install Node 24 LTS from https://nodejs.org",
);
row(
  existsSync("node_modules/remotion"),
  "Dependencies installed",
  "Run: npm run setup",
);
row(
  [
    ...Object.entries(SFX).flatMap(([name, takes]) =>
      Array.from({ length: takes }, (_, i) => sfxFile(name, i)),
    ),
    ...MUSIC.map(musicFile),
  ].every((file) => existsSync(`public/${file}`)),
  "Sound effects and music",
  "Run: npm run sfx",
);

// Voice engines, in the order the voice step tries them.
const provider = await pickVoiceProvider();
// Starts a local install that isn't running, exactly as the voice step would.
const studioUp = await voiceStudio.ensure();

if (studioUp) {
  const res = await fetch(`${voiceStudio.url()}/v1/audio/voices`, {
    headers: voiceStudio.headers(),
  }).catch(() => null);
  const body = res?.ok ? await res.json() : null;
  const voices = Array.isArray(body)
    ? body
    : (body?.voices ?? body?.data ?? []);
  // OpenAI-named aliases all map to the engine default; only saved profiles are real choices.
  const profiles = voices.filter((voice) => voice.type !== "openai_alias");
  row(true, `VoiceStudio running at ${voiceStudio.url()}`);
  console.log(
    `    engine ${voiceStudio.model()} · voice ${voiceStudio.voice()} (VOICESTUDIO_MODEL / VOICESTUDIO_VOICE)`,
  );
  for (const voice of profiles.slice(0, 12))
    console.log(
      `    saved voice: ${voice.name ?? "?"}  ·  ${voice.voice_id ?? voice.id}`,
    );
} else {
  const hint = voiceStudio.canStart()
    ? "It is installed but didn't start; see out/voicestudio.log."
    : `Not installed at ${voiceStudio.dir()}. Run: npm run setup (or set VOICESTUDIO_DIR to an install).`;
  if (provider === "voicestudio")
    row(false, `VoiceStudio not answering at ${voiceStudio.url()}`, hint);
  else note(`VoiceStudio not running at ${voiceStudio.url()}`, hint);
}

if (env.ELEVENLABS_API_KEY) {
  const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY },
  }).catch(() => null);
  if (res?.ok) {
    const sub = await res.json();
    row(
      true,
      `ElevenLabs key works (${sub.character_count}/${sub.character_limit} characters used this month)`,
    );
  } else {
    const detail = res
      ? `${res.status} ${(await res.text()).slice(0, 160)}`
      : "network error";
    row(
      false,
      `ElevenLabs key check failed: ${detail}`,
      "Check ELEVENLABS_API_KEY in .env",
    );
  }
  row(
    Boolean(env.ELEVENLABS_VOICE_ID),
    "ElevenLabs voice chosen",
    "Set ELEVENLABS_VOICE_ID in .env (copy one from https://elevenlabs.io/app/voice-library)",
  );
}

if (provider === "say")
  note(
    "Voice step will use macOS `say`: free but robotic, with estimated caption timing.",
  );
else if (provider === "voicestudio" && !studioUp) {
  // Already reported as ✗ above.
} else if (provider) row(true, `Voice step will use ${provider}`);
else
  row(
    false,
    "No voice engine",
    "Open the VoiceStudio app, or add ELEVENLABS_API_KEY to .env",
  );

// Talking heads: ffmpeg makes the take, VoiceStudio's speech recognition times its words.
if (existsSync("node_modules/remotion")) {
  const system = spawnSync("ffmpeg", ["-version"]).status === 0;
  if (system && hasFilters("afftdn"))
    row(true, "ffmpeg for talking heads (with noise reduction)");
  else {
    row(true, "ffmpeg for talking heads (Remotion's copy)");
    note(
      "Takes get levelled but not denoised.",
      "For noise reduction too: brew install ffmpeg",
    );
  }
  if (studioUp) row(true, "Speech recognition for talking heads (VoiceStudio)");
  else
    note(
      "Talking heads need VoiceStudio for speech recognition; it isn't answering.",
    );
}

if (existsSync("node_modules/remotion")) {
  const { ensureBrowser } = await import("@remotion/renderer");
  try {
    await ensureBrowser();
    row(true, "Headless Chrome for rendering");
  } catch (error) {
    row(false, "Headless Chrome for rendering", error.message);
  }
}

console.log(
  healthy
    ? "\nReady. Ask Claude for a reel."
    : "\nFix the ✗ items above, then run npm run doctor again.",
);
process.exit(healthy ? 0 : 1);
