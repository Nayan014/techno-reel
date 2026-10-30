import React from "react";
import { Img, staticFile } from "remotion";
import { useTheme } from "../context";
import { poseName } from "../poses";
import { LAYOUT } from "../theme";
import { HEIGHT } from "../timeline";
import type { CharacterConfig, Shot } from "../types";
import { useHostMotion } from "./Host";

/** The open mouth is part of the drawing, not the palette: a mouth's dark red, its tongue and lip line. */
const MOUTH = "#4A1712";
const TONGUE = "#C65A55";
const LIP = "#2A0D0A";

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
  const lips = config.mouthWidth * width * (0.85 + 0.15 * mouth);
  const open = config.mouthWidth * width * (0.1 + 0.38 * mouth);

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
      {/* The drawn mouth is closed; an open one covers it while a word is loud enough. It hangs
          from the lip line like a jaw dropping, flat on top and round below. */}
      {mouth > 0 && (
        <div
          style={{
            position: "absolute",
            left: x * width - lips / 2,
            top: `calc(${y * 100}% - ${open * 0.3}px)`,
            width: lips,
            height: open,
            borderRadius: "45% 45% 50% 50% / 25% 25% 75% 75%",
            border: `1.5px solid ${LIP}`,
            background: MOUTH,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "20%",
              right: "20%",
              bottom: 0,
              height: "45%",
              borderRadius: "50% 50% 0 0",
              background: TONGUE,
            }}
          />
        </div>
      )}
    </div>
  );
};
