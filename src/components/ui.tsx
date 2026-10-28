import React from "react";
import {
  Html5Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  type SpringConfig,
} from "remotion";
import { useTheme } from "../context";
import type { Word } from "../types";

/** 0 → 1 spring that starts at `delay` frames into the shot. */
export const usePop = (delay = 0, config: Partial<SpringConfig> = {}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - delay,
    fps,
    config: { damping: 13, stiffness: 190, mass: 0.6, ...config },
  });
};

/** Gentle sine drift in px so nothing on screen is ever fully still. */
export const useFloat = (amplitude = 8, period = 80) =>
  Math.sin((useCurrentFrame() / period) * Math.PI * 2) * amplitude;

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  fill?: string;
}> = ({ children, style, fill }) => {
  const theme = useTheme();
  return (
    <div
      style={{
        ...theme.surface(fill ?? theme.card),
        border: theme.edge(6),
        borderRadius: 28,
        boxShadow: theme.shadow(14),
        padding: "36px 44px",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export type SfxName =
  | "pop"
  | "whoosh"
  | "tick"
  | "ding"
  | "blip"
  | "snap"
  | "swipe";

/** Plays a synthesized sound effect from public/sfx at `at` frames into the shot. */
export const Sfx: React.FC<{ name: SfxName; at?: number; volume?: number }> = ({
  name,
  at = 0,
  volume = 0.2,
}) => (
  <Sequence
    from={Math.max(0, Math.round(at))}
    durationInFrames={24}
    layout="none"
  >
    <Html5Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

const normalize = (text: string) =>
  text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

/**
 * Frame (relative to the shot) at which each phrase starts being spoken, matched by its
 * first word. Phrases that aren't spoken are spread evenly. Always increasing.
 */
export const cueFrames = (
  words: Word[],
  phrases: string[],
  fps: number,
  frames: number,
): number[] => {
  let cursor = 0;
  let previous = -Infinity;
  return phrases.map((phrase, i) => {
    const first = normalize(phrase.split(/\s+/)[0] ?? "");
    const hit = words.findIndex(
      (word, k) => k >= cursor && normalize(word.text) === first,
    );
    let cue: number;
    if (hit >= 0) {
      cursor = hit + 1;
      cue = Math.round(words[hit].start * fps) - 2;
    } else {
      cue = Math.round(
        interpolate(i, [0, Math.max(1, phrases.length - 1)], [4, frames * 0.7]),
      );
    }
    previous = Math.max(0, cue, previous + 6);
    return previous;
  });
};

const countLines = (text: string, charsPerLine: number) => {
  let lines = 1;
  let used = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    // A word wider than the line never wraps; it overflows.
    if (word.length > charsPerLine) return Infinity;
    const needed = used === 0 ? word.length : used + 1 + word.length;
    if (needed <= charsPerLine) used = needed;
    else {
      lines += 1;
      used = word.length;
    }
  }
  return lines;
};

/**
 * Largest size from `sizes` at which `text` wraps into at most `maxLines` lines of `width` px.
 * `charWidth` is the font's average glyph width in em (Anton caps ≈ 0.47, Inter 800 ≈ 0.62).
 */
export const fitText = (
  text: string,
  width: number,
  maxLines: number,
  sizes: number[],
  charWidth = 0.47,
) =>
  sizes.find(
    (size) =>
      countLines(text, Math.floor(width / (size * charWidth))) <= maxLines,
  ) ?? sizes[sizes.length - 1];
