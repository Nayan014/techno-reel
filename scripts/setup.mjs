// Gets a fresh clone ready to make reels: packages, a .env to edit, the local voice engine
// (VoiceStudio, installed into ./voicestudio), the renderer's Chrome, then a checkup.
// Safe to run again: packages reinstall only when package-lock.json changed; settings,
// installed voice files and the downloaded Chrome are kept.
// Usage: npm run setup [-- --render-only]
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fail, loadEnv, nodeSupported, pickVoiceProvider, voiceStudio } from "./lib.mjs";

const VOICESTUDIO_REPO = "https://github.com/debpalash/VoiceStudio";
/** The VoiceStudio commit this kit was tested against; newer ones may change its API. */
const VOICESTUDIO_COMMIT = "e0451f1a9c0d4e9aaac82d8d849490b199c1557f";

const step = (label) => console.log(`\n▸ ${label}`);
const has = (tool) =>
  spawnSync(tool, ["--version"], { stdio: "ignore" }).status === 0;
const run = (command, args, options = {}) =>
  spawnSync(command, args, { stdio: "inherit", ...options }).status === 0;

if (!nodeSupported())
  fail(
    `Node ${process.versions.node} is too old; the kit needs 22.18 or newer. Install Node 24 LTS: brew install node (or https://nodejs.org)`,
  );

step("Packages");
if (packagesCurrent()) console.log("  up to date");
else if (!run("npm", ["ci"])) fail("npm ci failed; see above. Check your network and package-lock.json.");

step("Settings");
if (existsSync(".env")) console.log("  .env is already there");
else {
  copyFileSync(".env.example", ".env");
  console.log("  made .env from .env.example; open it to change the voice or add keys");
}
loadEnv();

const renderOnly = process.argv.includes("--render-only");
const provider = renderOnly ? null : pickVoiceProvider();
if (provider === "voicestudio") {
  step("Voice engine (VoiceStudio)");
  await setUpVoiceStudio();
} else {
  console.log(renderOnly
    ? "  render-only: voice installation and checks skipped"
    : `  using ${provider}; VoiceStudio installation skipped`);
}

step("Renderer (headless Chrome)");
const { ensureBrowser } = await import("@remotion/renderer");
try {
  await ensureBrowser();
  console.log("  ready");
} catch (error) {
  fail(`Could not prepare headless Chrome: ${error.message}. Check your network, then rerun setup.`);
}

step("Checkup");
if (!run(process.execPath, ["scripts/doctor.mjs", ...(renderOnly ? ["--render-only"] : [])]))
  fail("Checkup failed. Fix the ✗ items above, then run npm run doctor" + (renderOnly ? " -- --render-only" : "") + ".");

/**
 * npm rewrites node_modules/.package-lock.json on every install, so one at least as new as
 * package-lock.json means nothing changed. Skipping `npm ci` then also keeps Remotion's Chrome
 * (in node_modules/.remotion), which it would delete and download again.
 */
function packagesCurrent() {
  try {
    return statSync("node_modules/.package-lock.json").mtimeMs >= statSync("package-lock.json").mtimeMs;
  } catch {
    return false;
  }
}

async function setUpVoiceStudio() {
  if (await voiceStudio.running()) {
    console.log(`  running at ${voiceStudio.url()}`);
    return warmUp();
  }
  const dir = voiceStudio.dir();
  const checkedOut = existsSync(join(dir, "backend", "main.py"));
  // An install elsewhere (~/VoiceStudio, VOICESTUDIO_DIR) is the user's to manage. Setup's own
  // in ./voicestudio is synced on every run, so an interrupted package download resumes.
  if (checkedOut && resolve(dir) !== resolve("voicestudio")) {
    console.log(`  installed at ${dir}`);
  } else {
    if (process.platform !== "darwin" || process.arch !== "arm64") {
      console.log(
        "  skipped: the free local voice needs a Mac with Apple Silicon.\n" +
          "  To record reels anyway, set VOICE_PROVIDER=elevenlabs (paid) in .env. macOS also supports say (robotic).",
      );
      return;
    }
    if (!checkedOut && !has("git"))
      fail("git is missing. Install Apple's developer tools: xcode-select --install");
    if (!has("uv")) {
      if (!has("brew"))
        fail("VoiceStudio needs uv. Install Homebrew (https://brew.sh), then: brew install uv");
      console.log("  installing uv (a Python package manager) with Homebrew…");
      if (!run("brew", ["install", "uv"])) fail("brew install uv failed; see above.");
    }
    if (!checkedOut) {
      if (!existsSync(join(dir, ".git"))) {
        console.log(`  downloading VoiceStudio into ${dir}…`);
        // Blobs on demand: only the files of the commit below are downloaded, not all history.
        if (!run("git", ["clone", "--filter=blob:none", "--no-checkout", VOICESTUDIO_REPO, dir]))
          fail("Couldn't download VoiceStudio; check the internet connection and run setup again.");
      }
      if (!run("git", ["-C", dir, "checkout", "--quiet", VOICESTUDIO_COMMIT]))
        fail(`Couldn't check out VoiceStudio ${VOICESTUDIO_COMMIT.slice(0, 8)} in ${dir}.`);
    }
    console.log("  Python packages (about 1.7 GB the first time)…");
    // --inexact keeps packages added later, such as an extra engine's.
    if (!run("uv", ["sync", "--locked", "--inexact"], { cwd: dir }))
      fail(`uv sync failed in ${dir}; see above, then run setup again.`);
  }
  if (await voiceStudio.ensure()) await warmUp();
  else console.log("  ! VoiceStudio didn't start; the checkup below says why.");
}

/** Says one word so the voice model downloads now rather than during the first reel. */
async function warmUp() {
  process.stdout.write("  loading the voice model (downloads the first time)… ");
  const res = await fetch(`${voiceStudio.url()}/v1/audio/speech`, {
    method: "POST",
    headers: { ...voiceStudio.headers(), "content-type": "application/json" },
    body: JSON.stringify({
      model: voiceStudio.model(),
      voice: voiceStudio.voice(),
      input: "Ready.",
      response_format: "wav",
    }),
  }).catch(() => null);
  console.log(res?.ok ? "done" : "skipped; it loads on the first reel instead");
}
