import type React from "react";
import { BigNumber } from "./BigNumber";
import { CTA } from "./CTA";
import { Compare } from "./Compare";
import { Hook } from "./Hook";
import { List } from "./List";
import { Meter } from "./Meter";
import { Screenshot } from "./Screenshot";
import { Statement } from "./Statement";
import { Swarm } from "./Swarm";

/** Every scene a shot can name in script.json. Register new scenes here. */
export const scenes: Record<string, React.ComponentType<any>> = {
  Hook,
  Statement,
  BigNumber,
  List,
  Compare,
  Meter,
  Screenshot,
  Swarm,
  CTA,
};
