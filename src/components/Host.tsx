import { type MediaUtilsAudioData, useAudioData } from "@remotion/media-utils";
import React, { useMemo } from "react";
import { spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme } from "../context";
import { type PoseName, poseName } from "../poses";
import { LAYOUT } from "../theme";
import type { Shot } from "../types";

/** Arm angles in degrees away from the body: [shoulder, elbow]. 0 hangs straight down. */
type Pose = {
  left: [number, number];
  right: [number, number];
  /** Eyebrow lift in px. */
  brow: number;
  /** Head tilt in degrees, positive leans toward the stage. */
  tilt: number;
  wave?: boolean;
};

const POSES: Record<PoseName, Pose> = {
  idle: { left: [12, 8], right: [12, 8], brow: 0, tilt: 0 },
  point: { left: [12, 8], right: [135, 15], brow: 4, tilt: 6 },
  present: { left: [12, 8], right: [80, 25], brow: 2, tilt: 4 },
  think: { left: [12, 8], right: [8, -165], brow: 6, tilt: -8 },
  shrug: { left: [55, 95], right: [55, 95], brow: 8, tilt: -4 },
  shock: { left: [110, 40], right: [110, 40], brow: 12, tilt: 0 },
  cheer: { left: [165, 10], right: [165, 10], brow: 6, tilt: 3 },
  wave: { left: [12, 8], right: [150, 25], brow: 4, tilt: 5, wave: true },
};

const poseOf = (shot: Shot) => POSES[poseName(shot)];

/** How loud a voice line is on each of its frames: 0 silent, 1 its loudest moment. */
const loudness = (audio: MediaUtilsAudioData, fps: number) => {
  const samples = audio.channelWaveforms[0];
  const step = audio.sampleRate / fps;
  const levels = Array.from({ length: Math.ceil(samples.length / step) }, (_, f) => {
    const from = Math.floor(f * step);
    const to = Math.min(samples.length, Math.floor((f + 1) * step));
    let sum = 0;
    for (let i = from; i < to; i++) sum += samples[i] * samples[i];
    return Math.sqrt(sum / Math.max(1, to - from));
  });
  const peak = Math.max(1e-6, ...levels);
  return levels.map((level) => level / peak);
};

/** Below this the mouth stays shut, so breaths and room tone don't move it. */
const QUIET = 0.12;

/**
 * What every host does the same way: the shot on screen, how far it has moved into that shot's
 * pose (`k`, 0 → 1), how wide its mouth is open (0–1, as loud as the voice is), its slide in
 * at the start and its bob.
 */
export const useHostMotion = (shots: Shot[]) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const index = Math.max(
    0,
    shots.findLastIndex((shot) => shot.from <= frame),
  );
  const shot = shots[index];
  const audio = useAudioData(staticFile(shot.audio));
  const levels = useMemo(() => (audio ? loudness(audio, fps) : []), [audio, fps]);
  const k = spring({
    frame: frame - shot.from,
    fps,
    config: { damping: 12, stiffness: 150, mass: 0.7 },
  });
  const t = (frame - shot.from) / fps;
  const speaking = shot.words.some((w) => t >= w.start && t <= w.end);
  // Opens fast and closes a little slower, like a real jaw, instead of flickering per frame.
  const at = frame - shot.from + Math.round((shot.offset ?? 0) * fps);
  const level = Math.max(levels[at] ?? 0, 0.6 * (levels[at - 1] ?? 0));
  return {
    frame,
    shot,
    previous: shots[index - 1] as Shot | undefined,
    k,
    mouth: Math.min(1, Math.max(0, (level - QUIET) / 0.6)),
    enter: spring({ frame: frame - 4, fps, config: { damping: 14 } }),
    bob: Math.sin(frame / 9) * (speaking ? 5 : 2.5),
  };
};

const W = 300;
const H = 440;
const UPPER = 62;
const LOWER = 58;

/**
 * A cut-paper presenter standing bottom left, under the stage and left of the captions.
 * It changes pose on every shot, opens its mouth as wide as the voice is loud and blinks now
 * and then.
 */
export const Host: React.FC<{ shots: Shot[] }> = ({ shots }) => {
  const theme = useTheme();
  const { frame, shot, previous, k, mouth, enter, bob } = useHostMotion(shots);
  const from = previous ? poseOf(previous) : POSES.idle;
  const to = poseOf(shot);
  const mix = (a: number, b: number) => a + (b - a) * k;
  const wave = to.wave ? Math.sin(frame / 3.5) * 22 : 0;
  const left: [number, number] = [mix(from.left[0], to.left[0]), mix(from.left[1], to.left[1])];
  const right: [number, number] = [
    mix(from.right[0], to.right[0]),
    mix(from.right[1], to.right[1]) + wave,
  ];
  const blink = frame % 97 < 4 ? 0.12 : 1;
  const brow = mix(from.brow, to.brow);
  const height = (LAYOUT.hostWidth / W) * H;

  const arm = (side: "left" | "right", [shoulder, elbow]: [number, number]) => {
    const sx = side === "left" ? 98 : 202;
    const sy = 222;
    const sign = side === "left" ? 1 : -1;
    return (
      <g transform={`rotate(${shoulder * sign} ${sx} ${sy})`} filter="url(#paper)">
        <rect x={sx - 14} y={sy - 8} width={28} height={UPPER + 16} rx={14} fill={theme.accent} />
        <g transform={`rotate(${elbow * sign} ${sx} ${sy + UPPER})`}>
          <rect x={sx - 12} y={sy + UPPER - 10} width={24} height={LOWER + 10} rx={12} fill={theme.accent} />
          <circle cx={sx} cy={sy + UPPER + LOWER} r={16} fill={theme.card} />
        </g>
      </g>
    );
  };

  return (
    <svg
      width={LAYOUT.hostWidth}
      height={height}
      viewBox={`0 0 ${W} ${H}`}
      style={{
        position: "absolute",
        left: LAYOUT.hostLeft,
        top: LAYOUT.hostFloor - height,
        overflow: "visible",
        transform: `translateY(${(1 - enter) * height}px)`,
      }}
    >
      <defs>
        <filter id="paper" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="3" dy="6" stdDeviation="5" floodColor={theme.ink} floodOpacity="0.28" />
        </filter>
      </defs>
      <g transform={`translate(0 ${bob})`}>
        {arm("left", left)}
        <g filter="url(#paper)">
          <rect x={112} y={322} width={34} height={118 - bob} rx={14} fill={theme.ink} />
          <rect x={154} y={322} width={34} height={118 - bob} rx={14} fill={theme.ink} />
        </g>
        <path
          d="M95,212 Q150,192 205,212 L224,336 Q150,352 76,336 Z"
          fill={theme.accent}
          filter="url(#paper)"
        />
        <path d="M130,204 L150,236 L170,204 Z" fill={theme.card} />
        <g transform={`rotate(${mix(from.tilt, to.tilt)} 150 205)`} filter="url(#paper)">
          <circle cx={150} cy={135} r={68} fill={theme.card} />
          <path
            d="M82,132 Q84,56 150,58 Q216,56 218,132 Q204,94 150,94 Q96,94 82,132 Z"
            fill={theme.ink}
          />
          <circle cx={110} cy={160} r={10} fill={theme.accent} opacity={0.3} />
          <circle cx={190} cy={160} r={10} fill={theme.accent} opacity={0.3} />
          <ellipse cx={126} cy={140} rx={7} ry={9 * blink} fill={theme.ink} />
          <ellipse cx={174} cy={140} rx={7} ry={9 * blink} fill={theme.ink} />
          <path
            d={`M114,${120 - brow} L136,${117 - brow} M164,${117 - brow} L186,${120 - brow}`}
            stroke={theme.ink}
            strokeWidth={6}
            strokeLinecap="round"
          />
          {mouth > 0.1 ? (
            <ellipse cx={150} cy={170} rx={11 + mouth * 3} ry={3 + mouth * 10} fill={theme.ink} />
          ) : (
            <path
              d="M136,166 Q150,178 164,166"
              fill="none"
              stroke={theme.ink}
              strokeWidth={5}
              strokeLinecap="round"
            />
          )}
        </g>
        {arm("right", right)}
      </g>
    </svg>
  );
};
