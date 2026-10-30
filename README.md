<div align="center">

# 🎬 Techno Reel

**Turn one idea into a finished Instagram reel.**

Describe your reel in an AI coding chat. Techno Reel gives your assistant the tools to
write it, voice it, animate it and export it on your Mac.

**One prompt → script → voice → animation → captions → MP4**

[MIT](LICENSE) · React + Remotion · Local rendering

[Quick start](#quick-start) · [Make a reel](#make-a-reel) · [Dashboard](#review-your-projects) · [Help](#help-and-reference)

<img src="docs/showcase.jpg" alt="Example reel in the flat style (top) and print style with a paper host (bottom)" width="100%">

Two looks: **flat** (bold outlines) and **print** (cut-paper cards and a presenter).

</div>

## Your next reel starts with a sentence

For creators explaining an idea, developers sharing a demo, or anyone turning a recording
into a short video. Work through your AI assistant in plain language, from the first hook
to the final cut.

```text
Make a 25-second reel about 3 sleep tips. Use the paper look,
add captions, and show me the plan before making it.
```

- **Start with an idea or your own recording.** Generate an animated explainer or cut a talking-head video.
- **Make it yours.** Choose colours, music, a visual style and an optional cartoon host.
- **Review before rendering.** Approve the storyboard and shot previews in Plan mode.
- **Leave with posting assets.** A 1080×1920 MP4, cover image and caption, together in one project.

Built for people comfortable opening a terminal and using an AI coding assistant.

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

## Make a reel

**3. Open this folder in your AI coding assistant** and ask:

```text
Make a reel about 3 sleep tips, print style, cobalt palette,
my handle is @sleepbetter, under 25 seconds.
```

Choose how much you want to review:

| Mode | What happens |
| --- | --- |
| **Auto** | The assistant writes, voices, animates and checks the reel, then exports it. |
| **Plan** | Review the storyboard, then real shot stills. Voice and final rendering wait for your approval. |

Reels typically run 20–45 seconds, with word-by-word captions, sound effects and optional music.
The assistant checks timing, shot layout and motion as part of production.

A few useful requests:

| To… | Ask… |
| --- | --- |
| Edit your recording | `Edit ~/Downloads/my-video.mov into a reel` |
| Use your script | `Make a reel from this script: …` |
| Change the look | `Use the flat style and forest palette` |
| Choose music | `Use funk music` or `No music` |
| Add a custom presenter | `Use my own cartoon host` |
| Revise a project | `In sleep-tips, make the hook punchier` |

Talking-head edits use your spoken words, trim fillers and retakes, and alternate face shots
with graphics. Transcription requires VoiceStudio; Homebrew ffmpeg adds noise reduction.

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

## Voice and platform support

The default voice is **Kokoro / af_heart**, running locally through VoiceStudio. It starts
automatically when needed. The default workflow is English; German and voice cloning require
another model and the user's acceptance of its licence.

Set alternatives in `.env` **before full setup**:

| Provider | Configuration |
| --- | --- |
| **VoiceStudio** (default) | Local voice on Apple Silicon; change `VOICESTUDIO_VOICE` to choose a voice. |
| **ElevenLabs** | `VOICE_PROVIDER=elevenlabs`, plus your API key and voice ID. Paid cloud service. |
| **macOS say** | `VOICE_PROVIDER=say`. Built-in voice with estimated caption timing. |

Providers never switch automatically. Intel Macs need an alternative to local MLX voice;
the full Windows/Linux workflow is unverified.

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
