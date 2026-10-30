// Renders one still per shot, just before its cut when everything is on screen, for review.
// Lines not recorded yet are timed by estimate, so plan mode can show its frames before the voice.
// Usage: npm run stills -- <slug> [--shot=03] [--scale=0.5]
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { renderStill } from "@remotion/renderer";
import { estimateLines, openReel, option, readJson, reelArgs, settledFrame } from "./lib.mjs";

const { slug, dir } = reelArgs("npm run stills -- <slug> [--shot=03] [--scale=0.5]");
const only = option("shot");
const scale = Number(option("scale", "0.5"));
const outDir = join("out", slug, "stills");
mkdirSync(outDir, { recursive: true });

const script = readJson(join(dir, "script.json"));
const { serveUrl, composition, inputProps, reel } = await openReel(slug, estimateLines(script));
for (const shot of reel.shots) {
  if (only && shot.id !== only) continue;
  const output = join(outDir, `${shot.id}.png`);
  const frame = settledFrame(shot);
  await renderStill({
    serveUrl,
    composition,
    inputProps,
    output,
    frame,
    scale,
    imageFormat: "png",
  });
  const timing = shot.audio ? "" : ", timed by estimate";
  console.log(`  ${output}  (${shot.scene ?? shot.layout ?? "full"}, frame ${frame}${timing})`);
}
console.log(`✓ stills in ${outDir}`);
