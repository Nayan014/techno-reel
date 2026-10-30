import { mkdirSync, renameSync } from "node:fs";
import { projectPaths, recordOutput, fingerprint } from "./projects.mjs";
// Final media goes in projects/<slug>/export/; drafts go in preview/.
// Replace the last successful output only after rendering completes.
// Usage: npm run render -- <slug> [--draft]   (--draft = half size, fast)
import { join } from "node:path";
import { renderMedia, renderStill } from "@remotion/renderer";
import { openReel, reelArgs, settledFrame } from "./lib.mjs";

const { slug } = reelArgs("npm run render -- <slug> [--draft]");
const draft = process.argv.includes("--draft");
const outputLocation = join(draft ? projectPaths(slug).preview : projectPaths(slug).exports, draft ? "draft.mp4" : `${slug}.mp4`);

mkdirSync(draft ? projectPaths(slug).preview : projectPaths(slug).exports, {recursive: true});
const temporaryOutput = join(projectPaths(slug).working, draft ? "draft.pending.mp4" : "export.pending.mp4");
const inputFingerprint = fingerprint(slug);
const { serveUrl, composition, inputProps, reel } = await openReel(slug);
let shown = -1;
await renderMedia({
  serveUrl,
  composition,
  inputProps,
  codec: "h264",
  outputLocation: temporaryOutput,
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


if (!draft) {
  const cover = join(projectPaths(slug).working, "cover.pending.png");
  await renderStill({
    serveUrl,
    composition,
    inputProps,
    output: cover,
    frame: settledFrame(reel.shots[0]),
    imageFormat: "png",
  });
  renameSync(cover, join(projectPaths(slug).exports, "cover.png"));
}

renameSync(temporaryOutput, outputLocation);
recordOutput(slug, draft ? "draft" : "export", inputFingerprint);
console.log(`\n✓ ${outputLocation}`);
