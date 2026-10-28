// Shared by the video and the Node scripts (Node runs this file directly), so it may only
// `import type` and must not touch Remotion.

/** Every sound effect in public/sfx, with how many takes of it there are. */
export const SFX = {
  whoosh: 3,
  whip: 1,
  swipe: 2,
  pop: 3,
  click: 2,
  key: 4,
  blip: 1,
  ding: 1,
  impact: 2,
  riser: 1,
  shutter: 1,
  coin: 1,
  success: 1,
} as const;

export type SfxName = keyof typeof SFX;

/** Path under public/ of take `variant` (any integer, wraps around) of a sound. */
export const sfxFile = (name: SfxName, variant = 0) =>
  SFX[name] === 1
    ? `sfx/${name}.wav`
    : `sfx/${name}-${(((variant % SFX[name]) + SFX[name]) % SFX[name]) + 1}.wav`;

/** Every music bed in public/music, picked with `"music"` in script.json. */
export const MUSIC = ["lofi", "upbeat", "chill", "funk"] as const;

export type MusicName = (typeof MUSIC)[number];

export const musicFile = (name: MusicName) => `music/${name}.mp3`;

/** Seconds of public/sfx/riser.wav, so a scene can start it to peak on a beat. */
export const RISER_SECONDS = 2;
