import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Logo, useMonoLogo } from "../components/Logo";
import { Card, Sfx, fitText, useFloat, usePop } from "../components/ui";
import { useShot, useTheme } from "../context";

type Props = {
  /** What gets typed into the box, letter by letter over the shot. */
  prompt: string;
  /** Headline above the box, ≤ 6 words. */
  title?: string;
  /** Small tag above the card ("2022", "step 1"). */
  kicker?: string;
  /** The chat app's name in the header. Default "Chat". */
  app?: string;
  /** The app's logo in the header, a path under public/ ("reels/<slug>/icons/openai.svg"); else its initial. */
  icon?: string;
};

/** Typing starts this many frames into the shot. */
const TYPE_FROM = 8;
/** A keystroke every this many frames while typing. */
const TICK_EVERY = 6;

/** A chat app's input box with a prompt typing itself in. */
export const ChatPrompt: React.FC<Props> = ({
  prompt,
  title,
  kicker,
  app = "Chat",
  icon,
}) => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const shot = useShot();
  const cardPop = usePop(0);
  const tagPop = usePop(6, { damping: 10 });
  const float = useFloat(6, 85);
  const mono = useMonoLogo(icon);
  const colorLogo = icon && !mono;

  const typeTo = Math.max(TYPE_FROM + 15, shot.frames - 18);
  const typed = Math.floor(
    interpolate(frame, [TYPE_FROM, typeTo], [0, prompt.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const visibleText = prompt.slice(0, typed);
  const typing = frame >= TYPE_FROM && frame < typeTo;
  const showCursor = typing && Math.floor(frame / 6) % 2 === 0;
  const ticks = Array.from(
    { length: Math.floor((typeTo - TYPE_FROM) / TICK_EVERY) },
    (_, i) => TYPE_FROM + i * TICK_EVERY,
  );

  const titleSize = title
    ? fitText(title.toUpperCase(), 720, 2, [88, 76, 68, 58], theme.displayWidth)
    : 0;

  return (
    <div
      style={{
        position: "relative",
        opacity: Math.min(1, cardPop * 3),
        transform: `translateY(${float}px) rotate(${interpolate(cardPop, [0, 1], [-8, -1])}deg) scale(${interpolate(cardPop, [0, 1], [0.75, 1])})`,
        width: "100%",
        maxWidth: 920,
      }}
    >
      <Card
        style={{
          padding: "44px 40px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* Header: the app's icon and name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            borderBottom: `2px dashed ${theme.ink}20`,
            paddingBottom: 20,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              // A colour logo sits on card, never on the accent it could clash with.
              background: colorLogo ? theme.card : theme.accent,
              border: colorLogo ? theme.edge(3) : undefined,
              color: theme.card,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: theme.shadow(4),
              fontFamily: theme.display,
              fontSize: 34,
            }}
          >
            {icon ? (
              <Logo src={icon} size={38} tint={mono ? theme.card : undefined} />
            ) : (
              app.charAt(0).toUpperCase()
            )}
          </div>
          <div
            style={{
              fontFamily: theme.display,
              fontSize: 34,
              fontWeight: 900,
              textTransform: "uppercase",
              lineHeight: 1,
              letterSpacing: 1,
            }}
          >
            {app}
          </div>
        </div>

        {title && (
          <div
            style={{
              fontFamily: theme.display,
              fontSize: titleSize,
              lineHeight: 1.05,
              textTransform: "uppercase",
            }}
          >
            {title}
          </div>
        )}

        {/* The input box */}
        <div
          style={{
            position: "relative",
            background: theme.paper,
            border: theme.edge(4),
            borderRadius: 28,
            boxShadow: theme.shadow(6),
            padding: "24px 76px 24px 28px",
            minHeight: 110,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              lineHeight: 1.3,
              color: visibleText ? theme.ink : `${theme.ink}50`,
              wordBreak: "break-word",
            }}
          >
            {visibleText || "Ask anything..."}
            {showCursor && (
              <span
                style={{
                  display: "inline-block",
                  width: 4,
                  height: 32,
                  marginLeft: 4,
                  verticalAlign: "middle",
                  background: theme.accent,
                }}
              />
            )}
          </div>

          {/* Send button */}
          <div
            style={{
              position: "absolute",
              right: 18,
              width: 52,
              height: 52,
              borderRadius: 999,
              background: typed > 0 ? theme.accent : `${theme.ink}20`,
              color: theme.card,
              border: theme.edge(3),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </div>
        </div>
      </Card>

      {kicker && (
        <div
          style={{
            position: "absolute",
            top: -38,
            left: 36,
            transform: `scale(${tagPop}) rotate(3deg)`,
            background: theme.accent,
            color: theme.card,
            border: theme.edge(5),
            borderRadius: 999,
            boxShadow: theme.shadow(6),
            padding: "10px 26px",
            fontWeight: 800,
            fontSize: 32,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {kicker}
        </div>
      )}

      {kicker && <Sfx name="pop" at={6} />}
      {ticks.map((at) => (
        <Sfx key={at} name="key" at={at} volume={0.18} />
      ))}
      <Sfx name="blip" at={typeTo} volume={0.25} />
    </div>
  );
};
