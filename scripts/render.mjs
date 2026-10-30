// Renders the reel to out/<slug>/<slug>.mp4 (1080×1920, 30 fps, H.264 + AAC), next to its
// stills/ and caption.txt, and the hook's settled frame as cover.png to upload as the cover.
// Usage: npm run render -- <slug> [--draft]   (--draft = half size, fast)
import { join } from "node:path";
import { renderMedia, renderStill } from "@remotion/renderer";
import { openReel, reelArgs, settledFrame } from "./lib.mjs";

const { slug } = reelArgs("npm run render -- <slug> [--draft]");
const draft = process.argv.includes("--draft");
const outputLocation = join("out", slug, `${slug}${draft ? "-draft" : ""}.mp4`);

const { serveUrl, composition, inputProps, reel } = await openReel(slug);
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

if (!draft) {
  const cover = join("out", slug, "cover.png");
  await renderStill({
    serveUrl,
    composition,
    inputProps,
    output: cover,
    frame: settledFrame(reel.shots[0]),
    imageFormat: "png",
  });
  console.log(`✓ ${cover}`);
}
