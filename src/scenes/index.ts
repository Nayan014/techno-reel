import type React from "react";
import { BigNumber } from "./BigNumber";
import { CTA } from "./CTA";
import { ChatPrompt } from "./ChatPrompt";
import { Compare } from "./Compare";
import { Hook } from "./Hook";
import { List } from "./List";
import { Meter } from "./Meter";
import { Screenshot } from "./Screenshot";
import { Stamp } from "./Stamp";
import { Statement } from "./Statement";
import { Swarm } from "./Swarm";

/** Every scene a shot can name in script.json: the kit's, registered here, then ./local's. */
export const scenes: Record<string, React.ComponentType<any>> = {
  Hook,
  ChatPrompt,
  Statement,
  Stamp,
  BigNumber,
  List,
  Compare,
  Meter,
  Screenshot,
  Swarm,
  CTA,
};

/** Filled in by webpack, Remotion's bundler. */
declare const require: {
  context(
    directory: string,
    subdirectories: boolean,
    filter: RegExp,
  ): {
    keys(): string[];
    (key: string): Record<string, React.ComponentType<any> | undefined>;
  };
};

// Scenes written for a single reel live in ./local, which git ignores. Each file
// `<Name>.tsx` exports `<Name>` and is picked up here without being registered.
const local = require.context("./local", false, /\.tsx$/);
for (const key of local.keys().filter((key) => key.startsWith("./"))) {
  const name = key.slice(2, -4);
  const scene = local(key)[name];
  if (!scene)
    throw new Error(`src/scenes/local/${name}.tsx must export const ${name}.`);
  if (scenes[name])
    throw new Error(
      `src/scenes/local/${name}.tsx: "${name}" is already a kit scene. Rename it.`,
    );
  scenes[name] = scene;
}
