import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, fitText } from "../components/ui";
import { useShot, useTheme } from "../context";

type Props = {
  /** 1–3 short lines, the words people read before they decide to stay. */
  lines: string[];
  /** Word(s) to put on the accent block. */
  highlight?: string;
};

const STAGGER = 3;
const clean = (word: string) => word.toUpperCase().replace(/[.,!?;:]+$/, "");
/** How hard a word (and the accent block) kicks when it hits. */
const KICK = 0.16;
const HOT_KICK = 0.5;

/**
 * Giant headline, readable from the very first frame (it's also the reel's cover), that hits
 * word by word and lands its accent again on the last spoken word, so the hook never rests.
 * Made for shot one; set `"captions": false`.
 */
export const Hook: React.FC<Props> = ({ lines, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const shot = useShot();
  const hot = new Set(
    (highlight ?? "").split(/\s+/).filter(Boolean).map(clean),
  );
  const rows = lines.map((line) => line.split(/\s+/).filter(Boolean));
  const longest = lines.reduce((a, b) => (b.length > a.length ? b : a), "");
  const size = fitText(
    longest,
    860,
    1,
    [240, 220, 200, 180, 160, 140, 120, 104, 92, 80],
    theme.displayWidth,
  );
  const firstHot = rows.flat().findIndex((word) => hot.has(clean(word)));
  const count = rows.flat().length;
  // 1 the frame something hits, settling back to 0 with a little overshoot.
  const kick = (at: number) =>
    frame < at
      ? 0
      : 1 -
        spring({
          frame: frame - at,
          fps,
          config: { damping: 11, stiffness: 240, mass: 0.5 },
        });
  // Second hit on the payoff: the last spoken word, once every word has landed.
  const last = shot.words.at(-1);
  const again = Math.max(
    count * STAGGER + 11,
    Math.round((last?.start ?? 0) * fps),
  );
  const rehit = again < shot.frames - 4 ? kick(again) : 0;
  const zoom =
    interpolate(frame, [0, 150], [1, 1.07]) + (firstHot < 0 ? rehit * 0.05 : 0);
  let index = 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: size * 0.12,
        transform: `scale(${zoom})`,
      }}
    >
      {rows.map((words, r) => (
        <div key={r} style={{ display: "flex", gap: size * 0.2 }}>
          {words.map((word) => {
            // Frame 0 stays the clean, settled headline: the cover. Hits start on frame 1.
            const delay = 1 + index++ * STAGGER;
            const isHot = hot.has(clean(word));
            const hit = kick(delay) * (isHot ? HOT_KICK : KICK);
            const punch = isHot ? rehit * KICK : 0;
            return (
              <span
                key={delay}
                style={{
                  display: "inline-block",
                  fontFamily: theme.display,
                  fontSize: size,
                  lineHeight: 1.08,
                  textTransform: "uppercase",
                  transform: `scale(${1 + hit + punch}) rotate(${isHot ? -3 + punch * 12 : 0}deg)`,
                  color: isHot ? theme.card : theme.ink,
                  background: isHot ? theme.accent : undefined,
                  padding: isHot ? `0 ${size * 0.14}px` : undefined,
                  borderRadius: isHot ? 16 : undefined,
                  boxShadow: isHot ? theme.shadow(12) : undefined,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      ))}
      <Sfx name="whip" volume={0.25} />
      <Sfx name="impact" at={1 + Math.max(0, firstHot) * STAGGER} volume={0.35} />
      {again < shot.frames - 4 && <Sfx name="pop" at={again} volume={0.25} />}
    </div>
  );
};
