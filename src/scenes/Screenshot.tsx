import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Card, Sfx, useFloat, usePop } from "../components/ui";
import { useShot, useTheme } from "../context";

type Props = {
  /** Image path under public/, e.g. "reels/my-reel/app.png". */
  src: string;
  /** Small tag above the frame ("the app", "step 2"). */
  label?: string;
  /** Point of the image to push in on, 0–1 from left and top. */
  focus?: [number, number];
};

/** A real screenshot or photo in a window frame that slowly pushes in on what matters. */
export const Screenshot: React.FC<Props> = ({ src, label, focus = [0.5, 0.4] }) => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const { frames } = useShot();
  const card = usePop(0);
  const tag = usePop(7, { damping: 10 });
  const float = useFloat(6, 90);
  const push = interpolate(frame, [6, frames], [1, 1.14], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const origin = `${focus[0] * 100}% ${focus[1] * 100}%`;

  return (
    <div
      style={{
        position: "relative",
        opacity: Math.min(1, card * 3),
        transform: `translateY(${float}px) rotate(${interpolate(card, [0, 1], [6, 1.5])}deg) scale(${interpolate(card, [0, 1], [0.7, 1])})`,
      }}
    >
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "18px 24px",
            borderBottom: theme.edge(4),
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 20,
                height: 20,
                borderRadius: 99,
                background: i === 0 ? theme.accent : `${theme.ink}33`,
              }}
            />
          ))}
        </div>
        <div style={{ overflow: "hidden", display: "flex" }}>
          <Img
            src={staticFile(src)}
            style={{
              display: "block",
              maxWidth: 840,
              maxHeight: 760,
              transform: `scale(${push})`,
              transformOrigin: origin,
            }}
          />
        </div>
      </Card>
      {label && (
        <div
          style={{
            position: "absolute",
            top: -40,
            left: 36,
            transform: `scale(${tag}) rotate(-3deg)`,
            background: theme.accent,
            color: theme.card,
            border: theme.edge(5),
            borderRadius: 999,
            boxShadow: theme.shadow(6),
            padding: "10px 26px",
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      )}
      <Sfx name="shutter" at={2} volume={0.45} />
      {label && <Sfx name="pop" at={7} />}
    </div>
  );
};
