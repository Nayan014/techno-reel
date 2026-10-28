import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, openSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

export const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

export const readJson = (path) =>
  existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;

/** `--name=value` from argv, or `fallback`. */
export const option = (name, fallback) => {
  const hit = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

/** The reel slug (first non-flag argument) and its folder under public/. */
export const reelArgs = (usage) => {
  const slug = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  if (!slug) fail(`Usage: ${usage}`);
  const dir = join("public", "reels", slug);
  if (!existsSync(join(dir, "script.json")))
    fail(`${dir}/script.json not found`);
  return { slug, dir };
};

/** "ffmpeg" when it's on PATH (more filters, e.g. noise reduction), else null. */
const systemFfmpeg = () =>
  spawnSync("ffmpeg", ["-version"]).status === 0 ? "ffmpeg" : null;

/**
 * Runs ffmpeg and returns everything it printed. Uses the one on PATH when there is one,
 * otherwise the build that ships with Remotion.
 */
export const ffmpeg = (args) => {
  const [command, prefix] = systemFfmpeg()
    ? ["ffmpeg", []]
    : ["npx", ["remotion", "ffmpeg"]];
  const run = spawnSync(command, [...prefix, "-hide_banner", ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const log = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  if (run.status !== 0)
    fail(
      `ffmpeg failed:\n${(log || run.error?.message || "").trim().split("\n").slice(-8).join("\n")}`,
    );
  return log;
};

/** True when the ffmpeg in use has every one of `filters`. */
export const hasFilters = (...filters) => {
  const list = ffmpeg(["-filters"]);
  return filters.every((name) => new RegExp(`\\s${name}\\s`).test(list));
};

/** Length of a PCM WAV in seconds. */
export const wavSeconds = (buffer) => {
  let offset = 12;
  let byteRate = 0;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === "fmt ") byteRate = buffer.readUInt32LE(offset + 16);
    if (id === "data")
      return Math.min(size, buffer.length - offset - 8) / byteRate;
    offset += 8 + size + (size % 2);
  }
  fail("Could not read the WAV");
};

export const round = (n) => Math.round(n * 1000) / 1000;

/** Remotion needs Node 22.18 or newer. */
export const nodeSupported = () => {
  const [major, minor] = process.versions.node.split(".").map(Number);
  return major > 22 || (major === 22 && minor >= 18);
};

export const loadEnv = () => {
  try {
    process.loadEnvFile(".env");
  } catch {}
};

export const VOICE_PROVIDERS = ["voicestudio", "elevenlabs", "say"];

/** VoiceStudio's local API (https://github.com/debpalash/VoiceStudio). */
export const voiceStudio = {
  url: () =>
    (process.env.VOICESTUDIO_URL || "http://127.0.0.1:3900").replace(
      /\/+$/,
      "",
    ),
  /** Engine id. Kokoro via MLX-Audio: Apache-2.0, no licence to accept, Apple Silicon only. */
  model: () => process.env.VOICESTUDIO_MODEL || "mlx-audio",
  /** Kokoro's only grade-A English voice (see its VOICES.md). */
  voice: () => process.env.VOICESTUDIO_VOICE || "af_heart",
  /** Loopback needs no key; a remote backend may require one. */
  headers: () =>
    process.env.VOICESTUDIO_API_KEY
      ? { authorization: `Bearer ${process.env.VOICESTUDIO_API_KEY}` }
      : {},
  running: async () => {
    try {
      const res = await fetch(
        `${voiceStudio.url()}/.well-known/voicestudio-speech`,
        {
          headers: voiceStudio.headers(),
          signal: AbortSignal.timeout(1500),
        },
      );
      return res.ok;
    } catch {
      return false;
    }
  },
  /**
   * The headless backend checkout (git clone + .venv): VOICESTUDIO_DIR, else ./voicestudio where
   * `npm run setup` installs it, else an earlier install in ~/VoiceStudio.
   */
  dir: () => {
    if (process.env.VOICESTUDIO_DIR)
      return process.env.VOICESTUDIO_DIR.replace(/^~(?=$|\/)/, homedir());
    const local = resolve("voicestudio");
    const home = join(homedir(), "VoiceStudio");
    return !existsSync(local) && existsSync(home) ? home : local;
  },
  /** Only a backend installed on this machine, served on loopback, can be started from here. */
  canStart: () =>
    ["127.0.0.1", "localhost", "[::1]"].includes(
      new URL(voiceStudio.url()).hostname,
    ) && existsSync(join(voiceStudio.dir(), "backend", "main.py")),
  /**
   * Starts the backend detached, so it keeps serving after this script exits and later
   * runs find it warm, then waits until it answers. Output goes to out/voicestudio.log.
   */
  start: async () => {
    const { hostname, port, protocol } = new URL(voiceStudio.url());
    mkdirSync("out", { recursive: true });
    const log = resolve("out", "voicestudio.log");
    const output = openSync(log, "a");
    const args = [
      "run",
      "--no-sync",
      "uvicorn",
      "main:app",
      "--app-dir",
      "backend",
      "--host",
      hostname,
    ];
    args.push("--port", port || (protocol === "https:" ? "443" : "80"));
    process.stdout.write(`Starting VoiceStudio from ${voiceStudio.dir()}… `);
    const started = Date.now();
    const child = spawn("uv", args, {
      cwd: voiceStudio.dir(),
      detached: true,
      stdio: ["ignore", output, output],
    });
    let stopped = null;
    child.on("exit", (code, signal) => (stopped = `exit ${code ?? signal}`));
    child.on(
      "error",
      (error) =>
        (stopped =
          error.code === "ENOENT"
            ? "uv not found; run: brew install uv"
            : error.message),
    );
    child.unref();
    while (Date.now() - started < 180_000) {
      if (stopped)
        throw new Error(`VoiceStudio didn't start (${stopped}). Log: ${log}`);
      if (await voiceStudio.running()) {
        console.log(`ready in ${Math.round((Date.now() - started) / 1000)}s`);
        return;
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 1000));
    }
    throw new Error(`VoiceStudio didn't answer within 3 minutes. Log: ${log}`);
  },
  /** Word timings for a WAV from VoiceStudio's speech recognition. Throws when it can't. */
  transcribe: async (wav, { language, prompt } = {}) => {
    const form = new FormData();
    form.append("file", new Blob([wav], { type: "audio/wav" }), "audio.wav");
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "word");
    if (language) form.append("language", language);
    if (prompt) form.append("prompt", prompt);
    const res = await fetch(`${voiceStudio.url()}/v1/audio/transcriptions`, {
      method: "POST",
      headers: voiceStudio.headers(),
      body: form,
    });
    if (!res.ok)
      throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
    const { words = [] } = await res.json();
    return words
      .map((w) => ({ text: w.word.trim(), start: w.start, end: w.end }))
      .filter((w) => w.text);
  },
  /** True once the backend answers, starting a local install first if it isn't running. */
  ensure: async () => {
    if (await voiceStudio.running()) return true;
    if (!voiceStudio.canStart()) return false;
    try {
      await voiceStudio.start();
      return true;
    } catch (error) {
      console.log("failed");
      console.warn(`! ${error.message}`);
      return false;
    }
  },
};

/**
 * The voice engine to use: VOICE_PROVIDER when set, otherwise the first available of
 * VoiceStudio (running, or started from its install) → ElevenLabs (key set) → macOS `say`.
 * Null when none is.
 */
export const pickVoiceProvider = async () => {
  const wanted = (process.env.VOICE_PROVIDER || "auto").toLowerCase();
  if (wanted !== "auto") {
    if (!VOICE_PROVIDERS.includes(wanted))
      fail(`VOICE_PROVIDER must be auto, ${VOICE_PROVIDERS.join(", ")}`);
    return wanted;
  }
  if (await voiceStudio.ensure()) return "voicestudio";
  if (process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  if (process.platform === "darwin") return "say";
  return null;
};

/** Bundles the project once and resolves the Reel composition for `slug`. */
export const openReel = async (slug) => {
  const { bundle } = await import("@remotion/bundler");
  const { selectComposition } = await import("@remotion/renderer");
  process.stdout.write("Bundling… ");
  const serveUrl = await bundle({ entryPoint: resolve("src/index.ts") });
  console.log("done");
  const inputProps = { slug };
  const composition = await selectComposition({
    serveUrl,
    id: "Reel",
    inputProps,
  });
  return { serveUrl, composition, inputProps, reel: composition.props.reel };
};
