import React from "react";
import {
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Sfx, cueFrames, fitText, useFloat, usePop } from "../components/ui";
import { useShot, useTheme } from "../context";
import { RISER_SECONDS } from "../sound";

type Props = {
  /** The payoff, 1–3 words ("FREE", "BANNED", "10×"). */
  text: string;
  /** Small line above it ("now it's", "verdict"). */
  kicker?: string;
  /** Spoken word that slams it down. Default: the first word of `text`, else right away. */
  cue?: string;
};

/** Frames from the cue until the stamp hits the page. */
const DROP = 4;
const PIECES = 28;
/** Confetti pull, px per frame². */
const GRAVITY = 1.5;

/**
 * One word stamped onto the page: it waits as a dashed outline, slams down on its cue with a
 * shockwave, confetti and a shake, then settles askew.
 */
export const Stamp: React.FC<Props> = ({ text, kicker, cue }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const shot = useShot();
  const [start] = cueFrames(shot.words, [cue ?? text], fps, shot.frames);
  const land = start + DROP;
  const down = frame >= start;
  const slam = spring({
    frame: frame - start,
    fps,
    config: { damping: 18, stiffness: 420, mass: 0.6 },
  });
  const since = frame - land;
  const shake = since >= 0 ? 22 * Math.max(0, 1 - since / 9) : 0;
  const float = useFloat(10, 70);
  const tag = usePop(2, { damping: 10 });
  const ghost = 0.3 + 0.12 * Math.sin(frame / 4);
  const size = fitText(
    text.toUpperCase(),
    760,
    2,
    [260, 220, 190, 160, 130, 110],
    theme.displayWidth,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 48,
        transform: `translate(${shake * Math.sin(frame * 2.3)}px, ${float + shake * 0.6 * Math.cos(frame * 3.1)}px)`,
      }}
    >
      {kicker && (
        <div
          style={{
            transform: `scale(${tag}) rotate(-2deg)`,
            background: theme.card,
            border: theme.edge(5),
            borderRadius: 999,
            boxShadow: theme.shadow(6),
            padding: "12px 32px",
            fontWeight: 800,
            fontSize: 40,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {kicker}
        </div>
      )}
      <div style={{ position: "relative" }}>
        {[0, 1].map((k) => (
          <Ring key={k} progress={(since - k * 4) / 16} heavy={k === 0} />
        ))}
        {/* Thrown out from behind the stamp, so it never covers the word. */}
        {since >= 0 &&
          Array.from({ length: PIECES }, (_, i) => (
            <Piece key={i} index={i} age={since} />
          ))}
        <div
          style={{
            position: "relative",
            fontFamily: theme.display,
            fontSize: size,
            lineHeight: 1.04,
            textAlign: "center",
            textTransform: "uppercase",
            padding: `${size * 0.08}px ${size * 0.22}px`,
            borderRadius: 24,
            ...(down
              ? {
                  ...theme.surface(theme.accent),
                  color: theme.card,
                  border: theme.edge(8),
                  boxShadow: theme.shadow(18),
                  opacity: Math.min(1, 0.5 + slam * 4),
                  transform: `scale(${interpolate(slam, [0, 1], [3, 1])}) rotate(${interpolate(slam, [0, 1], [-16, -5]) + Math.sin(frame / 14) * 1.2}deg)`,
                }
              : {
                  color: "transparent",
                  border: `6px dashed ${theme.ink}`,
                  opacity: ghost,
                  transform: "rotate(-5deg)",
                }),
          }}
        >
          {text}
        </div>
      </div>
      {kicker && <Sfx name="pop" at={2} />}
      {start >= RISER_SECONDS * fps && (
        <Sfx name="riser" at={land - RISER_SECONDS * fps} volume={0.2} />
      )}
      <Sfx name="impact" at={land} volume={0.4} />
    </div>
  );
};

/** A shockwave ring pushing out from the stamp as it lands; `progress` runs 0 → 1. */
const Ring: React.FC<{ progress: number; heavy: boolean }> = ({
  progress,
  heavy,
}) => {
  const theme = useTheme();
  if (progress < 0 || progress > 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 560,
        height: 560,
        borderRadius: "50%",
        border: `${heavy ? 14 : 7}px solid ${theme.accent}`,
        opacity: 1 - progress,
        transform: `translate(-50%, -50%) scale(${0.6 + progress * 1.9})`,
      }}
    />
  );
};

/** One scrap of confetti thrown from the stamp, `age` frames after it landed. */
const Piece: React.FC<{ index: number; age: number }> = ({ index, age }) => {
  const theme = useTheme();
  const r = (key: string) => random(`stamp-${index}-${key}`);
  const vx = interpolate(r("x"), [0, 1], [-17, 17]);
  const vy = interpolate(r("y"), [0, 1], [-34, -12]);
  const spin = interpolate(r("spin"), [0, 1], [-24, 24]);
  const fade = interpolate(age, [26, 42], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (fade === 0) return null;
  const colors = [theme.accent, theme.ink, theme.card];
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 16 + r("w") * 12,
        height: 26 + r("h") * 14,
        borderRadius: 4,
        background: colors[index % colors.length],
        border: index % 3 === 2 ? theme.edge(3) : undefined,
        boxShadow: theme.shadow(4),
        opacity: fade,
        transform: `translate(${vx * age}px, ${vy * age + 0.5 * GRAVITY * age * age}px) rotate(${spin * age}deg)`,
      }}
    />
  );
};
