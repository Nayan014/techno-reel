// Records one audio file per shot and writes voice.json with word timings.
// Engine: VoiceStudio (local) → ElevenLabs → macOS say; see VOICE_PROVIDER in .env.example.
// Lines whose text hasn't changed are reused, so re-running is free.
// A talking head (script.json has "take") records nothing: each shot's `clip` is cut from
// the take and timed from transcript.json.
// Usage: npm run voice -- <slug>
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  fail,
  loadEnv,
  pickVoiceProvider,
  readJson,
  reelArgs,
  round,
  voiceStudio,
  wavSeconds,
} from "./lib.mjs";

loadEnv();
const env = process.env;
const { slug, dir } = reelArgs("npm run voice -- <slug>");
const script = readJson(join(dir, "script.json"));
const previous = readJson(join(dir, "voice.json"));

if (script.take) {
  cutTake();
  process.exit(0);
}

const provider = await pickVoiceProvider();
if (!provider)
  fail(
    "No voice engine. Open the VoiceStudio app, or add ELEVENLABS_API_KEY to .env.",
  );
const engine = await {
  voicestudio: useVoiceStudio,
  elevenlabs: useElevenLabs,
  say: useSay,
}[provider]();
const sameVoice =
  previous?.provider === provider && previous?.voice === engine.voice;
console.log(`Voice: ${provider} · ${engine.voice}`);

mkdirSync(join(dir, "audio"), { recursive: true });

const lines = {};
for (const [i, shot] of script.shots.entries()) {
  const cached = sameVoice ? previous.lines?.[shot.id] : undefined;
  if (cached?.say === shot.say && existsSync(join("public", cached.audio))) {
    lines[shot.id] = cached;
    console.log(`  ${shot.id}  cached`);
    continue;
  }
  const hash = createHash("sha1")
    .update(`${provider}:${engine.voice}:${shot.say}`)
    .digest("hex")
    .slice(0, 8);
  const audio = `reels/${slug}/audio/${shot.id}-${hash}.${engine.ext}`;
  const context = {
    previous: script.shots[i - 1]?.say,
    next: script.shots[i + 1]?.say,
  };
  const speech = await engine.speak(shot.say, audio, context);
  lines[shot.id] = { say: shot.say, audio, ...speech };
  console.log(
    `  ${shot.id}  ${speech.end.toFixed(2)}s  ${speech.estimated ? "~" : " "} ${shot.say}`,
  );
}

writeFileSync(
  join(dir, "voice.json"),
  `${JSON.stringify({ provider, voice: engine.voice, lines }, null, 2)}\n`,
);
// Recordings of lines that have since changed: nothing points at them any more.
const kept = new Set(Object.values(lines).map((line) => line.audio));
for (const file of readdirSync(join(dir, "audio")))
  if (!kept.has(`reels/${slug}/audio/${file}`)) rmSync(join(dir, "audio", file));
const total = Object.values(lines).reduce((sum, line) => sum + line.end, 0);
console.log(
  `✓ ${dir}/voice.json · ${provider} · ${total.toFixed(1)}s of speech`,
);

/** Times every shot of a talking head from its slice of the take. */
function cutTake() {
  const transcript = readJson(join(dir, "transcript.json"));
  if (!transcript)
    fail(`No transcript yet. Run: npm run transcribe -- ${slug} <video>`);
  // Room around the words so the cut doesn't clip a first consonant or a last syllable.
  const LEAD = 0.12;
  const TAIL = 0.15;
  const lines = {};
  for (const shot of script.shots) {
    if (!shot.clip)
      fail(`Shot ${shot.id} needs "clip": [in, out], in seconds of the take.`);
    const [from, to] = shot.clip;
    const heard = transcript.words.filter((w) => {
      const middle = (w.start + w.end) / 2;
      return middle >= from && middle <= to;
    });
    if (!heard.length)
      fail(`Shot ${shot.id}: nothing is said between ${from}s and ${to}s.`);
    // Tighten the clip to its words: dead air at either end is cut.
    const start = Math.max(from, heard[0].start - LEAD);
    const end = Math.min(to, heard.at(-1).end + TAIL);
    const words = heard.map((w) => ({
      text: w.text,
      start: round(Math.max(0, w.start - start)),
      end: round(Math.min(end, w.end) - start),
    }));
    lines[shot.id] = {
      say: shot.say,
      audio: `reels/${slug}/${script.take}`,
      offset: round(start),
      clip: shot.clip,
      end: round(end - start),
      // Captions use the script's spelling on the take's timing.
      words: shot.say ? alignWords(tokenize(shot.say), words) : words,
    };
    console.log(
      `  ${shot.id}  ${(end - start).toFixed(2)}s  ${start.toFixed(2)}–${end.toFixed(2)}  ${shot.say ?? ""}`,
    );
  }
  writeFileSync(
    join(dir, "voice.json"),
    `${JSON.stringify({ provider: "take", voice: script.take, lines }, null, 2)}\n`,
  );
  const total = Object.values(lines).reduce((sum, line) => sum + line.end, 0);
  console.log(`✓ ${dir}/voice.json · cut from ${script.take} · ${total.toFixed(1)}s of speech`);
}

// Each engine: { voice, ext, speak(text, audio, context) → { end, words, estimated? } }.

async function useVoiceStudio() {
  const url = voiceStudio.url();
  const headers = voiceStudio.headers();
  if (!(await voiceStudio.ensure())) {
    fail(
      `VoiceStudio isn't answering at ${url} and couldn't be started from ${voiceStudio.dir()}. ` +
        "Set VOICESTUDIO_DIR to its install, or VOICE_PROVIDER=auto to fall back.",
    );
  }
  const model = voiceStudio.model();
  const voice = voiceStudio.voice();
  let canTranscribe = true;

  // VoiceStudio returns audio only, so its own speech recognition times the words.
  const transcribe = async (wav) => {
    if (!canTranscribe) return null;
    try {
      return await voiceStudio.transcribe(wav, {
        language: env.VOICESTUDIO_LANGUAGE,
      });
    } catch (error) {
      canTranscribe = false;
      console.warn(
        `! VoiceStudio couldn't transcribe (${error.message}). Caption timing will be estimated.`,
      );
      return null;
    }
  };

  return {
    voice: `${model}/${voice}`,
    ext: "wav",
    async speak(text, audio) {
      const body = { model, voice, input: text, response_format: "wav" };
      if (env.VOICESTUDIO_SPEED) body.speed = Number(env.VOICESTUDIO_SPEED);
      const res = await fetch(`${url}/v1/audio/speech`, {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok)
        fail(`VoiceStudio ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const wav = Buffer.from(await res.arrayBuffer());
      writeFileSync(join("public", audio), wav);
      const length = wavSeconds(wav);
      const heard = await transcribe(wav);
      if (!heard?.length)
        return {
          end: length,
          words: spread(tokenize(text), 0, length),
          estimated: true,
        };
      // Trim trailing silence, with a little room so the last syllable isn't clipped.
      return {
        end: round(Math.min(length, heard.at(-1).end + 0.15)),
        words: alignWords(tokenize(text), heard),
      };
    },
  };
}

async function useElevenLabs() {
  const key = env.ELEVENLABS_API_KEY;
  const voice = env.ELEVENLABS_VOICE_ID;
  const model = env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
  if (!key) fail("Add ELEVENLABS_API_KEY to .env");
  if (!voice)
    fail(
      "Set ELEVENLABS_VOICE_ID in .env (copy one from https://elevenlabs.io/app/voice-library)",
    );

  return {
    voice,
    ext: "mp3",
    async speak(text, audio, context) {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: { "xi-api-key": key, "content-type": "application/json" },
          body: JSON.stringify({
            text,
            model_id: model,
            previous_text: context.previous,
            next_text: context.next,
          }),
        },
      );
      if (!res.ok) fail(`ElevenLabs ${res.status}: ${await res.text()}`);
      const { audio_base64, alignment } = await res.json();
      writeFileSync(join("public", audio), Buffer.from(audio_base64, "base64"));

      const words = [];
      let word = null;
      alignment.characters.forEach((char, k) => {
        if (/\s/.test(char)) {
          word = null;
          return;
        }
        if (!word) {
          word = {
            text: "",
            start: alignment.character_start_times_seconds[k],
            end: 0,
          };
          words.push(word);
        }
        word.text += char;
        word.end = alignment.character_end_times_seconds[k];
      });
      return { end: alignment.character_end_times_seconds.at(-1) ?? 0, words };
    },
  };
}

async function useSay() {
  if (process.platform !== "darwin")
    fail("macOS `say` is only available on a Mac");
  return {
    voice: env.SAY_VOICE || "default",
    ext: "wav",
    async speak(text, audio) {
      // Text goes in through a file: `say` never exits when fed stdin, and a line may start with "-".
      const textFile = join(
        mkdtempSync(join(tmpdir(), "reel-say-")),
        "line.txt",
      );
      writeFileSync(textFile, text);
      const args = [
        "-o",
        join("public", audio),
        "--data-format=LEI16@44100",
        "-r",
        env.SAY_RATE || "195",
        "-f",
        textFile,
      ];
      if (env.SAY_VOICE) args.push("-v", env.SAY_VOICE);
      execFileSync("say", args);
      const end = wavSeconds(readFileSync(join("public", audio)));
      return { end, words: spread(tokenize(text), 0, end), estimated: true };
    },
  };
}


function tokenize(text) {
  return text.split(/\s+/).filter(Boolean);
}

function normalize(token) {
  return token.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

/**
 * Puts the script's own words on the transcript's timings. Words the transcript wrote
 * differently ("1.2" for "one point two") are spread over the gap between matched neighbours.
 */
function alignWords(tokens, heard) {
  const LOOKAHEAD = 6;
  const matched = tokens.map(() => null);
  let next = 0;
  tokens.forEach((token, i) => {
    const key = normalize(token);
    for (let k = next; k < Math.min(heard.length, next + LOOKAHEAD); k++) {
      if (normalize(heard[k].text) === key) {
        matched[i] = heard[k];
        next = k + 1;
        break;
      }
    }
  });

  const words = [];
  for (let i = 0; i < tokens.length;) {
    if (matched[i]) {
      words.push({
        text: tokens[i],
        start: round(matched[i].start),
        end: round(matched[i].end),
      });
      i += 1;
      continue;
    }
    let j = i;
    while (j < tokens.length && !matched[j]) j += 1;
    const from = words.at(-1)?.end ?? heard[0].start;
    const to = j < tokens.length ? matched[j].start : heard.at(-1).end;
    words.push(...spread(tokens.slice(i, j), from, Math.max(to, from)));
    i = j;
  }
  return words;
}

/** Spreads words over [from, to] by length, leaving room for punctuation pauses. */
function spread(tokens, from, to) {
  const pause = (token) =>
    /[.!?]$/.test(token) ? 6 : /[,;:]$/.test(token) ? 4 : 0;
  const weight = (token) => normalize(token).length + 2;
  const total =
    tokens.reduce((sum, token) => sum + weight(token) + pause(token), 0) || 1;
  const span = to - from;
  let t = from;
  return tokens.map((token) => {
    const start = t;
    const spoken = (weight(token) / total) * span;
    t += spoken + (pause(token) / total) * span;
    return { text: token, start: round(start), end: round(start + spoken) };
  });
}

