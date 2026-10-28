// Shared by the print host and the Node scripts (Node runs this file directly), so it may only
// `import type` and must not touch Remotion.
import type { ScriptShot } from "./types";

/** Every pose the print host knows. A shot's `pose` names one. */
export const HOST_POSES = [
  "idle",
  "point",
  "present",
  "think",
  "shrug",
  "shock",
  "cheer",
  "wave",
] as const;

export type PoseName = (typeof HOST_POSES)[number];

/** What the host does when a shot doesn't name a `pose`. */
const SCENE_POSE: Record<string, PoseName> = {
  Hook: "point",
  ChatPrompt: "think",
  Statement: "think",
  BigNumber: "shock",
  List: "present",
  Compare: "shrug",
  Meter: "shock",
  Screenshot: "present",
  CTA: "wave",
};

/** The host's pose on a shot: its own `pose` when that's a known one, else its scene's. */
export const poseName = (shot: Pick<ScriptShot, "pose" | "scene">): PoseName =>
  HOST_POSES.includes(shot.pose as PoseName)
    ? (shot.pose as PoseName)
    : (SCENE_POSE[shot.scene ?? ""] ?? "present");
