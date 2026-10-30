// Checks everything the kit needs and says how to fix what's missing.
// Usage: npm run doctor [-- --render-only]
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

const renderOnly = process.argv.includes("--render-only");
let studioUp = false;
if (!renderOnly) {
  // The voice engine: VoiceStudio unless VOICE_PROVIDER names another. No fallback.
  const provider = pickVoiceProvider();
  // Starts a local install that isn't running, exactly as the voice step would.
  studioUp = provider === "voicestudio" ? await voiceStudio.ensure() : false;

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
  } else if (provider === "voicestudio") {
    const hint = voiceStudio.canStart()
      ? "It is installed but didn't start; see .local/logs/voicestudio.log."
      : `Not installed at ${voiceStudio.dir()}. Run: npm run setup (or set VOICESTUDIO_DIR to an install).`;
    row(false, `VoiceStudio not answering at ${voiceStudio.url()}`, hint);
  }

  if (provider === "elevenlabs") {
    row(Boolean(env.ELEVENLABS_API_KEY), "ElevenLabs API key configured", "Set ELEVENLABS_API_KEY in .env");
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
    }
    row(
      Boolean(env.ELEVENLABS_VOICE_ID),
      "ElevenLabs voice chosen",
      "Set ELEVENLABS_VOICE_ID in .env (copy one from https://elevenlabs.io/app/voice-library)",
    );
  }

  if (provider === "say") {
    row(process.platform === "darwin" && spawnSync("say", ["-v", "?"]).status === 0,
      "macOS say available", "Choose a supported provider in .env; say requires macOS.");
    note(
      "VOICE_PROVIDER=say: the voice step uses macOS `say`, robotic, with estimated caption timing.",
      "Remove VOICE_PROVIDER from .env to use VoiceStudio.",
    );
  }
  // A VoiceStudio that isn't answering is already reported as ✗ above.
  if (provider !== "voicestudio" || studioUp)
    row(true, `Voice step will use ${provider}`);
} else {
  note("Render-only check: voice and transcription were not checked.");
}

// Talking heads: ffmpeg makes the take, VoiceStudio's speech recognition times its words.
if (!renderOnly && existsSync("node_modules/remotion")) {
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
      "Talking heads need VoiceStudio for speech recognition; run npm run doctor with VOICE_PROVIDER=voicestudio to check it.",
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
    ? (renderOnly ? "\nReady to render. Run: npm run render -- example" : "\nReady. Ask your AI coding tool for a reel.")
    : `\nFix the ✗ items above, then run npm run doctor${renderOnly ? " -- --render-only" : ""} again.`,
);
process.exit(healthy ? 0 : 1);
