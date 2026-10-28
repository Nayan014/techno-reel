import type { CSSProperties } from "react";
import { display, paperDisplay } from "./fonts";
import type { PaletteName, StyleName } from "./types";

export type Palette = {
  /** Page background. */
  paper: string;
  /** Text, borders and hard shadows. */
  ink: string;
  /** One loud colour for highlights and numbers. */
  accent: string;
  /** Card fill. */
  card: string;
};

export const palettes: Record<PaletteName, Palette> = {
  clay: {
    paper: "#F3EEE6",
    ink: "#161412",
    accent: "#C8643B",
    card: "#FFFCF7",
  },
  cobalt: {
    paper: "#ECEFF6",
    ink: "#10131A",
    accent: "#2C4BDB",
    card: "#FBFCFF",
  },
  forest: {
    paper: "#ECF1E8",
    ink: "#121712",
    accent: "#2E6B4A",
    card: "#FBFDF9",
  },
  mono: {
    paper: "#EFEFEC",
    ink: "#111111",
    accent: "#111111",
    card: "#FFFFFF",
  },
};

/** A palette plus how the reel's style draws with it. Scenes read these instead of fixing a look. */
export type Theme = Palette & {
  style: StyleName;
  /** Headline face, and its average caps glyph width in em for fitText(). */
  display: string;
  displayWidth: number;
  /** Outline of cards, chips and buttons that are `width` px thick in the flat style. */
  edge: (width: number) => string;
  /** Lifts a box `depth` px off the page. */
  shadow: (depth: number) => string;
  /** The same lift for text. */
  textShadow: (depth: number) => string;
  /** Background of a card filled with `fill`. */
  surface: (fill: string) => CSSProperties;
};

/** Fine paper fibre, tiled over every print surface. */
export const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'>" +
    "<filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/>" +
    "<feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.22 0 0 0 -0.06'/></filter>" +
    "<rect width='100%' height='100%' filter='url(#g)'/></svg>",
)}")`;

export const makeTheme = (
  palette: PaletteName,
  style: StyleName = "flat",
): Theme => {
  const colors = palettes[palette] ?? palettes.clay;
  const { ink, card } = colors;
  if (style === "print") {
    // Cut card stock under a warm lamp: no outlines, soft contact + ambient shadows.
    return {
      ...colors,
      style,
      display: paperDisplay,
      displayWidth: 0.68,
      edge: () => `1.5px solid ${ink}14`,
      shadow: (d) =>
        `${d * 0.2}px ${d * 0.3}px ${d * 0.45}px ${ink}38, ${d * 0.55}px ${d}px ${d * 2.2}px ${ink}24`,
      textShadow: (d) =>
        `${d * 0.25}px ${d * 0.45}px ${d * 0.9}px ${ink}40`,
      surface: (fill) => ({
        backgroundColor: fill,
        backgroundImage: `linear-gradient(150deg, ${card}66 0%, transparent 42%, ${ink}12 100%), ${GRAIN}`,
      }),
    };
  }
  return {
    ...colors,
    style,
    display,
    displayWidth: 0.47,
    edge: (w) => `${w}px solid ${ink}`,
    shadow: (d) => `${d}px ${d}px 0 ${ink}`,
    textShadow: (d) => `${d}px ${d}px 0 ${ink}`,
    surface: (fill) => ({ background: fill }),
  };
};

/**
 * Instagram draws its own UI over the top ~220px, the bottom ~380px and a ~150px
 * column on the right. Scenes live on the stage, captions in the band below it.
 */
export const LAYOUT = {
  stageTop: 300,
  stageSide: 80,
  stageHeight: 880,
  /** Stage height when a shot has no captions. */
  stageHeightTall: 1160,
  captionTop: 1250,
  captionLeft: 70,
  captionRight: 170,
  /** Print host: stands bottom left, under the stage; captions move right of it. */
  hostLeft: 40,
  hostFloor: 1560,
  hostWidth: 210,
  captionLeftWithHost: 270,
  /** Talking head, split layout: the scene shrunk on top, your take in a window below. */
  splitStageHeight: 660,
  splitWindowTop: 990,
  splitWindowBottom: 1540,
  splitCaptionTop: 1440,
};
