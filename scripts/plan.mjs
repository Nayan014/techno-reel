// Storyboard for plan mode: one card per shot with its frame, line, on-screen text and the tools
// that make it, written to out/<slug>/plan.html for the user to review before the render.
// Without voice yet, durations are estimated. --frames puts each shot's still on its card
// (run `npm run stills` first).
// Usage: npm run plan -- <slug> [--frames]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { poseName } from "../src/poses.ts";
import { FPS, buildReel } from "../src/timeline.ts";
import {
  delivery,
  loadEnv,
  pickVoiceProvider,
  readJson,
  reelArgs,
  spokenText,
  voiceStudio,
} from "./lib.mjs";

loadEnv();
const { slug, dir } = reelArgs("npm run plan -- <slug> [--frames]");
const frames = process.argv.includes("--frames");
const script = readJson(join(dir, "script.json"));
const voice = readJson(join(dir, "voice.json"));
const outDir = join("out", slug);
const output = join(outDir, "plan.html");

/** Kokoro's pace with the breath between lines, to guess a shot's length before it's recorded. */
const WORDS_PER_SECOND = 3;

let reel = null;
try {
  reel = buildReel(slug, script, voice);
} catch {}
const take = Boolean(script.take);
const print = script.style === "print";
const host = print && !take && script.host !== false;

const seconds = (shot, i) => {
  if (reel) return reel.shots[i].frames / FPS;
  if (shot.clip) return shot.clip[1] - shot.clip[0];
  const { phrases, hold } = delivery(shot.say);
  const pauses = phrases.reduce((sum, phrase) => sum + phrase.pause, hold);
  return spokenText(shot.say).split(" ").length / WORDS_PER_SECOND + pauses;
};
const approx = reel ? "" : "≈";
const total = script.shots.reduce((sum, shot, i) => sum + seconds(shot, i), 0);

const voiceLabel = () => {
  if (take) return "your take";
  if (reel) return `${voice.provider} · ${voice.voice}`;
  return {
    voicestudio: `voicestudio · ${voiceStudio.model()}/${voiceStudio.voice()}`,
    elevenlabs: "elevenlabs",
    say: "macOS say",
  }[pickVoiceProvider()];
};

const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};
/** An image file as a data URI, so the page works on its own; null when it's missing. */
const dataUri = (path) =>
  existsSync(path) && MIME[extname(path).toLowerCase()]
    ? `data:${MIME[extname(path).toLowerCase()]};base64,${readFileSync(path).toString("base64")}`
    : null;

/** Any prop value as readable HTML: lists as bullets, {label, value} as "label: value". */
const show = (value) => {
  if (Array.isArray(value))
    return `<ul>${value.map((item) => `<li>${show(item)}</li>`).join("")}</ul>`;
  if (value && typeof value === "object")
    return "label" in value
      ? `${esc(value.label)}: <b>${esc(value.value ?? "")}</b>`
      : Object.entries(value)
          .map(([key, item]) => `${esc(key)}: ${show(item)}`)
          .join(" · ");
  return esc(value);
};

/** The biggest text a scene shows, for the placeholder frame. */
const headline = ({ text, lines, value, prefix = "", suffix = "", title, left, right, label } = {}) =>
  text ??
  lines?.join("\n") ??
  (value !== undefined ? `${prefix}${value}${suffix}` : undefined) ??
  title ??
  (left && right ? `${left.label} vs ${right.label}` : undefined) ??
  label ??
  "";

const layoutOf = (shot) => shot.layout ?? (shot.scene ? "graphic" : "full");
const TAKE_FRAMES = {
  full: "your face, full frame",
  punch: "your face, zoomed in",
  split: "scene on top, your face in a window below",
  graphic: "scene fills the frame, your voice goes on",
};

const framing = (shot) => {
  if (take) {
    const layout = layoutOf(shot);
    const over =
      shot.scene && (layout === "full" || layout === "punch")
        ? ", scene over it on a paper veil"
        : "";
    const clip = shot.clip ? ` · clip ${shot.clip[0]}–${shot.clip[1]} s` : "";
    return `${TAKE_FRAMES[layout] ?? layout}${over}${clip}`;
  }
  if (!print) return "flat stage";
  return host ? `cut-paper stage, host ${poseName(shot)}` : "cut-paper stage";
};

const missing = [];
const frameHtml = (shot) => {
  const still = frames && dataUri(join(outDir, "stills", `${shot.id}.png`));
  if (frames && !still) missing.push(shot.id);
  if (still) return `<img class="still" src="${still}" alt="Shot ${esc(shot.id)}">`;
  const image = shot.scene === "Screenshot" && shot.props?.src && dataUri(join("public", shot.props.src));
  const text = shot.scene ? headline(shot.props) : `your face · ${layoutOf(shot)}`;
  return `<div class="sketch">
      <span class="tag">${esc(shot.scene ?? "Take")}</span>
      ${image ? `<img src="${image}" alt="">` : ""}
      <strong>${esc(text)}</strong>
    </div>`;
};

const chip = (tool, detail, warn = false) =>
  `<span class="chip${warn ? " warn" : ""}"><b>${esc(tool)}</b> ${esc(detail)}</span>`;

const card = (shot, i) => {
  const tools = [];
  if (shot.scene) {
    const local = existsSync(join("src", "scenes", "local", `${shot.scene}.tsx`));
    const kit = existsSync(join("src", "scenes", `${shot.scene}.tsx`));
    tools.push(
      chip(
        "Remotion",
        kit ? shot.scene : local ? `${shot.scene} · this reel only` : `${shot.scene} · new scene, to write`,
        !kit && !local,
      ),
    );
  }
  if (take && layoutOf(shot) !== "graphic") tools.push(chip("Remotion", `Take · ${layoutOf(shot)}`));
  if (shot.zoom) tools.push(chip("Remotion", `snap zoom on "${shot.zoom}"`));
  tools.push(chip("Voice", voiceLabel()));
  const props = Object.entries(shot.props ?? {});
  return `<article class="card">
    <div class="frame">${frameHtml(shot)}</div>
    <div class="body">
      <header><span class="id">${esc(shot.id)}</span><span class="scene">${esc(shot.scene ?? "Take")}</span><span class="time">${approx}${seconds(shot, i).toFixed(1)} s</span></header>
      <section><h3>Says</h3><p class="say">“${esc(shot.say)}”</p>
        <p class="cc">CC · ${shot.captions === false ? "off, the scene shows the words" : "word by word"}</p></section>
      ${props.length ? `<section><h3>On screen</h3><dl>${props.map(([key, value]) => `<dt>${esc(key)}</dt><dd>${show(value)}</dd>`).join("")}</dl></section>` : ""}
      <section><h3>Frame</h3><p>${esc(framing(shot))}</p></section>
      <section><h3>Made with</h3><div class="chips">${tools.join("")}</div></section>
    </div>
  </article>`;
};

const stage = frames ? "Plan · frames" : "Plan · text";
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(script.title)} · plan</title>
<style>
  :root {
    --bg: #f4f2ee; --card: #fffdf9; --ink: #1b1a18; --muted: #6d6a64; --line: #e2ded6;
    --accent: #c8643b; --chip: #f0ece4; --warn: #fbe3d6;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #161514; --card: #201f1d; --ink: #f1eee8; --muted: #a29e96; --line: #34322e;
      --accent: #e98457; --chip: #2b2926; --warn: #4a2c1f;
    }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink);
    font: 15px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }
  main { max-width: 1500px; margin: 0 auto; padding: 28px 16px 48px; }
  .top { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 20px; margin-bottom: 6px; }
  h1 { margin: 0; font-size: 28px; line-height: 1.15; }
  .stage { padding: 3px 10px; border-radius: 99px; background: var(--accent); color: var(--card);
    font-size: 13px; font-weight: 600; }
  .meta, .hint { margin: 0; color: var(--muted); }
  .hint { margin: 4px 0 24px; }
  .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(min(460px, 100%), 1fr)); }
  .card { display: flex; gap: 16px; padding: 14px; background: var(--card); border: 1px solid var(--line);
    border-radius: 14px; }
  .frame { flex: 0 0 150px; }
  .still, .sketch { width: 150px; aspect-ratio: 9 / 16; border-radius: 8px; }
  .still { display: block; object-fit: cover; border: 1px solid var(--line); }
  .sketch { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
    padding: 10px; border: 1.5px dashed var(--line); background: var(--bg); text-align: center; overflow: hidden; }
  .sketch .tag { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  .sketch strong { font-size: 17px; line-height: 1.15; white-space: pre-line; overflow-wrap: anywhere; }
  .sketch img { max-width: 100%; max-height: 45%; border-radius: 4px; }
  .body { flex: 1; min-width: 0; }
  .body header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; }
  .id { font-size: 26px; font-weight: 800; color: var(--accent); }
  .scene { font-weight: 600; }
  .time { margin-left: auto; color: var(--muted); font-variant-numeric: tabular-nums; }
  section { margin-top: 8px; }
  h3 { margin: 0 0 2px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  p { margin: 0; }
  .say { font-size: 16px; font-weight: 500; }
  .cc { margin-top: 2px; font-size: 13px; color: var(--muted); }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; margin: 0; }
  dt { color: var(--muted); }
  dd { margin: 0; overflow-wrap: anywhere; }
  ul { margin: 0; padding-left: 18px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { padding: 2px 9px; border-radius: 99px; background: var(--chip); font-size: 13px; }
  .chip.warn { background: var(--warn); }
  @media (max-width: 520px) {
    .card { flex-direction: column; }
    .frame { flex: none; align-self: center; }
  }
</style>
</head>
<body>
<main>
  <div class="top"><h1>${esc(script.title)}</h1><span class="stage">${stage}</span></div>
  <p class="meta">${esc(slug)} · ${esc(script.style ?? "flat")} · ${esc(script.palette)} · ${esc(script.handle)} · ${script.music ? `music: ${esc(script.music)}` : "no music"} · ${script.shots.length} shots · ${approx}${total.toFixed(1)} s${reel ? "" : " (estimated, no voice yet)"}</p>
  <p class="hint">Want a change? Reply in chat with the card number, e.g. “03: make it a BigNumber”.</p>
  <div class="grid">
${script.shots.map(card).join("\n")}
  </div>
</main>
</body>
</html>
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(output, html);
if (missing.length)
  console.warn(`! No still for ${missing.join(", ")}. Run: npm run stills -- ${slug}`);
console.log(
  `✓ ${output}  (${script.shots.length} shots, ${approx}${total.toFixed(1)}s, ${frames ? "frames" : "text"})`,
);
