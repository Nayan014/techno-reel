// Turns your cartoon character into the reel's host: one image of the 8 poses in a 4×2 grid on
// flat magenta becomes public/host/<pose>.png (keyed transparent), plus public/host/host.json
// with where each pose's mouth is, and out/host/check.png to see those mouths marked. Each figure
// is cut along the magenta around it, so a hand reaching past its grid cell stays whole.
// Run it with no image to redraw the check after editing host.json.
// Usage: npm run host -- [sheet.png] [--order=idle,point,…] [--pose=shock] [--key=0.3]
//   --order  the poses as they appear in the grid, left to right, top to bottom
//   --pose   the image is one pose only: replace just that one
//   --key    how far from pure magenta a colour may be and still be keyed out (default 0.3)
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { HOST_POSES } from "../src/poses.ts";
import { fail, ffmpeg, hasFilters, option, readJson } from "./lib.mjs";

const DIR = join("public", "host");
const CONFIG = join(DIR, "host.json");
const image = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
const order = option("order", HOST_POSES.join(",")).split(",").map((pose) => pose.trim());
const single = option("pose");
const key = option("key", "0.3");

if (
  order.length !== HOST_POSES.length ||
  new Set(order).size !== order.length ||
  order.some((pose) => !HOST_POSES.includes(pose))
)
  fail(`--order must name each pose once: ${HOST_POSES.join(",")}`);
if (single && !HOST_POSES.includes(single))
  fail(`--pose must be one of: ${HOST_POSES.join(", ")}`);
if (!hasFilters("colorkey", "geq", "drawbox"))
  fail("Cutting the character out needs the full ffmpeg. Run: brew install ffmpeg");

// Outlines antialiased against magenta come out purple: wherever red and blue both rise above
// green, pull them back down to it. Skin, whites and any colour without that tint stay as they are.
const SPILL = "max(0,min(r(X,Y),b(X,Y))-g(X,Y))";
const DESPILL = `geq=r='r(X,Y)-${SPILL}':g='g(X,Y)':b='b(X,Y)-${SPILL}':a='alpha(X,Y)'`;

/** Keys out the magenta of one figure (`crop`, or the whole image) into public/host/<pose>.png. */
const cut = (pose, crop) =>
  ffmpeg([
    "-loglevel", "error",
    "-y",
    "-i", image,
    "-vf", `${crop ? `${crop},` : ""}format=rgba,colorkey=0xFF00FF:${key}:0.08,${DESPILL}`,
    "-frames:v", "1",
    join(DIR, `${pose}.png`),
  ]);

/** Magenta, give or take what a JPEG or a soft edge does to it. */
const isBackground = (rgb, i) => rgb[i] > 180 && rgb[i + 2] > 180 && rgb[i + 1] < 90;
/** How far a cut may reach into the gap beside a figure, in px. */
const MARGIN = 8;

/** The sheet as RGB bytes, with its size. */
const decode = () => {
  const raw = join("out", "host", "sheet.rgb");
  const log = ffmpeg(["-y", "-i", image, "-vf", "format=rgb24", "-c:v", "rawvideo", "-f", "image2pipe", raw]);
  const size = log.match(/Video:[^\n]*?\b(\d{2,5})x(\d{2,5})\b/);
  if (!size) fail(`Couldn't read the size of ${image}`);
  const pixels = readFileSync(raw);
  rmSync(raw);
  return { pixels, width: Number(size[1]), height: Number(size[2]) };
};

/** Maximal runs of i in [0, n) where `busy(i)`, as [start, end). */
const runs = (n, busy) => {
  const found = [];
  let start = null;
  for (let i = 0; i <= n; i++) {
    const on = i < n && busy(i);
    if (on && start === null) start = i;
    if (!on && start !== null) {
      found.push([start, i]);
      start = null;
    }
  }
  return found;
};

/**
 * The 4 figures of one row of the sheet, as column spans [start, end) reaching a little into the
 * magenta beside them, or null when they touch and can't be told apart.
 */
const figuresIn = ({ pixels, width }, top, bottom) => {
  const busy = (x) => {
    for (let y = top; y < bottom; y++)
      if (!isBackground(pixels, (y * width + x) * 3)) return true;
    return false;
  };
  // Specks narrower than 1 % of the sheet are dirt, not a figure.
  const spans = runs(width, busy).filter(([a, b]) => b - a >= width * 0.01);
  // A hand held off to the side leaves a gap inside its figure: close the narrowest gaps first.
  while (spans.length > 4) {
    let k = 0;
    for (let i = 1; i < spans.length - 1; i++)
      if (spans[i + 1][0] - spans[i][1] < spans[k + 1][0] - spans[k][1]) k = i;
    spans.splice(k, 2, [spans[k][0], spans[k + 1][1]]);
  }
  if (spans.length < 4) return null;
  return spans.map(([a, b], i) => [
    Math.max(i ? Math.ceil((spans[i - 1][1] + a) / 2) : 0, a - MARGIN),
    Math.min(i < 3 ? Math.floor((b + spans[i + 1][0]) / 2) : width, b + MARGIN),
  ]);
};

/**
 * Where each of the 8 figures sits, in reading order, as [x, y, w, h]. Rows split at the magenta
 * band nearest the middle; within a row, figures split at the magenta between them. A row whose
 * figures touch falls back to 4 equal cells.
 */
const layout = () => {
  const sheet = decode();
  const { pixels, width, height } = sheet;
  const clearRow = (y) => {
    for (let x = 0; x < width; x++) if (!isBackground(pixels, (y * width + x) * 3)) return false;
    return true;
  };
  const middle = runs(height, clearRow)
    .filter(([a, b]) => b > height / 4 && a < (height * 3) / 4)
    .map(([a, b]) => Math.round((a + b) / 2))
    .sort((a, b) => Math.abs(a - height / 2) - Math.abs(b - height / 2))[0];
  const split = middle ?? Math.round(height / 2);
  return [
    [0, split],
    [split, height],
  ].flatMap(([top, bottom], row) => {
    let spans = figuresIn(sheet, top, bottom);
    if (!spans) {
      console.log(
        `! Row ${row + 1}: the figures touch, so it's cut into 4 equal cells. Check out/host/check.png.`,
      );
      spans = [0, 1, 2, 3].map((i) => [
        Math.round((width * i) / 4),
        Math.round((width * (i + 1)) / 4),
      ]);
    }
    // Down to each figure's own lowest pixel, so every pose stands on the same floor.
    const floor = (a, b) => {
      for (let y = bottom - 1; y > top; y--)
        for (let x = a; x < b; x++) if (!isBackground(pixels, (y * width + x) * 3)) return y + 1;
      return bottom;
    };
    return spans.map(([a, b]) => [a, top, b - a, floor(a, b) - top]);
  });
};

mkdirSync(join("out", "host"), { recursive: true });
if (image) {
  if (!existsSync(image)) fail(`${image} not found`);
  mkdirSync(DIR, { recursive: true });
  if (single) cut(single);
  else {
    // Every pose gets the same canvas, figure centred and standing on its bottom edge, so the
    // host keeps one size and one floor from pose to pose.
    const cells = layout();
    const w = Math.max(...cells.map((cell) => cell[2]));
    const h = Math.max(...cells.map((cell) => cell[3]));
    order.forEach((pose, i) => {
      const [x, y, cw, ch] = cells[i];
      cut(pose, `crop=${cw}:${ch}:${x}:${y},pad=${w}:${h}:(ow-iw)/2:oh-ih:color=0xFF00FF`);
    });
  }
}

const missing = HOST_POSES.filter((pose) => !existsSync(join(DIR, `${pose}.png`)));
if (missing.length)
  fail(`No ${missing.join(", ")} pose yet. Run: npm run host -- <sheet.png>`);

// Keep every mouth already placed; new poses start where a waist-up figure's mouth usually is.
const config = readJson(CONFIG) ?? {};
const mouthWidth = config.mouthWidth ?? 0.12;
const mouth = Object.fromEntries(
  HOST_POSES.map((pose) => [pose, config.mouth?.[pose] ?? [0.5, 0.3]]),
);
writeFileSync(
  CONFIG,
  `{\n  "mouthWidth": ${mouthWidth},\n  "mouth": {\n${HOST_POSES.map(
    (pose) => `    "${pose}": [${mouth[pose].join(", ")}]`,
  ).join(",\n")}\n  }\n}\n`,
);

// Every pose on grey, side by side, with a red bar where host.json puts its mouth.
const check = join("out", "host", "check.png");
ffmpeg([
  "-loglevel", "error",
  "-y",
  ...HOST_POSES.flatMap((pose) => ["-i", join(DIR, `${pose}.png`)]),
  "-filter_complex",
  HOST_POSES.map((pose, i) => {
    const [x, y] = mouth[pose];
    return (
      `[${i}]scale=-2:480,format=rgba,split[a${i}][b${i}];` +
      `[a${i}]drawbox=c=0xDDDDDD:t=fill[g${i}];[g${i}][b${i}]overlay,` +
      `drawbox=x=iw*${x - mouthWidth / 2}:y=ih*${y}-3:w=iw*${mouthWidth}:h=6:c=red:t=fill[c${i}]`
    );
  }).join(";") +
    `;${HOST_POSES.map((_, i) => `[c${i}]`).join("")}hstack=inputs=${HOST_POSES.length}`,
  "-frames:v", "1",
  check,
]);

console.log(`✓ ${DIR}/: ${HOST_POSES.join(", ")}`);
console.log(
  `✓ ${check}: each red bar should sit on the closed mouth, as wide as it.\n` +
    `  If not, fix "mouth" ([x, y], 0–1 of the image) or "mouthWidth" in ${CONFIG}\n` +
    `  and run npm run host again. Then set "host": "character" in a reel's script.json.`,
);
