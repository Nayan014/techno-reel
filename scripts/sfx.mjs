// Synthesizes the kit's sound effects into public/sfx. Generated, so nothing to license.
// Usage: npm run sfx
import { mkdirSync, writeFileSync } from "node:fs";

const RATE = 44100;

const toWav = (samples) => {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) =>
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2),
  );
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
};

/** Runs `sample(t, progress)` for every sample of a `seconds`-long sound. */
const synth = (seconds, sample) => {
  const count = Math.round(seconds * RATE);
  return Array.from({ length: count }, (_, i) => sample(i / RATE, i / count));
};

// Seeded noise so the files come out identical on every run.
let seed = 7;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return (seed / 4294967296) * 2 - 1;
};

let popPhase = 0;
const pop = synth(0.12, (t) => {
  popPhase += (2 * Math.PI * (180 + 680 * Math.exp(-t * 45))) / RATE;
  return Math.sin(popPhase) * Math.exp(-t * 32) * 0.7;
});

let whooshLow = 0;
const whoosh = synth(0.32, (_, p) => {
  const cutoff = 260 + 4200 * Math.sin(Math.PI * p);
  whooshLow += (1 - Math.exp((-2 * Math.PI * cutoff) / RATE)) * (noise() - whooshLow);
  return whooshLow * Math.sin(Math.PI * p) ** 2 * 0.9;
});

const tick = synth(
  0.05,
  (t) =>
    (Math.sin(2 * Math.PI * 2200 * t) * 0.5 +
      Math.sin(2 * Math.PI * 1100 * t) * 0.3) *
    Math.exp(-t * 110),
);

// Bright chime / bell ding for wins & highlights
const ding = synth(0.35, (t) => {
  const fundamental = Math.sin(2 * Math.PI * 1760 * t) * 0.6; // A6
  const harmonic = Math.sin(2 * Math.PI * 3520 * t) * 0.25;
  const shimmer = Math.sin(2 * Math.PI * 5280 * t) * 0.15;
  return (fundamental + harmonic + shimmer) * Math.exp(-t * 10);
});

// Digital tech blip
let blipPhase = 0;
const blip = synth(0.10, (t, p) => {
  const freq = 600 + 1200 * p;
  blipPhase += (2 * Math.PI * freq) / RATE;
  return Math.sin(blipPhase) * Math.sin(Math.PI * p) * 0.6;
});

// Crisp tactile snap
const snap = synth(0.06, (t) => {
  const transient = noise() * Math.exp(-t * 220) * 0.7;
  const tone = Math.sin(2 * Math.PI * 1400 * t) * Math.exp(-t * 120) * 0.3;
  return transient + tone;
});

// Airy page/card swipe
let swipeLow = 0;
const swipe = synth(0.22, (_, p) => {
  const cutoff = 500 + 3500 * Math.sin(Math.PI * p);
  swipeLow += (1 - Math.exp((-2 * Math.PI * cutoff) / RATE)) * (noise() - swipeLow);
  return swipeLow * Math.sin(Math.PI * p) ** 1.8 * 0.7;
});

mkdirSync("public/sfx", { recursive: true });
const sounds = { pop, whoosh, tick, ding, blip, snap, swipe };
for (const [name, samples] of Object.entries(sounds)) {
  writeFileSync(`public/sfx/${name}.wav`, toWav(samples));
}
console.log(`✓ public/sfx: ${Object.keys(sounds).map((k) => k + ".wav").join(", ")}`);
