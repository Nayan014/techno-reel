// Renders the reel to out/<slug>/<slug>.mp4 (1080×1920, 30 fps, H.264 + AAC), next to its
// stills/ and caption.txt.
// Usage: npm run render -- <slug> [--draft]   (--draft = half size, fast)
import { join } from "node:path";
import { renderMedia } from "@remotion/renderer";
import { openReel, reelArgs } from "./lib.mjs";

const { slug } = reelArgs("npm run render -- <slug> [--draft]");
const draft = process.argv.includes("--draft");
const outputLocation = join("out", slug, `${slug}${draft ? "-draft" : ""}.mp4`);

const { serveUrl, composition, inputProps } = await openReel(slug);
let shown = -1;
await renderMedia({
  serveUrl,
  composition,
  inputProps,
  codec: "h264",
  outputLocation,
  scale: draft ? 0.5 : 1,
  crf: draft ? 28 : 18,
  onProgress: ({ progress }) => {
    const step = Math.floor(progress * 10);
    if (step > shown) {
      shown = step;
      process.stdout.write(`${step * 10}% `);
    }
  },
});
console.log(`\n✓ ${outputLocation}`);
