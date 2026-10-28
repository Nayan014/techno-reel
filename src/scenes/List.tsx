import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Card, Sfx, cueFrames, fitText, usePop } from "../components/ui";
import { useShot, useTheme } from "../context";

type Props = {
  title?: string;
  /** 2–4 items. Each one appears when its first word is spoken. */
  items: string[];
};

/** Numbered items that pop in as they are spoken; only the newest one is in focus. */
export const List: React.FC<Props> = ({ title, items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shot = useShot();
  const cues = cueFrames(shot.words, items, fps, shot.frames);
  const current = cues.filter((cue) => frame >= cue).length - 1;
  const titleIn = usePop(0);
  const theme = useTheme();

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 34,
      }}
    >
      {title && (
        <div
          style={{
            fontFamily: theme.display,
            fontSize: fitText(
              title.toUpperCase(),
              900,
              1,
              [104, 92, 80],
              theme.displayWidth,
            ),
            lineHeight: 1,
            textTransform: "uppercase",
            marginBottom: 10,
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [-40, 0])}px)`,
          }}
        >
          {title}
        </div>
      )}
      {items.map((item, i) => (
        <Row
          key={i}
          index={i}
          text={item}
          at={cues[i]}
          focused={i === current}
        />
      ))}
      {cues.map((cue, i) => (
        <Sfx key={i} name="pop" at={cue} volume={0.4} />
      ))}
    </div>
  );
};

const Row: React.FC<{
  index: number;
  text: string;
  at: number;
  focused: boolean;
}> = ({ index, text, at, focused }) => {
  const theme = useTheme();
  const s = usePop(at);
  const size = fitText(text, 560, 2, [52, 46, 40], 0.62);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28,
        opacity: Math.min(1, s * 2) * (focused ? 1 : 0.45),
        transform: `translateX(${interpolate(s, [0, 1], [160, 0])}px) scale(${focused ? 1 : 0.96})`,
      }}
    >
      <div
        style={{
          width: 104,
          height: 104,
          flexShrink: 0,
          borderRadius: 999,
          background: theme.accent,
          border: theme.edge(6),
          boxShadow: theme.shadow(6),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: theme.display,
          fontSize: 60,
          color: theme.card,
        }}
      >
        {index + 1}
      </div>
      <Card
        style={{
          flex: 1,
          padding: "26px 34px",
          boxShadow: theme.shadow(10),
        }}
      >
        <div style={{ fontWeight: 800, fontSize: size, lineHeight: 1.15 }}>
          {text}
        </div>
      </Card>
    </div>
  );
};
