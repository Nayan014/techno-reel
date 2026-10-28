import React from "react";
import {
  AbsoluteFill,
  Html5Audio,
  Sequence,
  interpolate,
  staticFile,
  useVideoConfig,
} from "remotion";
import { Background } from "./components/Background";
import { Captions } from "./components/Captions";
import { Handle } from "./components/Handle";
import { Host } from "./components/Host";
import { Take } from "./components/Take";
import { Sfx } from "./components/ui";
import { ShotContext, ThemeContext, useTheme } from "./context";
import { body } from "./fonts";
import { scenes } from "./scenes";
import { LAYOUT, makeTheme } from "./theme";
import type { Layout, ReelData, Shot } from "./types";

export type ReelProps = {
  slug: string;
  /** Filled in by calculateMetadata from public/reels/<slug>/. */
  reel: ReelData | null;
};

export const Reel: React.FC<ReelProps> = ({ slug, reel }) => {
  if (!reel) throw new Error(`Reel "${slug}" was not loaded`);
  const theme = makeTheme(reel.palette, reel.style);
  // On a talking head you are the host.
  const host = theme.style === "print" && !reel.take && reel.host !== false;
  return (
    <ThemeContext.Provider value={theme}>
      <AbsoluteFill style={{ fontFamily: body, color: theme.ink }}>
        <Background />
        {reel.shots.map((shot, i) => (
          <Sequence
            key={shot.id}
            from={shot.from}
            durationInFrames={shot.frames}
            name={`${shot.id} · ${shot.layout ?? ""} ${shot.scene ?? ""}`}
          >
            <ShotView
              shot={shot}
              previous={reel.shots[i - 1]}
              take={reel.take ? `reels/${slug}/${reel.take}` : undefined}
              focus={reel.focus ?? [0.5, 0.4]}
              host={host}
            />
          </Sequence>
        ))}
        {host && <Host shots={reel.shots} />}
        <Handle text={reel.handle} />
      </AbsoluteFill>
    </ThemeContext.Provider>
  );
};

const layoutOf = (shot: Shot, take: boolean): Layout =>
  take ? (shot.layout ?? (shot.scene ? "graphic" : "full")) : "graphic";

const ShotView: React.FC<{
  shot: Shot;
  previous?: Shot;
  take?: string;
  focus: [number, number];
  host: boolean;
}> = ({ shot, previous, take, focus, host }) => {
  const { fps } = useVideoConfig();
  const Scene = shot.scene ? scenes[shot.scene] : undefined;
  if (shot.scene && !Scene) {
    throw new Error(
      `Unknown scene "${shot.scene}" in shot ${shot.id}. Add it to src/scenes/index.ts.`,
    );
  }
  if (!Scene && !take) throw new Error(`Shot ${shot.id} needs a scene.`);
  const layout = layoutOf(shot, Boolean(take));
  const captions = shot.captions !== false;
  // Cuts between two face shots are jump cuts: no whoosh, or every sentence would swoosh.
  const whoosh =
    previous && (Scene || layoutOf(previous, Boolean(take)) === "graphic");
  const spoken = Math.round(shot.end * fps);

  return (
    <ShotContext.Provider value={shot}>
      {take && layout !== "graphic" && (
        <Take
          src={take}
          trimBefore={Math.round((shot.offset ?? 0) * fps)}
          layout={layout}
          focus={focus}
        />
      )}
      {Scene && layout === "split" && (
        <Stage height={LAYOUT.splitStageHeight}>
          <div
            style={{
              width: 1080 - 2 * LAYOUT.stageSide,
              height: LAYOUT.stageHeight,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${LAYOUT.splitStageHeight / LAYOUT.stageHeight})`,
            }}
          >
            <Scene {...shot.props} />
          </div>
        </Stage>
      )}
      {Scene && take && layout !== "graphic" && layout !== "split" && (
        <Veil />
      )}
      {Scene && layout !== "split" && (
        <Stage height={captions ? LAYOUT.stageHeight : LAYOUT.stageHeightTall}>
          <Scene {...shot.props} />
        </Stage>
      )}
      {captions && (
        <Captions
          top={layout === "split" ? LAYOUT.splitCaptionTop : undefined}
          left={host ? LAYOUT.captionLeftWithHost : undefined}
        />
      )}
      {take ? (
        <Html5Audio
          src={staticFile(shot.audio)}
          trimBefore={Math.round((shot.offset ?? 0) * fps)}
          // Fade in and out over a few frames so the cut doesn't click or spill the next word.
          volume={(f) =>
            interpolate(f, [0, 2, spoken, spoken + 3], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      ) : (
        <Html5Audio src={staticFile(shot.audio)} />
      )}
      {whoosh && <Sfx name="whoosh" volume={0.3} />}
    </ShotContext.Provider>
  );
};

/** Frosted paper over the top of your take, so a scene laid over your face stays readable. */
const Veil: React.FC = () => {
  const theme = useTheme();
  const bottom = LAYOUT.stageTop + LAYOUT.stageHeight + 60;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${theme.paper}f0 0px, ${theme.paper}d9 ${bottom - 220}px, transparent ${bottom}px)`,
      }}
    />
  );
};

const Stage: React.FC<{ height: number; children: React.ReactNode }> = ({
  height,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      top: LAYOUT.stageTop,
      left: LAYOUT.stageSide,
      right: LAYOUT.stageSide,
      height,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {children}
  </div>
);
