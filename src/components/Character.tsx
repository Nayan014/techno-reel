import React from "react";
import { Img, staticFile } from "remotion";
import { useTheme } from "../context";
import { poseName } from "../poses";
import { LAYOUT } from "../theme";
import { HEIGHT } from "../timeline";
import type { CharacterConfig, Shot } from "../types";
import { useHostMotion } from "./Host";

/**
 * Your own cartoon (cut out once with `npm run host`) standing bottom left: it pops into a new
 * pose on every shot, bobs while it talks and opens its mouth as wide as the voice is loud.
 */
export const Character: React.FC<{ shots: Shot[]; config: CharacterConfig }> = ({
  shots,
  config,
}) => {
  const theme = useTheme();
  const { frame, shot, k, mouth, enter, bob } = useHostMotion(shots);
  const pose = poseName(shot);
  const [x, y] = config.mouth[pose] ?? [0.5, 0.3];
  const width = LAYOUT.characterWidth;
  // Squashes into each new pose and springs back, so the swap reads as a move, not a cut.
  const squash = 1 - k;
  const sway = pose === "wave" ? Math.sin(frame / 5) * 2.5 : 0;
  const lips = config.mouthWidth * width * (0.8 + 0.2 * mouth);
  const open = config.mouthWidth * width * (0.15 + 0.55 * mouth);

  return (
    <div
      style={{
        position: "absolute",
        left: LAYOUT.hostLeft,
        bottom: HEIGHT - LAYOUT.hostFloor,
        width,
        transformOrigin: "50% 100%",
        transform: `translateY(calc(${(1 - enter) * 110}% + ${bob}px)) scale(${1 + squash * 0.06}, ${1 - squash * 0.08}) rotate(${sway}deg)`,
        filter: `drop-shadow(${theme.textShadow(6)})`,
      }}
    >
      <Img
        src={staticFile(`host/${pose}.png`)}
        style={{ display: "block", width: "100%" }}
      />
      {/* The drawn mouth is closed; an open one covers it while a word is loud enough. */}
      {mouth > 0 && (
        <div
          style={{
            position: "absolute",
            left: x * width - lips / 2,
            top: `calc(${y * 100}% - ${open / 2}px)`,
            width: lips,
            height: open,
            borderRadius: "50%",
            background: theme.ink,
          }}
        />
      )}
    </div>
  );
};
