import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Logo, useMonoLogo } from "../components/Logo";
import { Sfx, cueFrames, fitText, usePop } from "../components/ui";
import { useShot, useTheme } from "../context";

export type SwarmItem = {
  name: string;
  /** A logo path under public/, shown above the name. */
  icon?: string;
};

type Props = {
  /** Headline above the swarm, ≤ 4 words. */
  title?: string;
  /** Label on the centre node. */
  lead?: string;
  /** How many nodes spawn around it, 3–12. */
  count?: number;
  /** Spoken word that sets the nodes off; default "swarm". */
  cue?: string;
  /** Named nodes instead of `count`: names, or `{ name, icon }` with a product's logo. */
  items?: Array<SwarmItem | string>;
};

const RING = 305;
const NODE = 112;
const BOX = 2 * RING + NODE + 50;

/** One node spawns a ring of others that wire up to it and orbit: agents, teams, networks. */
export const Swarm: React.FC<Props> = ({
  title,
  lead = "Lead",
  count,
  cue = "swarm",
  items,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const shot = useShot();
  const [spawn] = cueFrames(shot.words, [cue], fps, shot.frames);
  const titleIn = usePop(0);
  const leadIn = usePop(3, { damping: 9 });
  const spin = frame * 0.22;
  const pulse = 1 + 0.05 * Math.sin(frame / 5);
  const c = BOX / 2;

  const resolvedItems: SwarmItem[] = items
    ? items.map((it) => (typeof it === "string" ? { name: it } : it))
    : [];

  const nodeCount = resolvedItems.length > 0 ? resolvedItems.length : (count ?? 8);

  const nodes = Array.from({ length: nodeCount }, (_, i) => {
    const at = spawn + i * 3;
    const angle = ((i / nodeCount) * 360 + spin - 90) * (Math.PI / 180);
    const reach = interpolate(frame, [at, at + 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const r = RING + Math.sin(frame / 9 + i) * 8;
    return {
      at,
      x: c + Math.cos(angle) * r,
      y: c + Math.sin(angle) * r,
      reach,
      item: resolvedItems[i],
    };
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      {title && (
        <div
          style={{
            fontFamily: theme.display,
            fontSize: fitText(
              title.toUpperCase(),
              860,
              1,
              [120, 104, 92, 80],
              theme.displayWidth,
            ),
            lineHeight: 1,
            textTransform: "uppercase",
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [-40, 0])}px)`,
          }}
        >
          {title}
        </div>
      )}
      <div style={{ position: "relative", width: BOX, height: BOX }}>
        <svg width={BOX} height={BOX} style={{ position: "absolute", inset: 0 }}>
          {nodes.map((node, i) => (
            <line
              key={i}
              x1={c}
              y1={c}
              x2={c + (node.x - c) * node.reach}
              y2={c + (node.y - c) * node.reach}
              stroke={theme.ink}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray="2 16"
              strokeDashoffset={-frame * 2}
            />
          ))}
        </svg>
        {nodes.map((node, i) => (
          <Agent
            key={i}
            x={node.x}
            y={node.y}
            at={node.at}
            name={node.item?.name}
            icon={node.item?.icon}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: c - 100,
            top: c - 100,
            width: 200,
            height: 200,
            borderRadius: 999,
            background: theme.accent,
            color: theme.card,
            border: theme.edge(6),
            boxShadow: theme.shadow(12),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: theme.display,
            fontSize: fitText(lead.toUpperCase(), 150, 1, [56, 48, 40, 34], theme.displayWidth),
            textTransform: "uppercase",
            transform: `scale(${leadIn * pulse})`,
          }}
        >
          {lead}
        </div>
      </div>
      <Sfx name="blip" at={3} volume={0.25} />
      {nodes.map((node, i) => (
        <Sfx key={i} name="pop" at={node.at} volume={0.15} variant={i} />
      ))}
    </div>
  );
};

/** A small bot or company card with icon and name. */
const Agent: React.FC<{
  x: number;
  y: number;
  at: number;
  name?: string;
  icon?: string;
}> = ({ x, y, at, name, icon }) => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const s = usePop(at, { damping: 10 });
  const mono = useMonoLogo(icon);
  const blink = (frame + at * 7) % 70 < 3 ? 0.15 : 1;
  const width = name ? 134 : NODE;
  const height = name ? 108 : NODE;

  return (
    <div
      style={{
        position: "absolute",
        left: x - width / 2,
        top: y - height / 2,
        width,
        height,
        borderRadius: 24,
        ...theme.surface(theme.card),
        border: theme.edge(5),
        boxShadow: theme.shadow(8),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "8px 6px",
        transform: `scale(${s}) rotate(${Math.sin(frame / 11 + at) * 6}deg)`,
      }}
    >
      {icon ? (
        <Logo src={icon} size={40} tint={mono ? theme.ink : undefined} />
      ) : (
        <div style={{ display: "flex", gap: 16 }}>
          {[0, 1].map((eye) => (
            <div
              key={eye}
              style={{
                width: 16,
                height: 24 * blink,
                borderRadius: 8,
                background: theme.ink,
              }}
            />
          ))}
        </div>
      )}
      {name && (
        <span
          style={{
            fontFamily: theme.display,
            fontSize: 20,
            fontWeight: 800,
            textTransform: "uppercase",
            lineHeight: 1,
            color: theme.ink,
            textAlign: "center",
          }}
        >
          {name}
        </span>
      )}
    </div>
  );
};
