import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

/** Condensed poster face for headlines and numbers (flat style). */
export const display = loadAnton("normal", {
  weights: ["400"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;

/** Chunky, slightly crafty grotesque for headlines in the print style. */
export const paperDisplay = loadBricolage("normal", {
  weights: ["800"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;

/** Body and captions. */
export const body = loadInter("normal", {
  weights: ["600", "800"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;
