// Shared by the video and the Node scripts (Node runs this file directly), so it may only
// `import type` and must not touch Remotion.
import type { ReelData, Script, Voice } from "./types";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Breath after each spoken line. */
const PAD = 0.2;
/** A talking head cuts tight: one frame or two between sentences. */
const TAKE_PAD = 0.06;
/** Extra hold on the last shot so the CTA can land before the loop. */
const END_HOLD = 0.8;

/** Joins the authored script with its recorded voice and lays the shots end to end. */
export const buildReel = (
  slug: string,
  script: Script,
  voice: Voice | null,
): ReelData => {
  let from = 0;
  const pad = script.take ? TAKE_PAD : PAD;
  const shots = script.shots.map((shot, i) => {
    const line = voice?.lines[shot.id];
    if (
      !line ||
      line.say !== shot.say ||
      String(line.clip) !== String(shot.clip)
    ) {
      throw new Error(
        `Shot "${shot.id}" has no voice for its current line. Run: npm run voice -- ${slug}`,
      );
    }
    const last = i === script.shots.length - 1;
    const frames = Math.round((line.end + pad + (last ? END_HOLD : 0)) * FPS);
    const placed = { ...shot, ...line, from, frames };
    from += frames;
    return placed;
  });
  return { ...script, shots, durationInFrames: Math.max(1, from) };
};
