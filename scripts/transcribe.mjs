import { projectPaths, createProject, json, saveJson } from "./projects.mjs";
// Turns a talking-head recording into a take for a reel:
//   projects/<slug>/working/take.mp4        30 fps, at most 2560 px tall, voice levelled to −14 LUFS
//   projects/<slug>/working/transcript.json every word with its time in the take
//   projects/<slug>/working/transcript.txt  the same in phrases, with pauses and unworded sounds,
//                                       to pick each shot's clip from
// Speech recognition is VoiceStudio's (local). Run it again without a video to re-transcribe;
// --words="Claude, Anthropic, CTO" spells names and jargon the take uses.
// Usage: npm run transcribe -- <slug> [path/to/video] [--words="…"]
import {
  existsSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, basename, extname, relative } from "node:path";
import {
  fail,
  ffmpeg,
  hasFilters,
  loadEnv,
  option,
  round,
  voiceStudio,
  wavSeconds,
} from "./lib.mjs";

loadEnv();
const usage = 'npm run transcribe -- <slug> [path/to/video] [--words="…"]';
const [slug, video] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
if (!slug) fail(`Usage: ${usage}`);
const paths = projectPaths(slug);
if (!existsSync(paths.root)) createProject(slug);
const dir = paths.working;
const take = join(dir, "take.mp4");
mkdirSync(dir, { recursive: true });

if (video) {
  let source = resolve(video.replace(/^~(?=$|\/)/, process.env.HOME));
  if (!existsSync(source)) fail(`${source} not found`);
  // Import external recordings into the project without overwriting an original.
  if (!source.startsWith(resolve(paths.raw) + "/")) {
    const name = basename(source), ext = extname(name), stem = name.slice(0, name.length-ext.length);
    let destination = join(paths.raw, name), count = 2;
    while (existsSync(destination)) destination = join(paths.raw, `${stem}-${count++}${ext}`);
    mkdirSync(paths.raw, { recursive: true });
    copyFileSync(source, destination);
    source = resolve(destination);
  }
  const metadataPath = join(paths.root, "project.json");
  saveJson(metadataPath, { ...json(metadataPath, {}), mainRecording: relative(paths.root, source) });
  process.stdout.write("Making take.mp4… ");
  // Noise reduction only exists in a full ffmpeg (brew install ffmpeg); levelling always runs.
  const clean = hasFilters("highpass", "afftdn") ? "highpass=f=70,afftdn=nf=-25," : "";
  const encoder =
    process.platform === "darwin"
      ? ["-c:v", "h264_videotoolbox", "-b:v", "16M"]
      : ["-c:v", "libx264", "-crf", "18", "-preset", "veryfast"];
  ffmpeg([
    "-y",
    "-i", source,
    "-map", "0:v:0",
    "-map", "0:a:0",
    "-vf", "scale=-2:'min(ih,2560)'",
    "-fps_mode", "cfr",
    "-r", "30",
    ...encoder,
    "-pix_fmt", "yuv420p",
    "-af", `${clean}loudnorm=I=-14:TP=-1.5:LRA=11`,
    "-c:a", "aac",
    "-b:a", "192k",
    "-ar", "48000",
    "-movflags", "+faststart",
    take,
  ]);
  console.log(clean ? "done (denoised, levelled)" : "done (levelled)");
} else if (!existsSync(take)) {
  fail(`No take yet. Usage: ${usage}`);
}

// Speech recognition and silence detection both read a 16 kHz mono copy, kept in a temp dir.
const scratch = mkdtempSync(join(tmpdir(), "reel-take-"));
const wavPath = join(scratch, "take-16k.wav");
ffmpeg(["-y", "-i", take, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wavPath]);
const wav = readFileSync(wavPath);
const duration = round(wavSeconds(wav));

if (!(await voiceStudio.ensure()))
  fail(
    `VoiceStudio isn't answering at ${voiceStudio.url()}; it does the speech recognition. Run: npm run doctor`,
  );
process.stdout.write(`Transcribing ${duration.toFixed(1)}s… `);
// A prompt with fillers in it makes Whisper write "um" and "uh" down instead of hiding them,
// and one with the take's names in it spells them right.
const vocabulary = option("words");
const words = (
  await voiceStudio
    .transcribe(wav, {
      language: process.env.VOICESTUDIO_LANGUAGE,
      prompt: `Umm, so, uh, I was like, hmm… Okay. Let me, uh, start again.${vocabulary ? ` ${vocabulary}.` : ""}`,
    })
    .catch((error) => fail(`VoiceStudio couldn't transcribe: ${error.message}`))
).map((w) => ({ text: w.text, start: round(w.start), end: round(w.end) }));
if (!words.length) fail("No speech found in the take.");
console.log(`${words.length} words`);

// Stretches with sound but no words are usually fillers, breaths or false starts.
const silences = [];
for (const match of ffmpeg([
  "-i", wavPath, "-af", "silencedetect=noise=-35dB:d=0.2", "-f", "null", "-",
]).matchAll(/silence_(start|end): ([\d.]+)/g)) {
  if (match[1] === "start") silences.push([Number(match[2]), duration]);
  else if (silences.length) silences.at(-1)[1] = Number(match[2]);
}
rmSync(scratch, { recursive: true, force: true });
const silentIn = (a, b) =>
  silences.reduce(
    (sum, [s, e]) => sum + Math.max(0, Math.min(b, e) - Math.max(a, s)),
    0,
  );

writeFileSync(
  join(dir, "transcript.json"),
  `${JSON.stringify({ source: video ? resolve(video) : undefined, duration, words }, null, 2)}\n`,
);

// Phrases break at pauses and sentence ends; each line is a candidate clip.
const FILLER = /^(u+m+|u+h+|e+r+m+|h+m+|a+h+|mm+)[.,!?]*$/i;
const lines = [];
let phrase = [];
const flush = () => {
  if (!phrase.length) return;
  const text = phrase
    .map((w) => (FILLER.test(w.text) ? `[${w.text.replace(/[.,!?]+$/, "")}]` : w.text))
    .join(" ");
  lines.push(
    `${phrase[0].start.toFixed(2).padStart(7)} – ${phrase.at(-1).end.toFixed(2).padEnd(7)} ${text}`,
  );
  phrase = [];
};
words.forEach((word, i) => {
  phrase.push(word);
  const next = words[i + 1];
  if (!next) return flush();
  const gap = next.start - word.end;
  if (gap >= 0.3 || /[.!?]$/.test(word.text)) flush();
  if (gap >= 0.3) {
    // Word timings run a little short, so the edges of a gap are the words' own tails.
    const [a, b] = [word.end + 0.15, next.start - 0.15];
    const sound = b > a ? b - a - silentIn(a, b) : 0;
    lines.push(
      sound >= 0.25
        ? `${"".padStart(18)}· ${gap.toFixed(1)}s gap, ${sound.toFixed(1)}s of it unworded sound (filler?)`
        : `${"".padStart(18)}· ${gap.toFixed(1)}s pause`,
    );
  }
});
const text = `${lines.join("\n")}\n`;
writeFileSync(join(dir, "transcript.txt"), text);
console.log(`\n${text}`);
console.log(
  `✓ ${dir}/take.mp4 · transcript.json · transcript.txt  (${duration.toFixed(1)}s)`,
);
