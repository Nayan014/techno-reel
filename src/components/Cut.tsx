import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { useTheme } from "../context";
import { HEIGHT, WIDTH } from "../timeline";

/** Frames a cut's wipe stays on screen. */
const LENGTH = 9;

/**
 * What the eye catches at a cut, in the reel's style: a band of halftone dots sweeping across
 * the paper, or glitchy bars flickering over the flat look. `seed` varies it per cut.
 */
export const Cut: React.FC<{ seed: number }> = ({ seed }) => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  if (frame >= LENGTH) return null;
  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {theme.style === "print" ? (
          <Halftone frame={frame} />
        ) : (
          <Glitch frame={frame} seed={seed} />
        )}
      </svg>
    </AbsoluteFill>
  );
};

const CELL = 90;
/** How far either side of the sweep's front the dots still show, in diagonal units (0–1). */
const BAND = 0.22;

/** Dots that swell into a solid band at a diagonal front, which sweeps top left to bottom right. */
const Halftone: React.FC<{ frame: number }> = ({ frame }) => {
  const theme = useTheme();
  const front = interpolate(frame, [0, LENGTH - 1], [-BAND, 1 + BAND]);
  const dots: React.ReactNode[] = [];
  for (let y = CELL / 2; y < HEIGHT + CELL; y += CELL)
    for (let x = CELL / 2; x < WIDTH + CELL; x += CELL) {
      const along = (x / WIDTH + y / HEIGHT) / 2;
      const r = CELL * 0.62 * Math.max(0, 1 - Math.abs(along - front) / BAND);
      if (r > 1)
        dots.push(<circle key={`${x}:${y}`} cx={x} cy={y} r={r} fill={theme.accent} />);
    }
  return <g opacity={0.94}>{dots}</g>;
};

/** A few bars of the theme's colours, jumping sideways and flickering, fewer every frame. */
const Glitch: React.FC<{ frame: number; seed: number }> = ({ frame, seed }) => {
  const theme = useTheme();
  const colors = [theme.accent, theme.ink, theme.card];
  const count = Math.round(interpolate(frame, [0, LENGTH - 1], [7, 2]));
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const r = (key: string) => random(`cut-${seed}-${frame}-${i}-${key}`);
        if (r("on") < 0.2) return null;
        const height = 14 + r("h") * 110;
        return (
          <rect
            key={i}
            x={(r("x") - 0.5) * 220}
            y={r("y") * (HEIGHT - height)}
            width={WIDTH}
            height={height}
            fill={colors[i % colors.length]}
          />
        );
      })}
    </>
  );
};
