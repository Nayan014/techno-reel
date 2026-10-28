import React from "react";
import { interpolate, useVideoConfig } from "remotion";
import { Card, Sfx, cueFrames, fitText, usePop } from "../components/ui";
import { useShot, useTheme } from "../context";

type Side = { label: string; value: string };

type Props = {
  left: Side;
  right: Side;
  winner?: "left" | "right";
};

/** Two cards face off; each slides in when its label is spoken, then the winner grows. */
export const Compare: React.FC<Props> = ({ left, right, winner }) => {
  const { fps } = useVideoConfig();
  const shot = useShot();
  const [leftAt, rightAt] = cueFrames(
    shot.words,
    [left.label, right.label],
    fps,
    shot.frames,
  );
  const leftIn = usePop(leftAt);
  const rightIn = usePop(rightAt);
  const vs = usePop(leftAt + 6, { damping: 9 });
  const verdict = usePop(rightAt + 12);

  const emphasis = (side: "left" | "right") => {
    if (!winner) return { scale: 1, opacity: 1, tilt: 0 };
    const wins = side === winner;
    return {
      scale: 1 + (wins ? 0.07 : -0.04) * verdict,
      opacity: wins ? 1 : 1 - 0.45 * verdict,
      tilt: (wins ? 0 : side === "left" ? -6 : 6) * verdict,
    };
  };
  const l = emphasis("left");
  const r = emphasis("right");

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        gap: 56,
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity: Math.min(1, leftIn * 2) * l.opacity,
          transform: `translateX(${interpolate(leftIn, [0, 1], [-520, 0])}px) rotate(${-3 + l.tilt}deg) scale(${l.scale})`,
        }}
      >
        <Panel side={left} highlighted={winner === "left" && verdict > 0.5} />
      </div>
      <div
        style={{
          opacity: Math.min(1, rightIn * 2) * r.opacity,
          transform: `translateX(${interpolate(rightIn, [0, 1], [520, 0])}px) rotate(${3 + r.tilt}deg) scale(${r.scale})`,
        }}
      >
        <Panel side={right} highlighted={winner === "right" && verdict > 0.5} />
      </div>
      <VsBadge scale={vs} />
      <Sfx name="snap" at={rightAt} volume={0.15} />
      {winner && <Sfx name="ding" at={rightAt + 12} volume={0.16} />}
    </div>
  );
};

const Panel: React.FC<{ side: Side; highlighted: boolean }> = ({
  side,
  highlighted,
}) => {
  const theme = useTheme();
  const valueSize = fitText(
    side.value.toUpperCase(),
    300,
    2,
    [150, 128, 108, 90, 76],
    theme.displayWidth,
  );
  return (
    <Card
      fill={highlighted ? theme.accent : undefined}
      style={{
        width: 392,
        minHeight: 420,
        padding: "40px 30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        color: highlighted ? theme.card : theme.ink,
      }}
    >
      <div
        style={{
          fontFamily: theme.display,
          fontSize: valueSize,
          lineHeight: 1,
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        {side.value}
      </div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 40,
          lineHeight: 1.15,
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        {side.label}
      </div>
    </Card>
  );
};

const VsBadge: React.FC<{ scale: number }> = ({ scale }) => {
  const theme = useTheme();
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 120,
        height: 120,
        marginLeft: -60,
        marginTop: -60,
        borderRadius: 999,
        background: theme.ink,
        color: theme.card,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: theme.display,
        fontSize: 56,
        transform: `scale(${scale}) rotate(-8deg)`,
      }}
    >
      VS
    </div>
  );
};
