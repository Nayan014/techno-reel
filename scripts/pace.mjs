import { recordGate } from "./projects.mjs";
import { projectPaths, recordOutput } from "./projects.mjs";
// Finds where a rendered reel sits still, by watching the mp4 itself. Run it after `render`.
// Something on screen should change at least every second: a word, a pop, a zoom, a cut.
// Usage: npm run pace -- <slug> [--draft]
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { FPS, buildReel } from "../src/timeline.ts";
import { fail, ffmpeg, readJson, reelArgs } from "./lib.mjs";

const { slug, dir } = reelArgs("npm run pace -- <slug> [--draft]");
const draft = process.argv.includes("--draft");
const video = join(draft ? projectPaths(slug).preview : projectPaths(slug).exports, draft ? "draft.mp4" : `${slug}.mp4`);
if (!existsSync(video))
  fail(`${video} not found. Run: npm run render -- ${slug}${draft ? " --draft" : ""}`);

/** Every frame as a small gray thumbnail: plenty to see a word or a pop arrive. */
const W = 108;
const H = 192;
const SIZE = W * H;
/** A frame changes when at least PIXELS of its thumbnail jump by more than LEVEL (of 255):
 * one typed letter is enough. Slow drift and push-ins move too softly to count. */
const LEVEL = 32;
const PIXELS = 3;
/** The playbook's hard limit, and the stretch at the start where people decide to stay. */
const LIMIT = 1.2;
const OPENING = 2;
const REPORT = 0.5;

const raw = join(projectPaths(slug).working, "pace.gray");
ffmpeg([
  "-loglevel", "error",
  "-i", video,
  "-vf", `scale=${W}:${H}`,
  "-pix_fmt", "gray",
  "-c:v", "rawvideo",
  "-f", "image2pipe",
  "-y", raw,
]);
const pixels = readFileSync(raw);
rmSync(raw);
const frames = Math.floor(pixels.length / SIZE);
if (frames < 2) fail(`${video} has no frames`);

const changed = [true];
for (let f = 1; f < frames; f++) {
  let moved = 0;
  for (let i = f * SIZE, end = i + SIZE; i < end; i++)
    if (Math.abs(pixels[i] - pixels[i - SIZE]) > LEVEL) moved++;
  changed.push(moved >= PIXELS);
}

// Name the shot each still sits in; skipped when the script changed since the render.
let shots = [];
try {
  shots = buildReel(
    slug,
    readJson(join(dir, "script.json")),
    readJson(join(dir, "voice.json")),
  ).shots;
} catch {}
const shotAt = (frame) => {
  const shot = shots.findLast((s) => s.from <= frame);
  return shot ? ` in ${shot.id} ${shot.scene ?? shot.layout ?? ""}`.trimEnd() : "";
};

const results = [];
let start = null;
for (let f = 1; f <= frames; f++) {
  if (f < frames && !changed[f]) {
    start ??= f;
    continue;
  }
  if (start === null) continue;
  const from = (start - 1) / FPS;
  const seconds = (f - start + 1) / FPS;
  const where = `${from.toFixed(2)}s → ${(from + seconds).toFixed(2)}s (${seconds.toFixed(2)}s)${shotAt(start)}`;
  if (seconds > LIMIT)
    results.push(["FAIL", `still ${where}. Add a pop, a zoom or a cut.`]);
  else if (seconds >= REPORT && from < OPENING)
    results.push(["warn", `still ${where}. The first ${OPENING}s should never rest.`]);
  else if (seconds >= 1)
    results.push(["warn", `still ${where}.`]);
  start = null;
}

const moving = changed.filter(Boolean).length / frames;
console.log(
  `${video}: ${(frames / FPS).toFixed(1)}s, something changes in ${Math.round(moving * 100)}% of frames`,
);
for (const [level, message] of results)
  console.log(`${level === "FAIL" ? "✗ FAIL" : "! warn"}  ${message}`);
const failed = results.some(([level]) => level === "FAIL");
console.log(
  `${failed ? "✗" : "✓"} ${slug}: ${failed ? "sits still too long" : `nothing still over ${LIMIT}s`}`,
);
recordGate(slug, "pace" + (draft ? "-draft" : ""), results);
process.exit(failed ? 1 : 0);
