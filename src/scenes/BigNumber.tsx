import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Card, Sfx, fitText, usePop } from "../components/ui";
import { useTheme } from "../context";

type Props = {
  value: number;
  /** What the number means, ≤ 6 words. */
  label: string;
  prefix?: string;
  suffix?: string;
  /** Defaults to 0 for whole numbers, 1 otherwise. */
  decimals?: number;
  /** Number formatting, e.g. "de-DE" for 1.000,5. */
  locale?: string;
};

const LAND = 27;

/** A number that counts up, lands with a tick, and gets a label card. */
export const BigNumber: React.FC<Props> = ({
  value,
  label,
  prefix = "",
  suffix = "",
  decimals,
  locale = "en-US",
}) => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const digits = decimals ?? (Number.isInteger(value) ? 0 : 1);
  const format = (n: number) =>
    `${prefix}${n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })}${suffix}`;
  const progress = interpolate(frame, [3, LAND], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const size = fitText(
    format(value),
    880,
    1,
    [320, 280, 240, 200, 170, 140],
    theme.displayWidth * 1.1,
  );
  const landed = usePop(LAND, { damping: 8, stiffness: 300 });
  const bump = 1 + 0.08 * Math.sin(Math.min(1, landed) * Math.PI);
  const labelIn = usePop(10);
  const bar = interpolate(frame, [LAND, LAND + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drift = interpolate(frame, [0, 150], [1, 1.05]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transform: `scale(${drift})`,
      }}
    >
      <div
        style={{
          fontFamily: theme.display,
          fontSize: size,
          lineHeight: 1,
          color: theme.accent,
          textShadow: theme.textShadow(10),
          fontVariantNumeric: "tabular-nums",
          transform: `scale(${bump})`,
        }}
      >
        {format(value * progress)}
      </div>
      <div
        style={{
          height: 18,
          width: 560 * bar,
          background: theme.ink,
          borderRadius: 9,
          marginTop: 18,
        }}
      />
      <Card
        style={{
          marginTop: 56,
          maxWidth: 820,
          opacity: labelIn,
          transform: `translateY(${interpolate(labelIn, [0, 1], [80, 0])}px) rotate(-1.5deg)`,
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: fitText(
              label.toUpperCase(),
              720,
              2,
              [56, 50, 44, 38],
              0.66,
            ),
            lineHeight: 1.15,
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      </Card>
      <Sfx name="tick" at={LAND} />
    </div>
  );
};
