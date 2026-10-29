// Turns your cartoon character into the reel's host: one image of the 8 poses in a 4×2 grid on
// flat magenta becomes public/host/<pose>.png (keyed transparent), plus public/host/host.json
// with where each pose's mouth is, and out/host/check.png to see those mouths marked.
// Run it with no image to redraw the check after editing host.json.
// Usage: npm run host -- [sheet.png] [--order=idle,point,…] [--pose=shock] [--key=0.3]
//   --order  the poses as they appear in the grid, left to right, top to bottom
//   --pose   the image is one pose only: replace just that one
//   --key    how far from pure magenta a colour may be and still be keyed out (default 0.3)
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
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
if (!hasFilters("colorkey", "drawbox"))
  fail("Cutting the character out needs the full ffmpeg. Run: brew install ffmpeg");

/** Keys out the magenta of one cell (`crop`, or the whole image) into public/host/<pose>.png. */
const cut = (pose, crop) =>
  ffmpeg([
    "-loglevel", "error",
    "-y",
    "-i", image,
    "-vf", `${crop ? `${crop},` : ""}format=rgba,colorkey=0xFF00FF:${key}:0.08`,
    "-frames:v", "1",
    join(DIR, `${pose}.png`),
  ]);

if (image) {
  if (!existsSync(image)) fail(`${image} not found`);
  mkdirSync(DIR, { recursive: true });
  if (single) cut(single);
  else
    order.forEach((pose, i) =>
      cut(pose, `crop=iw/4:ih/2:iw/4*${i % 4}:ih/2*${Math.floor(i / 4)}`),
    );
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
mkdirSync(join("out", "host"), { recursive: true });
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
