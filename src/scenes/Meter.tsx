import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, fitText, useFloat, usePop } from "../components/ui";
import { useShot, useTheme } from "../context";
import { RISER_SECONDS } from "../sound";

type Props = {
  /** What fills up, 1–2 words ("adenosine"). */
  label: string;
  /** Scale label at the full end ("sleepy"). */
  top?: string;
  /** Scale label at the empty end ("awake"). */
  bottom?: string;
  /** How full the tank ends up, 0–1. */
  level?: number;
};

const W = 340;
const H = 560;
const BUBBLES = [0.16, 0.4, 0.64, 0.86, 0.28, 0.74];
const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** A tank that fills up over the shot and strains when full: anything building up. */
export const Meter: React.FC<Props> = ({ label, top, bottom, level = 0.9 }) => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const { frames } = useShot();
  const { fps } = useVideoConfig();
  const titleIn = usePop(0);
  const tankIn = usePop(5);
  const float = useFloat(8, 90);

  const full = Math.round(frames * 0.85);
  const progress = interpolate(frame, [8, full], [0.05, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const surface = H * (1 - level * progress);
  const strain = interpolate(progress, [0.75, 1], [0, 1], clamp);
  const shake = Math.sin(frame * 1.7) * 1.8 * strain;

  const wave = (x: number) =>
    surface + Math.sin((x / W) * Math.PI * 3 + frame / 5) * 12;
  const xs = Array.from({ length: 18 }, (_, i) => (i / 17) * W);
  const crest = xs.map((x, i) => `${i ? "L" : "M"}${x},${wave(x)}`).join(" ");
  const liquid = `${crest} L${W},${H} L0,${H} Z`;

  const scaleLabel = (text: string, active: number): React.CSSProperties => ({
    position: "absolute",
    left: 70,
    transform: `translateY(-50%) scale(${1 + 0.1 * active})`,
    transformOrigin: "left center",
    color: active > 0.5 ? theme.accent : theme.ink,
    fontWeight: 800,
    fontSize: fitText(text.toUpperCase(), 230, 1, [52, 46, 40, 34], 0.66),
    letterSpacing: 2,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 44,
        transform: `translateY(${float}px)`,
      }}
    >
      <div
        style={{
          fontFamily: theme.display,
          fontSize: fitText(
            label.toUpperCase(),
            860,
            1,
            [170, 150, 130, 110, 96],
            theme.displayWidth,
          ),
          lineHeight: 1,
          textTransform: "uppercase",
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [-50, 0])}px)`,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 56,
          opacity: Math.min(1, tankIn * 2),
          transform: `scale(${interpolate(tankIn, [0, 1], [0.7, 1])}) rotate(${shake}deg)`,
        }}
      >
        <div
          style={{
            position: "relative",
            width: W,
            height: H,
            border: theme.edge(6),
            borderRadius: 44,
            ...theme.surface(theme.card),
            boxShadow: theme.shadow(14),
            overflow: "hidden",
          }}
        >
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <path d={liquid} fill={theme.accent} />
            {BUBBLES.map((x, i) => {
              const rise = ((frame * (2 + (i % 3)) + i * 37) % 160) / 160;
              const y = H - rise * (H - surface);
              return y > surface + 26 ? (
                <circle
                  key={i}
                  cx={x * W}
                  cy={y}
                  r={9 + (i % 3) * 4}
                  fill={theme.card}
                  opacity={0.55}
                />
              ) : null;
            })}
            <path d={crest} fill="none" stroke={theme.ink} strokeWidth={6} />
          </svg>
        </div>
        <div style={{ position: "relative", width: 300, height: H }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 6,
              borderRadius: 3,
              background: theme.ink,
            }}
          />
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <div
              key={t}
              style={{
                position: "absolute",
                left: 0,
                top: H * t - 3,
                width: t % 0.5 === 0 ? 40 : 24,
                height: 6,
                borderRadius: 3,
                background: theme.ink,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: -22,
              top: surface - 22,
              width: 44,
              height: 44,
              borderRadius: 999,
              background: theme.accent,
              border: theme.edge(6),
              boxShadow: theme.shadow(4),
              boxSizing: "border-box",
            }}
          />
          {top && <div style={{ ...scaleLabel(top, strain), top: 0 }}>{top}</div>}
          {bottom && (
            <div style={{ ...scaleLabel(bottom, 0), top: H }}>{bottom}</div>
          )}
        </div>
      </div>
      <Sfx name="riser" at={Math.max(5, full - RISER_SECONDS * fps)} volume={0.25} />
      <Sfx name="impact" at={full} volume={0.3} />
    </div>
  );
};
