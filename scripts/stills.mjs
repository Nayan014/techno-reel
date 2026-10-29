// Renders one still per shot, just before its cut when everything is on screen, for review.
// Usage: npm run stills -- <slug> [--shot=03] [--scale=0.5]
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { renderStill } from "@remotion/renderer";
import { openReel, option, reelArgs, settledFrame } from "./lib.mjs";

const { slug } = reelArgs("npm run stills -- <slug> [--shot=03] [--scale=0.5]");
const only = option("shot");
const scale = Number(option("scale", "0.5"));
const outDir = join("out", slug, "stills");
mkdirSync(outDir, { recursive: true });

const { serveUrl, composition, inputProps, reel } = await openReel(slug);
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
  console.log(`  ${output}  (${shot.scene ?? shot.layout ?? "full"}, frame ${frame})`);
}
console.log(`✓ stills in ${outDir}`);
