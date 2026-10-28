import React from "react";
import { Composition, staticFile } from "remotion";
import { Reel } from "./Reel";
import { FPS, HEIGHT, WIDTH, buildReel } from "./timeline";
import type { Script, Voice } from "./types";

const loadJson = async <T,>(path: string): Promise<T | null> => {
  const res = await fetch(staticFile(path), { cache: "no-store" });
  return res.ok ? ((await res.json()) as T) : null;
};

export const Root: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    width={WIDTH}
    height={HEIGHT}
    fps={FPS}
    durationInFrames={FPS * 10}
    defaultProps={{ slug: "example", reel: null }}
    calculateMetadata={async ({ props }) => {
      const dir = `reels/${props.slug}`;
      const script = await loadJson<Script>(`${dir}/script.json`);
      if (!script) throw new Error(`public/${dir}/script.json not found`);
      const voice = await loadJson<Voice>(`${dir}/voice.json`);
      const reel = buildReel(props.slug, script, voice);
      return {
        durationInFrames: reel.durationInFrames,
        props: { ...props, reel },
      };
    }}
  />
);
