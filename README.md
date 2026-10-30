<div align="center">

# 🎬 Techno Reel

**Turn one idea into a finished Instagram reel.**

Describe your reel in an AI coding chat. Techno Reel gives your assistant the tools to
write it, voice it, animate it and export it on your Mac.

**One prompt → script → voice → animation → captions → MP4**

[MIT](LICENSE) · React + Remotion · Local rendering

[Quick start](#quick-start) · [Workflow](#how-the-workflow-works) · [Your avatar](#create-your-own-avatar) · [Voice](#voice-text-to-speech-and-cloning) · [Reel types](#what-can-you-make) · [Dashboard](#review-your-projects)

<img src="docs/showcase.jpg" alt="Example reel in the flat style (top) and print style with a paper host (bottom)" width="100%">

Two looks: **flat** (bold outlines) and **print** (cut-paper cards and a presenter).

</div>

An open-source video toolkit for creators explaining ideas, developers sharing demos, and
people turning recordings into short videos. Your AI coding assistant runs the workflow;
React and Remotion build the scenes and render the video locally.

You get a **1080×1920 MP4**, a **cover image** and a **post caption**, with word-by-word
captions, sound effects and optional music. Reels typically run 20–45 seconds.

## Quick start

**Requirements:** Node.js **22.18+**, Homebrew, and an AI coding assistant such as Claude Code,
Gemini CLI, Codex or Cursor. Apple Silicon macOS is the primary supported platform.

**1. Try the included example.** No voice engine needed:

```bash
git clone https://github.com/Nayan014/techno-reel.git
cd techno-reel
npm run setup -- --render-only
npm run render -- example
```

Your video: `projects/example/export/example.mp4`.

**2. Enable voice for your own reels:**

```bash
npm run setup
```

Full setup installs VoiceStudio and its model; allow several GB and a few minutes.
Setup preserves existing `.env` settings. Internet is required for downloads and rendering fonts.

**3. Make your first reel.** Open this folder in Claude Code, Gemini CLI, Codex or Cursor and ask:

```text
Make a reel about 3 sleep tips, print style, cobalt palette,
my handle is @sleepbetter, under 25 seconds.
```

Choose how much you want to review:

| Mode | What happens |
| --- | --- |
| **Auto** | The assistant writes, voices, animates and checks the reel, then exports it. |
| **Plan** | Review the storyboard, then real shot stills. Voice and final rendering wait for your approval. |

Find the finished files in `projects/<slug>/export/`. To revise them, tell your assistant:
`In sleep-tips, make the hook punchier`.

## How the workflow works

Start with an idea, a script or your own recording. Your AI assistant runs the steps;
in Plan mode, you review the storyboard and real frames before production continues.

```mermaid
flowchart TD
    idea["Idea or written script"] --> write["Write the hook and shots"]
    take["Your talking-head recording"] --> cut["Transcribe, find the face and plan cuts"]
    write --> mode{"Auto or Plan?"}
    cut --> mode

    mode -- Auto --> audio["Generate voice or cut recorded clips"]
    mode -- Plan --> storyboard["Review storyboard in chat"]
    storyboard -- Changes --> revise["Revise shots"]
    revise --> storyboard
    storyboard -- Approved --> stills["Build scenes and check real shot stills"]
    stills --> frames["Review frames in chat"]
    frames -- Changes --> stills
    frames -- Approved --> audio

    audio --> checks["Check timing and shot layout"]
    checks -- Fix and recheck --> audio
    checks -- Pass --> render["Render the video"]
    render --> motion{"Motion check"}
    motion -- Fix and render again --> render
    motion -- Pass --> output["MP4 + cover + post caption"]
    output --> dashboard["Browse in the local dashboard"]
```

In Plan mode, talking-head clips are cut before frame review so previews use your actual
footage. Generated voice waits for frame approval. If a fix changes an approved shot,
the assistant brings its updated frames back for review before rendering.

## Create your own avatar

Give your reels a cartoon presenter based on you. It changes pose between shots and animates
its mouth with the voice. Set it up once and reuse it in either visual style.

![Avatar setup: photo, eight-pose sheet, cutouts and animated presenter](docs/avatar-workflow.svg)

**1. Make the character sheet.** Ask your assistant: `Help me create my own cartoon host`.
It gives you a prompt to use with a clear, front-facing photo in an image service of your choice.
The result should be one **4×2 sheet of eight poses**, with a closed mouth and a solid magenta
background. The poses are idle, pointing, presenting, thinking, shrugging, shocked, cheering
and waving. You choose where to upload your photo.

**2. Import the sheet.** Save the full-size image locally and give your assistant its path:

```bash
npm run host -- /path/to/character-sheet.png
```

The tool removes the magenta and saves the poses in `.local/host/`. Your assistant checks the
cutouts and adjusts mouth positions using `.local/cache/host/check.png`.

**3. Use your presenter.** Ask: `Use my cartoon host in this reel`. The assistant sets
`"host": "character"` in the reel's script and checks the result in the shot previews.

The avatar is a cartoon with animated poses and a mouth overlay. Its appearance and voice
are configured separately; to use your voice too, see cloning below.
Your character files stay in `.local/host/`, which is ignored by Git.

For the full image prompt and pose setup, see the [cartoon-host guide](.claude/skills/cartoon-host/SKILL.md).

## Voice: text-to-speech and cloning

### Text-to-speech

The default is **Kokoro / af_heart**, running locally through VoiceStudio on Apple Silicon.
It starts automatically when needed. Write a script, and the workflow generates speech and
word timings for captions. No voice cloning is needed to get started.

Change the preset in `.env`, then ask your assistant to record the reel again:

```dotenv
VOICE_PROVIDER=voicestudio
VOICESTUDIO_MODEL=mlx-audio
VOICESTUDIO_VOICE=af_heart
```

Ask for delivery changes in chat: `Pause before the payoff in shot 3` or
`Say the last two words more slowly`. Delivery marks stay out of the captions.

### Voice cloning and other languages

The default Kokoro setup does **not** clone voices or support German. The repository's
VoiceStudio integration also supports **OmniVoice**, which adds those capabilities.

1. Set up OmniVoice in VoiceStudio and personally review and accept its **non-commercial licence**.
2. Create a saved voice profile in VoiceStudio using your reference recording.
3. Set the model and saved profile in `.env`:

```dotenv
VOICESTUDIO_MODEL=omnivoice
VOICESTUDIO_VOICE=your-saved-profile-name-or-id
VOICESTUDIO_LANGUAGE=de
```

Use the language code for your reel; `de` is the German example. Model setup and licence
acceptance happen in VoiceStudio. Ask your assistant for help with your installation.

### Other voice providers

Set your provider in `.env` **before full setup**:

| Provider | What you need |
| --- | --- |
| **VoiceStudio** (default) | Apple Silicon for local MLX voice. Full setup installs it. |
| **ElevenLabs** | `VOICE_PROVIDER=elevenlabs`, `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`. Paid cloud service. |
| **macOS say** | `VOICE_PROVIDER=say`. Built-in voice with estimated caption timing. |

Providers never switch automatically. Intel Macs need an alternative to local MLX voice;
the full Windows/Linux workflow is unverified. See [.env.example](.env.example) for all settings.

## What can you make?

![The same reel in flat style above and paper style below](docs/showcase.jpg)

| Reel type | What it looks like | Try asking |
| --- | --- | --- |
| **Paper-style explainer** | Cut-paper cards, textured backgrounds and a paper presenter. | `Explain 3 sleep tips in print style` |
| **Bold animated reel** | Big headlines, hard shadows, numbers, lists and comparisons. | `Make a flat-style reel comparing two ideas` |
| **Talking head** | Your recording, trimmed and reframed, with captions and supporting graphics. | `Edit ~/Downloads/my-video.mov into a reel` |
| **Avatar-led reel** | Your custom cartoon presenter alongside animated scenes, in either style. | `Make an explainer with my cartoon host` |
| **Demo or walkthrough** | Your screenshots alongside headlines, steps and voiceover. | `Use these screenshots to explain my app` |

**Styles and presenters work together:** `flat` and `print` control the visual design;
a custom avatar replaces the presenter in either style. The print style includes a paper host
by default, which you can hide.

Talking-head edits use your spoken words, trim fillers and retakes, and alternate face shots
with graphics. Transcription requires VoiceStudio; Homebrew ffmpeg adds noise reduction.

Personalise any reel with **clay, cobalt, forest or mono** colours, your @handle, and
**lofi, upbeat, chill or funk** music. Ask for `no music` if you will add audio on Instagram.
The assistant checks timing, shot layout and motion during production.

## Review your projects

```bash
npm run dashboard
```

Open [the local dashboard](http://127.0.0.1:4173) to browse storyboards, stills, videos,
captions and saved checks. It refreshes every five seconds and flags outdated outputs.
**Production, feedback and approvals happen in your AI chat.**

```text
projects/<slug>/
  raw/          Untouched source recordings
  working/      Script, voice, assets and custom scenes
  preview/      Storyboard, stills and draft
  export/       <slug>.mp4, cover.png and caption.txt
```

For frame-by-frame playback, run `npm run studio -- <slug>`.
To create an empty project, run `npm run project -- <slug>`.

## Help and reference

Run `npm run doctor` to diagnose setup or voice problems, or
`npm run doctor -- --render-only` to check rendering alone.
VoiceStudio logs are in `.local/logs/voicestudio.log`.

- [Workflow and scene reference](CLAUDE.md) — production steps, validation gates, scene props and custom scenes.
- [Contributing](CONTRIBUTING.md) — development, bug reports and dependency notes.
- [Release checks](docs/release-check.md) — validation results and platform limits.
- [Security](SECURITY.md) — sensitive reports.

**Upgrading an older installation?** Run `npm run migrate` to preview, then
`npm run migrate -- --apply` to copy projects into the new layout. Originals stay intact.
`npm run migrate -- --rollback` removes unchanged copies. Legacy custom scenes need manual
assignment to `working/scenes/` and updated relative imports.

## Privacy and licences

Rendering is local. Setup downloads packages, Chrome and optional voice models; fonts and
asset fetching also use the internet. Your AI assistant follows its own data policies.
ElevenLabs sends spoken text to its cloud service; creating a cartoon host may use an image
service you choose.

`projects/`, `.local/` and `.env` are ignored by Git. This does not protect files already
tracked or information you share with an AI service. Keep keys and private recordings out
of public reports.

The kit is [MIT licensed](LICENSE). Dependencies, models, fonts and media have their own
terms; read [third-party notices](THIRD_PARTY_NOTICES.md) before commercial use. Included
sound effects and music are CC0; sources are in [sound credits](public/sfx/CREDITS.md).
AI tools and optional cloud services may have separate costs.

---

**Know someone with ideas for reels?** Share [Techno Reel](https://github.com/Nayan014/techno-reel).
If you make something with it, tag **[@techno_ravan](https://www.instagram.com/techno_ravan/)** —
I'd love to see it. A GitHub star helps others discover the project.

Made by **[Nayan Vekariya](https://vekariya.ai.studio/)** ·
[Techno Ravan on YouTube](https://www.youtube.com/@techno_ravan) ·
[Instagram](https://www.instagram.com/techno_ravan) ·
[LinkedIn](https://www.linkedin.com/in/nayan-vekariya/)
