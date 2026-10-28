import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useTheme } from "../context";
import { GRAIN } from "../theme";

export const Background: React.FC = () =>
  useTheme().style === "print" ? <PaperRoom /> : <DotGrid />;

/** Paper with a slowly drifting dot grid. */
const DotGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.paper,
        backgroundImage: `radial-gradient(${theme.ink}26 2.6px, transparent 2.8px)`,
        backgroundSize: "46px 46px",
        backgroundPosition: `${frame * 0.35}px ${frame * 0.7}px`,
      }}
    />
  );
};

/** A wavy cut edge `y` px down a 1080-wide sheet, drifting with `phase`. */
const wavyEdge = (y: number, amplitude: number, phase: number, flip = false) => {
  const points = Array.from({ length: 13 }, (_, i) => {
    const x = (i / 12) * 1200 - 60;
    const wobble =
      Math.sin(i * 1.7 + phase) * amplitude +
      Math.sin(i * 0.6 - phase * 0.7) * amplitude * 0.6;
    return `${x},${y + wobble}`;
  });
  const end = flip ? -40 : 1960;
  return `M-60,${end} L${points.join(" L")} L1140,${end} Z`;
};

/** Card stock under a warm lamp: grain, a soft light spill and layered cut-paper edges. */
const PaperRoom: React.FC = () => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const phase = frame / 45;
  const drift = Math.sin(frame / 70) * 10;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.paper,
        backgroundImage: `radial-gradient(90% 55% at 22% 12%, ${theme.card}cc 0%, transparent 70%), radial-gradient(140% 95% at 50% 45%, transparent 55%, ${theme.ink}24 100%), ${GRAIN}`,
      }}
    >
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="lift" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="-6" stdDeviation="9" floodColor={theme.ink} floodOpacity="0.16" />
          </filter>
          <filter id="drop" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="4" dy="8" stdDeviation="10" floodColor={theme.ink} floodOpacity="0.18" />
          </filter>
        </defs>
        <g transform={`translate(0 ${drift * 0.4})`} filter="url(#drop)">
          <path d={wavyEdge(150, 18, phase, true)} fill={theme.paper} />
        </g>
        <g transform={`translate(0 ${-drift * 0.5})`} filter="url(#lift)">
          <path d={wavyEdge(1600, 22, phase + 2)} fill={theme.accent} opacity={0.85} />
        </g>
        <g transform={`translate(0 ${drift * 0.3})`} filter="url(#lift)">
          <path d={wavyEdge(1700, 16, -phase)} fill={theme.paper} />
        </g>
      </svg>
      <AbsoluteFill style={{ backgroundImage: GRAIN, opacity: 0.6 }} />
    </AbsoluteFill>
  );
};
