import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { useTheme } from "../context";
import { LAYOUT } from "../theme";
import type { Layout } from "../types";

type Props = {
  /** Path under public/. */
  src: string;
  /** Frame of the take this shot starts on. */
  trimBefore: number;
  layout: Exclude<Layout, "graphic">;
  /** Where the face is, 0–1, so crops and punch-ins keep it in frame. */
  focus: [number, number];
};

/** Your recording for one shot: full frame, punched in, or in a window under the scene. */
export const Take: React.FC<Props> = ({ src, trimBefore, layout, focus }) => {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const [fx, fy] = focus;
  const origin = `${fx * 100}% ${fy * 100}%`;
  // A slow push keeps a locked-off camera from ever sitting still.
  const push = interpolate(frame, [0, 150], [1, 1.04]);
  const zoom = (layout === "punch" ? 1.28 : 1) * push;
  const video = (
    <OffthreadVideo
      src={staticFile(src)}
      trimBefore={trimBefore}
      muted
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: origin,
        transform: `scale(${zoom})`,
        transformOrigin: origin,
      }}
    />
  );

  if (layout !== "split") return <AbsoluteFill>{video}</AbsoluteFill>;
  return (
    <div
      style={{
        position: "absolute",
        top: LAYOUT.splitWindowTop,
        left: LAYOUT.stageSide,
        right: LAYOUT.stageSide,
        height: LAYOUT.splitWindowBottom - LAYOUT.splitWindowTop,
        borderRadius: 36,
        overflow: "hidden",
        border: theme.edge(6),
        boxShadow: theme.shadow(14),
        background: theme.ink,
      }}
    >
      {video}
    </div>
  );
};
