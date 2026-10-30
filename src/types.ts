import type { MusicName } from "./sound";

export type PaletteName = "clay" | "cobalt" | "forest" | "mono";

/** flat: bold outlines and hard shadows. print: lit card stock, soft depth, a paper host. */
export type StyleName = "flat" | "print";

/** How a talking-head shot frames your take. */
export type Layout = "full" | "punch" | "split" | "graphic";

/** One spoken line is one shot. Claude writes these into script.json. */
export type ScriptShot = {
  id: string;
  /**
   * The line, with optional delivery marks: `|` a beat, `||` a long pause, `*words*` said heavy.
   * With a take: what you say in `clip`, used for caption spelling.
   */
  say: string;
  /** Optional on a take's face shots (`full`, `punch`). */
  scene?: string;
  props?: Record<string, unknown>;
  /** Set false when the scene already shows the spoken words (e.g. a Hook). */
  captions?: boolean;
  /** Talking head: seconds of the take this shot plays, [in, out]. */
  clip?: [number, number];
  /** Talking head: how the take is framed. Default `full`, or `graphic` when there's a scene. */
  layout?: Layout;
  /** Print host: what it does on this line. Default depends on the scene. */
  pose?: string;
  /** A word of the line: the stage snaps in a little when it's said. */
  zoom?: string;
};

export type Script = {
  title: string;
  palette: PaletteName;
  /** Default "flat". */
  style?: StyleName;
  handle: string;
  /** Print style: false hides the paper host. "character": your own cartoon (`npm run host`)
   * hosts instead, in either style. */
  host?: boolean | "character";
  /** Music bed under the reel, dipped while a line is spoken. None when left out. */
  music?: MusicName | false;
  /** Talking head: your recording, made by `npm run transcribe` (always "take.mp4"). */
  take?: string;
  /** Talking head: where your face is in the take, 0–1 from the left and top. */
  focus?: [number, number];
  shots: ScriptShot[];
};

/** Seconds, relative to the start of the word's shot. */
export type Word = { text: string; start: number; end: number };

/** Written by `npm run voice`, one per shot id. */
export type VoiceLine = {
  say: string;
  /** Path under public/. None on a line timed by estimate, before it's recorded. */
  audio?: string;
  /** Seconds into `audio` where this line starts (a take); 0 for a recorded line. */
  offset?: number;
  /** Talking head: the clip this line was cut from, as written in script.json. */
  clip?: [number, number];
  /** Seconds until the last spoken sound. */
  end: number;
  words: Word[];
  /** True when word timings are guessed rather than measured. */
  estimated?: boolean;
};

export type Voice = {
  provider: "voicestudio" | "elevenlabs" | "say" | "take";
  voice: string;
  lines: Record<string, VoiceLine>;
};

export type Shot = ScriptShot & VoiceLine & { from: number; frames: number };

/** public/host/host.json, written by `npm run host`: where each pose of your cartoon has its mouth. */
export type CharacterConfig = {
  /** Width of the mouth, as a share of the pose image's width. */
  mouthWidth: number;
  /** Centre of each pose's closed mouth, [x, y] as 0–1 of the image. */
  mouth: Record<string, [number, number]>;
};

export type ReelData = Omit<Script, "shots"> & {
  shots: Shot[];
  durationInFrames: number;
  /** Set when the reel is hosted by your own cartoon. */
  character?: CharacterConfig;
};
