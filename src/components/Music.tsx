import React, { useMemo } from "react";
import { Html5Audio, staticFile, useVideoConfig } from "remotion";
import { MUSIC, type MusicName, musicFile } from "../sound";
import type { Shot } from "../types";

/** Music level between lines, and while a line is spoken. */
const BED = 0.3;
const DUCK = 0.14;
/** Frames the music takes to dip before a line, and to come back up after it. */
const DIP = 6;
const RISE = 10;

/** A music bed under the whole reel that ducks whenever a line is spoken. */
export const Music: React.FC<{ name: MusicName; shots: Shot[] }> = ({
  name,
  shots,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const curve = useMemo(() => {
    const target = new Float32Array(durationInFrames).fill(BED);
    for (const shot of shots) {
      const from = shot.from + Math.floor((shot.words[0]?.start ?? 0) * fps);
      target.fill(DUCK, from, shot.from + Math.ceil(shot.end * fps));
    }
    // Forwards it climbs back slowly after a line; backwards it dips just before the next one.
    const level = Float32Array.from(target);
    for (let f = 1; f < level.length; f++)
      level[f] = Math.min(target[f], level[f - 1] + (BED - DUCK) / RISE);
    for (let f = level.length - 2; f >= 0; f--)
      level[f] = Math.min(level[f], level[f + 1] + (BED - DUCK) / DIP);
    // Fade in over the first frames and out over the last second.
    for (let f = 0; f < level.length; f++)
      level[f] *= Math.min(1, f / 10, (level.length - 1 - f) / fps);
    return level;
  }, [shots, fps, durationInFrames]);

  if (!MUSIC.includes(name)) {
    throw new Error(
      `Unknown music "${name}" in script.json. Pick one of: ${MUSIC.join(", ")}.`,
    );
  }
  return (
    <Html5Audio
      src={staticFile(musicFile(name))}
      loop
      // Keep counting frames across loops, so the curve lines up with the reel.
      loopVolumeCurveBehavior="extend"
      volume={(f) => curve[Math.min(f, curve.length - 1)]}
    />
  );
};
