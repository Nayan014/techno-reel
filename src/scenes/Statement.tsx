import React from "react";
import { interpolate } from "remotion";
import { BrandIcon } from "../components/BrandIcons";
import { Card, Sfx, fitText, useFloat, usePop } from "../components/ui";
import { useTheme } from "../context";

type Props = {
  /** The one idea of this shot, ≤ 8 words. */
  text: string;
  /** Small tag above the card ("the hook", "plot twist", "step 2"). */
  kicker?: string;
  /** Optional brand icon identifier. */
  icon?: string;
};

/** A tilted card with one big idea on it. */
export const Statement: React.FC<Props> = ({ text, kicker, icon }) => {
  const theme = useTheme();
  const card = usePop(0);
  const tag = usePop(7, { damping: 10 });
  const float = useFloat(8, 90);
  const size = fitText(
    text.toUpperCase(),
    740,
    4,
    [180, 160, 140, 124, 110, 96, 84, 72],
    theme.displayWidth,
  );

  return (
    <div
      style={{
        position: "relative",
        opacity: Math.min(1, card * 3),
        transform: `translateY(${float}px) rotate(${interpolate(card, [0, 1], [-10, -2])}deg) scale(${interpolate(card, [0, 1], [0.6, 1])})`,
      }}
    >
      <Card style={{ padding: "64px 56px 56px", maxWidth: 880 }}>
        {icon && (
          <div style={{ marginBottom: 20 }}>
            <BrandIcon name={icon} size={72} />
          </div>
        )}
        <div
          style={{
            fontFamily: theme.display,
            fontSize: size,
            lineHeight: 1.04,
            textTransform: "uppercase",
          }}
        >
          {text}
        </div>
      </Card>
      {kicker && (
        <div
          style={{
            position: "absolute",
            top: -44,
            left: 40,
            transform: `scale(${tag}) rotate(3deg)`,
            background: theme.accent,
            color: theme.card,
            border: theme.edge(5),
            borderRadius: 999,
            boxShadow: theme.shadow(6),
            padding: "12px 28px",
            fontWeight: 800,
            fontSize: 36,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {kicker}
        </div>
      )}
      {kicker && <Sfx name="pop" at={7} volume={0.35} />}
    </div>
  );
};
