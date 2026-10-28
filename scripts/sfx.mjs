// Fetches the kit's sounds and music and masters them into public/sfx and public/music.
// Every source is CC0 (public domain): fine in the repo, in paid work and in monetised posts,
// no credit needed. Credits go to public/sfx/CREDITS.md anyway. Downloads are cached in
// out/sfx-cache; out/sfx/index.html plays every sound so you can judge them by ear.
// Usage: npm run sfx
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import {
  MUSIC,
  RISER_SECONDS,
  SFX,
  musicFile,
  sfxFile,
} from "../src/sound.ts";
import { fail, ffmpeg } from "./lib.mjs";

const RATE = 44100;
const CACHE = "out/sfx-cache";

/** A Freesound sound by its preview key (`<id>_<user id>`, from the sound's page). */
const freesound = (key, author, title, options = {}) => {
  const id = Number(key.split("_")[0]);
  return {
    url: `https://cdn.freesound.org/previews/${Math.floor(id / 1000)}/${key}-hq.mp3`,
    page: `https://freesound.org/s/${id}/`,
    author,
    title,
    ...options,
  };
};

/** A Freesound sound from Remotion's lossless mirror (the CC0 part of @remotion/sfx). */
const remotion = (file, id, author, title) => ({
  url: `https://remotion.media/${file}`,
  page: `https://freesound.org/s/${id}/`,
  author,
  title,
});

// Kenney's packs, from their OpenGameArt mirrors (kenney.nl only downloads in a browser).
const pack = (zip, page, title) => ({
  zip: `https://opengameart.org/sites/default/files/${zip}`,
  page,
  title,
});
const INTERFACE = pack(
  "kenney_interfaceSounds.zip",
  "https://kenney.nl/assets/interface-sounds",
  "Interface Sounds",
);
const CASINO = pack(
  "kenney_casino-audio.zip",
  "https://kenney.nl/assets/casino-audio",
  "Casino Audio",
);
const kenney = (from, member, options = {}) => ({
  url: from.zip,
  member,
  page: from.page,
  author: "Kenney",
  title: `${from.title}: ${basename(member)}`,
  ...options,
});

// HoliznaCC0's collections on OpenGameArt. `start`/`end` cut a steady stretch, past the intro.
const HAPPY = pack(
  "happy_lo-fi_lofi_collection.zip",
  "https://opengameart.org/content/happy-lo-fi-lofi-collection",
  "Happy Lo-Fi",
);
const CHILL = pack(
  "chill_beats.zip",
  "https://opengameart.org/content/chill-beats-collection",
  "Chill Beats",
);
const FUNK = pack(
  "funk_collection_.zip",
  "https://opengameart.org/content/funk-collection",
  "Funk",
);
const holizna = (from, member, start, end) => ({
  url: from.zip,
  member,
  page: from.page,
  author: "HoliznaCC0",
  title: `${from.title}: ${basename(member).replace(/\.mp3$/, "").replace(/^\d+ HoliznaCC0 - /, "")}`,
  start,
  end,
});

/**
 * One source per take, in take order. Options: `start`/`end` (seconds of the source to use),
 * `max` (longest it may run, default 2 s), `rate` (>1 plays it faster and higher).
 */
const SOURCES = {
  whoosh: [
    remotion("whoosh.wav", 831936, "1bob", "Woosh"),
    freesound("683101_6253486", "florianreichelt", "quick woosh"),
    freesound("632763_12672694", "adh.dreaming", "Transition Swoosh"),
  ],
  whip: [
    remotion("whip.wav", 838766, "JW_Audio", "SWSH_Badminton Racquet_Recording_01"),
  ],
  swipe: [
    kenney(CASINO, "Audio/card-slide-1.ogg"),
    kenney(CASINO, "Audio/card-slide-5.ogg"),
  ],
  pop: [
    freesound("202230_3725006", "deraj", "Pop sound"),
    freesound("328119_3624044", "D.S.G.", "Pop 9"),
    freesound("850097_11736329", "lbrady240", "Pop11"),
  ],
  click: [
    kenney(INTERFACE, "Audio/click_001.ogg"),
    kenney(INTERFACE, "Audio/click_002.ogg"),
  ],
  // One keyboard, pitched a little per take, so typing sounds like one keyboard.
  key: [1, 0.94, 1.06, 1.12].map((rate) =>
    freesound("194799_670763", "jim-ph", "keyboard5.wav", { rate }),
  ),
  blip: [kenney(INTERFACE, "Audio/select_003.ogg")],
  ding: [freesound("611113_1629501", "5ro4", "bell ding 1.wav", { max: 1.2 })],
  impact: [
    freesound("201571_1535323", "Julien_Matthey", "JM_FX_Boom 01a.wav"),
    freesound("315725_2511427", "Renovatio871", "Tonal_Impact_E", { max: 1.5 }),
  ],
  // Ends on its peak, so a scene starts it RISER_SECONDS before the moment it builds to.
  riser: [
    freesound("685256_12265588", "syntheffects", "Riser sound effect short.wav", {
      start: 2.8 - RISER_SECONDS,
      end: 2.8,
      exact: true,
    }),
  ],
  shutter: [
    remotion("shutter-modern.wav", 539136, "ristooooo1", "DSLR Shutter fast 006.wav"),
  ],
  coin: [
    freesound("209578_2558531", "Zott820", "Cash Register Purchase", { max: 1.3 }),
  ],
  success: [kenney(INTERFACE, "Audio/confirmation_004.ogg")],
};

const MUSIC_SOURCES = {
  lofi: holizna(HAPPY, "Happy Lo-Fi (Lofi Collection)/01 HoliznaCC0 - Poor, But Happy.mp3", 20, 70),
  upbeat: holizna(HAPPY, "Happy Lo-Fi (Lofi Collection)/19 HoliznaCC0 - Puppy Love.mp3", 15, 65),
  chill: holizna(CHILL, "Chill Beats/28 HoliznaCC0 - Autumn.mp3", 10, 60),
  funk: holizna(FUNK, "Funk ( Collection )/06 HoliznaCC0 - Make Funk.mp3", 10, 60),
};

// The video plays these by name, so the lists must match src/sound.ts exactly.
for (const [name, count] of Object.entries(SFX)) {
  if (SOURCES[name]?.length !== count)
    fail(`src/sound.ts has ${count} take(s) of "${name}", scripts/sfx.mjs has ${SOURCES[name]?.length ?? 0}.`);
}
for (const name of Object.keys(SOURCES)) {
  if (!(name in SFX)) fail(`"${name}" is in scripts/sfx.mjs but not in SFX in src/sound.ts.`);
}
if (String(Object.keys(MUSIC_SOURCES)) !== String(MUSIC))
  fail("MUSIC in src/sound.ts and MUSIC_SOURCES in scripts/sfx.mjs list different tracks.");

/** Downloads `url` once into the cache; for a zip, returns `member` from inside it. */
const fetchSource = async ({ url, member }) => {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, basename(new URL(url).pathname));
  if (!existsSync(file)) {
    const res = await fetch(url, { headers: { "User-Agent": "techno-reel sfx" } });
    if (!res.ok) fail(`Download failed (${res.status}): ${url}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  if (!member) return file;
  const dir = file.replace(/\.zip$/, "");
  if (!existsSync(dir)) execFileSync("unzip", ["-qo", file, "-d", dir]);
  const path = join(dir, member);
  if (!existsSync(path)) fail(`${member} is not in ${url}`);
  return path;
};

/** Decodes any audio file to 44.1 kHz float channels. */
const decode = (path, channels) => {
  const wav = join(CACHE, "decoded.wav");
  ffmpeg(["-y", "-i", path, "-ac", String(channels), "-ar", String(RATE), "-c:a", "pcm_s16le", "-map_metadata", "-1", wav]);
  const buf = readFileSync(wav);
  let at = 12;
  while (buf.toString("ascii", at, at + 4) !== "data") at += 8 + buf.readUInt32LE(at + 4);
  const frames = Math.floor(buf.readUInt32LE(at + 4) / 2 / channels);
  return Array.from({ length: channels }, (_, c) =>
    Float32Array.from({ length: frames }, (_, i) => buf.readInt16LE(at + 8 + (i * channels + c) * 2) / 32768),
  );
};

const toWav = (channels) => {
  const frames = channels[0].length;
  const data = Buffer.alloc(frames * channels.length * 2);
  for (let i = 0; i < frames; i++)
    channels.forEach((ch, c) =>
      data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, ch[i])) * 32767), (i * channels.length + c) * 2),
    );
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels.length, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * channels.length * 2, 28);
  header.writeUInt16LE(channels.length * 2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
};

const peakOf = (channels) =>
  Math.max(...channels.map((ch) => ch.reduce((m, s) => Math.max(m, Math.abs(s)), 0)));

/** Linear fade in over `inSec` and out over `outSec`, in place. */
const fade = (channels, inSec, outSec) => {
  const frames = channels[0].length;
  const fadeIn = Math.min(frames, Math.round(inSec * RATE));
  const fadeOut = Math.min(frames, Math.round(outSec * RATE));
  for (const ch of channels) {
    for (let i = 0; i < fadeIn; i++) ch[i] *= i / fadeIn;
    for (let i = 0; i < fadeOut; i++) ch[frames - 1 - i] *= i / fadeOut;
  }
};

/** Scales so `loudness` hits `target`, never letting a sample pass −1 dBFS. */
const normalize = (channels, loudness, target) => {
  const gain = Math.min(target / loudness, 0.89 / peakOf(channels));
  for (const ch of channels) for (let i = 0; i < ch.length; i++) ch[i] *= gain;
};

const slice = (channels, start = 0, end) =>
  channels.map((ch) => ch.slice(Math.round(start * RATE), end === undefined ? undefined : Math.round(end * RATE)));

/** A sound effect: mono, silence trimmed, every one equally loud at its loudest moment. */
const masterSfx = (source, path) => {
  let [x] = slice(decode(path, 1), source.start, source.end);
  if (source.rate) {
    const rate = source.rate;
    const src = x;
    x = Float32Array.from({ length: Math.floor(src.length / rate) }, (_, i) => {
      const p = i * rate;
      const j = Math.floor(p);
      return src[j] * (1 - (p - j)) + (src[j + 1] ?? 0) * (p - j);
    });
  }
  const peak = peakOf([x]);
  let cut = false;
  if (!source.exact) {
    // Start 5 ms before it gets within 40 dB of its peak, stop once it falls 50 dB below.
    let from = x.findIndex((s) => Math.abs(s) > peak * 0.01);
    from = Math.max(0, from - Math.round(0.005 * RATE));
    let to = x.length - 1;
    while (to > from && Math.abs(x[to]) < peak * 0.003) to--;
    const longest = Math.round((source.max ?? 2) * RATE);
    cut = to - from > longest;
    x = x.slice(from, Math.min(to + 1, from + longest));
  }
  const channels = [x];
  fade(channels, 0.002, cut ? Math.min(0.25, (x.length / RATE) * 0.3) : 0.02);
  // Loudest 20 ms, so a click and a long whoosh land at the same perceived level.
  const W = Math.min(x.length, Math.round(0.02 * RATE));
  let sum = 0;
  let loudest = 0;
  for (let i = 0; i < x.length; i++) {
    sum += x[i] * x[i] - (i >= W ? x[i - W] * x[i - W] : 0);
    if (i >= W - 1) loudest = Math.max(loudest, Math.sqrt(sum / W));
  }
  normalize(channels, loudest, 0.2); // −14 dBFS
  return toWav(channels);
};

/** A music bed: stereo, faded at both ends so it loops cleanly, levelled to −18 dBFS RMS. */
const masterMusic = (source, path, out) => {
  const channels = slice(decode(path, 2), source.start, source.end);
  fade(channels, 0.5, 1.5);
  const rms = Math.sqrt(
    channels.reduce((sum, ch) => sum + ch.reduce((s, v) => s + v * v, 0), 0) /
      (channels.length * channels[0].length),
  );
  normalize(channels, rms, 0.126);
  const wav = join(CACHE, "music.wav");
  writeFileSync(wav, toWav(channels));
  ffmpeg(["-y", "-i", wav, "-c:a", "libmp3lame", "-b:a", "160k", out]);
};

mkdirSync("public/sfx", { recursive: true });
mkdirSync("public/music", { recursive: true });
const made = [];
for (const [name, takes] of Object.entries(SOURCES)) {
  for (const [i, source] of takes.entries()) {
    const file = sfxFile(name, i);
    writeFileSync(join("public", file), masterSfx(source, await fetchSource(source)));
    made.push({ file, ...source });
  }
}
for (const [name, source] of Object.entries(MUSIC_SOURCES)) {
  const file = musicFile(name);
  masterMusic(source, await fetchSource(source), join("public", file));
  made.push({ file, ...source });
}

// Drop sounds the kit no longer makes.
for (const file of readdirSync("public/sfx")) {
  if (file.endsWith(".wav") && !made.some((m) => m.file === `sfx/${file}`))
    rmSync(join("public/sfx", file));
}

const row = (m) =>
  `| \`${m.file}\` | [${m.title}](${m.page}) | ${m.author} | CC0 1.0 |`;
writeFileSync(
  "public/sfx/CREDITS.md",
  `# Sound credits

Every sound and music bed in \`public/sfx\` and \`public/music\` is public domain
([CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)): free for any use, paid work
included, no credit required. Made by \`npm run sfx\`, which also trims and levels them.

| file | source | by | licence |
| ---- | ------ | -- | ------- |
${made.map(row).join("\n")}
`,
);

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
mkdirSync("out/sfx", { recursive: true });
writeFileSync(
  "out/sfx/index.html",
  `<!doctype html><meta charset="utf-8"><title>Techno Reel sounds</title>
<style>body{font:16px system-ui;margin:32px;max-width:760px}li{display:flex;gap:16px;align-items:center;margin:8px 0}code{width:150px}audio{height:32px}small{color:#777}</style>
<h1>Techno Reel sounds</h1><ul>
${made.map((m) => `<li><code>${esc(m.file)}</code><audio controls preload="none" src="../../public/${esc(m.file)}"></audio><small>${esc(m.title)} · ${esc(m.author)}</small></li>`).join("\n")}
</ul>`,
);
console.log(`✓ ${made.length} sounds in public/sfx and public/music. Listen: out/sfx/index.html`);
