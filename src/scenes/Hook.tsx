import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, fitText } from "../components/ui";
import { useTheme } from "../context";

type Props = {
  /** 1–3 short lines, the words people read before they decide to stay. */
  lines: string[];
  /** Word(s) to put on the accent block. */
  highlight?: string;
};

const STAGGER = 3;
const clean = (word: string) => word.toUpperCase().replace(/[.,!?;:]+$/, "");

/** Giant headline that slams in word by word. Made for shot one; set `"captions": false`. */
export const Hook: React.FC<Props> = ({ lines, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
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
  const zoom = interpolate(frame, [0, 150], [1, 1.07]);
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
            const delay = index++ * STAGGER;
            const isHot = hot.has(clean(word));
            const s = spring({
              frame: frame - delay,
              fps,
              config: { damping: 11, stiffness: 240, mass: 0.5 },
            });
            return (
              <span
                key={delay}
                style={{
                  display: "inline-block",
                  fontFamily: theme.display,
                  fontSize: size,
                  lineHeight: 1.08,
                  textTransform: "uppercase",
                  opacity: interpolate(s, [0, 0.2], [0, 1], {
                    extrapolateRight: "clamp",
                  }),
                  transform: `scale(${interpolate(s, [0, 1], [1.9, 1])}) rotate(${isHot ? -3 : 0}deg)`,
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
      {firstHot >= 0 && <Sfx name="pop" at={firstHot * STAGGER + 2} />}
    </div>
  );
};
