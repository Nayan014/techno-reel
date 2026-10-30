// Pace and structure gate. Fast: reads the JSON, renders nothing. Exits 1 on any FAIL.
// Usage: npm run check -- <slug>
import { existsSync } from "node:fs";
import { join } from "node:path";
import { HOST_POSES } from "../src/poses.ts";
import { FPS, buildReel } from "../src/timeline.ts";
import { readJson, reelArgs } from "./lib.mjs";

const { slug, dir } = reelArgs("npm run check -- <slug>");
const script = readJson(join(dir, "script.json"));
const voice = readJson(join(dir, "voice.json"));

const normalize = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

const results = [];
const failure = (message) => results.push(["FAIL", message]);
const warning = (message) => results.push(["warn", message]);

let reel;
try {
  reel = buildReel(slug, script, voice);
} catch (error) {
  failure(error.message);
}

if (reel) {
  const { shots } = reel;
  const hook = shots[0].end;
  if (hook > 2.2)
    failure(
      `Hook takes ${hook.toFixed(1)}s to say. Cut it to ≤ 1.5s (about 5 words).`,
    );
  else if (hook > 1.6)
    warning(`Hook takes ${hook.toFixed(1)}s to say; ≤ 1.5s lands harder.`);

  const total = reel.durationInFrames / FPS;
  if (total > 60) failure(`Reel runs ${total.toFixed(1)}s. Cut to ≤ 45s.`);
  else if (total > 45)
    warning(`Reel runs ${total.toFixed(1)}s; 20–45s performs best.`);
  else if (total < 12) warning(`Reel runs only ${total.toFixed(1)}s.`);

  const beats = new Set(["List", "Compare"]);
  const take = Boolean(reel.take);
  // What a viewer sees change at a cut: the scene, or on a take how your face is framed.
  const look = (shot) =>
    take
      ? `${shot.layout ?? (shot.scene ? "graphic" : "full")} ${shot.scene ?? ""}`.trim()
      : shot.scene;
  for (const [i, shot] of shots.entries()) {
    const seconds = shot.frames / FPS;
    if (seconds > 5)
      failure(
        `${shot.id} runs ${seconds.toFixed(1)}s. Split it into two shots.`,
      );
    else if (seconds > 3.8 && !beats.has(shot.scene))
      warning(
        `${shot.id} runs ${seconds.toFixed(1)}s on one ${look(shot)}. Split it or give it a second beat.`,
      );
    // On a take the pace is how you spoke; only the cuts can change it.
    const rate = shot.words.length / Math.max(shot.end, 0.1);
    if (rate > 4.2 && !take)
      warning(`${shot.id} packs ${rate.toFixed(1)} words/s. Say less.`);
    const said = (word) =>
      shot.words.some((w) => normalize(w.text) === normalize(word.split(/\s+/)[0]));
    if (shot.zoom && !said(shot.zoom))
      warning(`${shot.id} zooms on "${shot.zoom}", which it never says. Pick a spoken word.`);
    const before = shots[i - 1];
    if (before && look(before) === look(shot) && shot.scene !== "Statement")
      warning(
        take && !shot.scene
          ? `${before.id} and ${shot.id} are both ${look(shot)}: a visible jump cut. Make one a punch, split or graphic.`
          : `${before.id} and ${shot.id} are both ${look(shot)}. Vary the visuals.`,
      );
  }
  if (shots.at(-1).scene !== "CTA") warning("Last shot isn't a CTA.");
  const cartoon = ["host.json", ...HOST_POSES.map((pose) => `${pose}.png`)];
  const lost = cartoon.filter((file) => !existsSync(join("public", "host", file)));
  if (script.host === "character" && lost.length)
    failure(
      `"host": "character" but public/host/ has no ${lost.join(", ")}. Run: npm run host -- <sheet.png>`,
    );
  if (/yourhandle/i.test(reel.handle))
    warning(`Handle is still "${reel.handle}".`);
  if (shots.some((shot) => shot.estimated))
    warning(
      "Some word timings are estimated, so captions may drift slightly.",
    );
}

for (const [level, message] of results)
  console.log(`${level === "FAIL" ? "✗ FAIL" : "! warn"}  ${message}`);
const failed = results.some(([level]) => level === "FAIL");
if (reel) {
  const seconds = (reel.durationInFrames / FPS).toFixed(1);
  console.log(
    `${failed ? "✗" : "✓"} ${slug}: ${reel.shots.length} shots, ${seconds}s`,
  );
}
process.exit(failed ? 1 : 0);
