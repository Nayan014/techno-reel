// Gets a fresh clone ready to make reels: packages, a .env to edit, the local voice engine
// (VoiceStudio, installed into ./voicestudio), the renderer's Chrome, then a checkup.
// Safe to run again; finished steps are skipped.
// Usage: npm run setup
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fail, loadEnv, nodeSupported, voiceStudio } from "./lib.mjs";

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
if (existsSync("node_modules/remotion")) console.log("  already installed");
else if (!run("npm", ["install"])) fail("npm install failed; see above.");

step("Settings");
if (existsSync(".env")) console.log("  .env is already there");
else {
  copyFileSync(".env.example", ".env");
  console.log("  made .env from .env.example; open it to change the voice or add keys");
}
loadEnv();

step("Voice engine (VoiceStudio)");
await setUpVoiceStudio();

step("Renderer (headless Chrome)");
const { ensureBrowser } = await import("@remotion/renderer");
await ensureBrowser();
console.log("  ready");

step("Checkup");
run(process.execPath, ["scripts/doctor.mjs"]);

async function setUpVoiceStudio() {
  if (await voiceStudio.running()) {
    console.log(`  running at ${voiceStudio.url()}`);
    return warmUp();
  }
  const dir = voiceStudio.dir();
  if (existsSync(join(dir, "backend", "main.py"))) {
    console.log(`  installed at ${dir}`);
  } else {
    if (process.platform !== "darwin" || process.arch !== "arm64") {
      console.log(
        "  skipped: the free local voice needs a Mac with Apple Silicon.\n" +
          "  To record reels anyway, set VOICE_PROVIDER=elevenlabs (paid) or say (robotic) in .env.",
      );
      return;
    }
    if (!has("git"))
      fail("git is missing. Install Apple's developer tools: xcode-select --install");
    if (!has("uv")) {
      if (!has("brew"))
        fail("VoiceStudio needs uv. Install Homebrew (https://brew.sh), then: brew install uv");
      console.log("  installing uv (a Python package manager) with Homebrew…");
      if (!run("brew", ["install", "uv"])) fail("brew install uv failed; see above.");
    }
    if (!existsSync(join(dir, ".git"))) {
      console.log(`  downloading VoiceStudio into ${dir}…`);
      // Blobs on demand: only the files of the commit below are downloaded, not all history.
      if (!run("git", ["clone", "--filter=blob:none", "--no-checkout", VOICESTUDIO_REPO, dir]))
        fail("Couldn't download VoiceStudio; check the internet connection and run setup again.");
    }
    if (!run("git", ["-C", dir, "checkout", "--quiet", VOICESTUDIO_COMMIT]))
      fail(`Couldn't check out VoiceStudio ${VOICESTUDIO_COMMIT.slice(0, 8)} in ${dir}.`);
    console.log("  installing its Python packages (about 1.7 GB, one time)…");
    if (!run("uv", ["sync", "--locked"], { cwd: dir }))
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
