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

let phase = 0;
const pop = synth(0.14, (t) => {
  phase += (2 * Math.PI * (160 + 740 * Math.exp(-t * 40))) / RATE;
  return Math.sin(phase) * Math.exp(-t * 28) * 0.9;
});

let low = 0;
const whoosh = synth(0.38, (_, p) => {
  const cutoff = 300 + 5200 * Math.sin(Math.PI * p);
  low += (1 - Math.exp((-2 * Math.PI * cutoff) / RATE)) * (noise() - low);
  return low * Math.sin(Math.PI * p) ** 2 * 1.4;
});

const tick = synth(
  0.06,
  (t) =>
    (Math.sin(2 * Math.PI * 2400 * t) * 0.6 +
      Math.sin(2 * Math.PI * 1200 * t) * 0.4) *
    Math.exp(-t * 90),
);

mkdirSync("public/sfx", { recursive: true });
for (const [name, samples] of Object.entries({ pop, whoosh, tick })) {
  writeFileSync(`public/sfx/${name}.wav`, toWav(samples));
}
console.log("✓ public/sfx/pop.wav, whoosh.wav, tick.wav");
