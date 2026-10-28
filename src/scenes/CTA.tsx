import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, fitText, usePop } from "../components/ui";
import { useTheme } from "../context";

type Props = {
  /** What to do and why, ≤ 7 words. */
  text: string;
  /** Label on the pulsing button, e.g. "Follow" or a comment keyword. */
  button?: string;
};

/** Closing ask with a pulsing button and a bouncing arrow. Always the last shot. */
export const CTA: React.FC<Props> = ({ text, button = "Follow" }) => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const textIn = usePop(0);
  const buttonIn = usePop(8, { damping: 9 });
  const pulse = 1 + 0.045 * Math.sin(frame / 6);
  const nudge = Math.abs(Math.sin(frame / 8)) * 22;
  const size = fitText(
    text.toUpperCase(),
    820,
    3,
    [150, 130, 112, 96, 84, 72],
    theme.displayWidth,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 80,
      }}
    >
      <div
        style={{
          fontFamily: theme.display,
          fontSize: size,
          lineHeight: 1.04,
          textAlign: "center",
          textTransform: "uppercase",
          transform: `scale(${textIn})`,
        }}
      >
        {text}
      </div>
      <div
        style={{
          position: "relative",
          transform: `scale(${buttonIn * pulse})`,
        }}
      >
        <div
          style={{
            background: theme.accent,
            color: theme.card,
            border: theme.edge(6),
            borderRadius: 999,
            boxShadow: theme.shadow(12),
            padding: "30px 72px",
            fontWeight: 800,
            fontSize: 64,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {button}
        </div>
        <svg
          width={140}
          height={100}
          viewBox="0 0 140 100"
          style={{
            position: "absolute",
            top: "50%",
            marginTop: -50,
            right: -160,
            transform: `translateX(${nudge}px)`,
          }}
        >
          <path
            d="M128 18 C 96 12, 56 30, 18 62 M18 62 L 26 30 M18 62 L 52 64"
            fill="none"
            stroke={theme.ink}
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <Sfx name="click" at={8} volume={0.3} />
      <Sfx name="success" at={11} />
    </div>
  );
};
