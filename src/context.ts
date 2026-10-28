import { createContext, useContext } from "react";
import { makeTheme, type Theme } from "./theme";
import type { Shot } from "./types";

export const ThemeContext = createContext<Theme>(makeTheme("clay"));
export const ShotContext = createContext<Shot | null>(null);

export const useTheme = () => useContext(ThemeContext);

/** The shot being rendered: its words (for syncing to speech), frames and props. */
export const useShot = (): Shot => {
  const shot = useContext(ShotContext);
  if (!shot) throw new Error("useShot() must be used inside a shot");
  return shot;
};
