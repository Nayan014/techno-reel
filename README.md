<div align="center">

# 🎬 Techno Reel

### Type one line. Get a finished Instagram reel. ✨

Script ✍️ → voice 🎤 → animation 🎞️ → captions 💬 → mp4 📱<br>
All on your Mac, all in code, no video editor.

[![Made with Remotion](https://img.shields.io/badge/made%20with-Remotion-0B84F3)](https://www.remotion.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node](https://img.shields.io/badge/Node-22.18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![macOS](https://img.shields.io/badge/macOS-Apple%20Silicon-000000?logo=apple&logoColor=white)](#-get-started-once)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-ready-D97757?logo=anthropic&logoColor=white)](https://claude.com/claude-code)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

[🌐 Website](https://vekariya.ai.studio/) · [▶️ YouTube](https://www.youtube.com/@techno_ravan) ·
[📸 Instagram](https://www.instagram.com/techno_ravan) · [💼 LinkedIn](https://www.linkedin.com/in/nayan-vekariya/)

<img src="docs/showcase.jpg" alt="The example reel, shot by shot, in the flat look (top row) and the print look (bottom row)" width="100%">

<sub>The example reel, shot by shot. Top: <b>flat</b> look. Bottom: <b>print</b> look with the paper host.</sub>

**[Quick start](#-get-started-once) · [First reel](#-make-your-first-reel) · [What to ask](#-what-you-can-ask-for) · [Voice](#-the-voice) · [Help](#-if-something-goes-wrong) · [About me](#-about-me)**

</div>

---

> 🔱 _Tech is like Ravan's knowledge: enormous power that serves you only if you steer it._
> This kit puts a writer, a voice, an editor and an animator on your Mac. You stay in charge.

## ✨ What it does

You type one sentence. You get a finished Instagram reel: animated, with a voice, captions and
sound. 1080×1920, ready to post.

- ✍️ **Writes the script.** Hook first, one idea per shot, 20–45 seconds.
- 🎤 **Records a natural voice.** Free and local, no cloud, no subscription.
- 🎞️ **Animates every shot in code.** Nine scene types, two looks, all built with Remotion.
- 💬 **Adds word-by-word captions**, kept clear of Instagram's buttons.
- 🔊 **Scores it.** Real recorded sound effects on every beat and a music bed that dips under
  the voice. All public domain, so they're safe in paid work and monetised posts.
- 🗂️ **Plan mode.** See every shot as a card and change it before anything is rendered.
- 🎥 **Edits your own video.** Cuts the "um"s, pauses and retakes out of a talking-head recording.
- 🔍 **Checks its own work.** Pace and look checks on every shot before the final render.
- 🔒 **Stays private.** Everything runs on your Mac. Your reels never leave it.

## 🧭 How it works

```mermaid
flowchart TD
    idea(["💡 One line"]) --> mode{"Auto or Plan?"}
    mode -- Auto --> script["✍️ Script"]
    mode -- Plan --> cards["🗂️ Script + plan cards<br/>you review"]
    script --> voice["🎤 Voice"]
    cards --> voice
    voice --> check["🔍 Pace + look checks"]
    check -- Auto --> render["🎬 Render"]
    check -- Plan --> frames["🖼️ Cards with real frames<br/>you review"]
    frames --> render
    render --> reel(["📱 mp4 + caption"])
```

---

## 🚀 Get started (once)

**You need:**

- 🍎 a Mac, ideally with an Apple chip (M1 or newer) for the free local voice
- 🟢 [Node.js](https://nodejs.org) 22.18 or newer (`brew install node`) and
  [Homebrew](https://brew.sh)
- 🤖 an AI coding tool: [Claude Code](https://claude.com/claude-code),
  [Gemini CLI](https://github.com/google-gemini/gemini-cli), Codex or Cursor. They all read the
  same instructions (`CLAUDE.md`; `AGENTS.md` and `GEMINI.md` point to it).

**Then, in the Terminal:**

```bash
git clone https://github.com/Nayan014/techno-reel.git
```

```bash
cd techno-reel && npm run setup
```

Setup installs everything and checks it at the end. The first time it downloads about 2 GB
(the voice engine) and takes a few minutes. You can run it again any time; it skips what's done.

---

## 🎬 Make your first reel

**Step 1.** Open the Terminal app, go to the folder and start your AI tool:

```bash
cd techno-reel && claude
```

(or `gemini`, `codex`, …)

**Step 2.** Tell Claude what the reel is about. For example:

```
make a reel about why coffee makes some people sleepy
```

**Step 3.** Claude asks: **Auto** or **Plan**?

| ⚡ Auto                                        | 🗂️ Plan                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| Claude does everything on its own in minutes. | You review the reel twice before it's made.                                     |
| 1. writes the script                          | 1. Claude writes the script and shows a page of cards, one per shot             |
| 2. records the voice                          | 2. each card: what you see, what's said, the text on screen, which tool makes it |
| 3. builds the animations                      | 3. you reply with changes (`03: make it a big number`) until you like it        |
| 4. checks its own work and fixes problems     | 4. Claude records the voice and shows the same cards with real pictures         |
| 5. saves the video                            | 5. you say OK, it saves the video                                               |

**Step 4.** Find your files in the reel's own folder, `out/<name>/`:

| File                     | What it is                                         |
| ------------------------ | -------------------------------------------------- |
| `out/<name>/<name>.mp4`  | 🎬 the reel                                        |
| `out/<name>/caption.txt` | 📝 the text for your Instagram post, with hashtags |
| `out/<name>/stills/`     | 🖼️ one picture per shot, from Claude's check       |
| `out/<name>/plan.html`   | 🗂️ the plan cards, in plan mode                    |

That's it. Post the video, paste the caption. 🎉

---

## 💬 What you can ask for

Just add it to your sentence. Some examples:

| You want             | Say this                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 🧠 A topic           | `make a reel about how airplanes stay in the air`                                                                       |
| 📝 Your own words    | `make a reel from this script: ...` and paste your text                                                                 |
| 🎨 Other colours     | `use the cobalt palette`. Choices: **clay** (orange), **cobalt** (blue), **forest** (green), **mono** (black and white) |
| 🏷️ Your name on it   | `my handle is @yourname`                                                                                                |
| ⏱️ A shorter reel    | `keep it under 20 seconds`                                                                                              |
| 📊 A specific visual | `show 72% as a big number` or `compare iPhone vs Android`                                                               |
| 📋 A list            | `make it a top 3 list`                                                                                                  |
| ✂️ Paper look        | `use the print style`: cut-paper cards, a little paper presenter, captions that fill in as they're spoken               |
| 🎵 Music             | `use funk music` or `no music`. Choices: **lofi**, **upbeat**, **chill**, **funk**                                      |
| 🗂️ Plan it first     | `plan it first`: cards for every shot you can change before the video is made                                           |
| 🎥 Your own video    | `edit ~/Downloads/my-video.mov into a reel` (see below)                                                                 |

You can mix them:

```
make a reel about 3 sleep tips, cobalt palette, my handle is @sleepbetter, under 25 seconds
```

### 🎥 Edit your own video (talking head)

Record yourself talking (phone or camera, any length), then tell Claude where the file is:

```
edit ~/Downloads/my-video.mov into a reel, print style
```

Claude:

1. 🔊 levels your sound for Instagram and writes down every word you said, with its timing
2. ✂️ cuts out the "um"s, the pauses and the takes you redid, and keeps your best version of each line
3. 🔀 switches between your face, a zoomed-in face, and your face under a graphic (numbers, lists,
   your screenshots), so the cuts don't jump
4. 💬 adds captions and checks every shot, then saves the video

It only uses words you actually said. Want screenshots in it? Put them in the reel's folder and
say which line they go with. For noise reduction too, install the full ffmpeg once:
`brew install ffmpeg`.

---

## 🔁 Change a reel

Not happy? Just say what to change. Claude edits it and makes a new video.

```
make the first sentence punchier
replace shot 3 with a big number
use a different colour
make it shorter
the text in shot 2 is too long
```

> 💡 **New Claude session?** Claude doesn't remember old chats. Say the reel's name, for example
> `in the coffee-sleepy reel, make the hook punchier`. Every reel has its own folder in
> `public/reels/`. The folder name is the reel's name.

---

## 👀 Watch it before you post

Open the `.mp4` file in `out/<name>/`. It plays in QuickTime.

Or watch it in your browser, where you can move frame by frame:

```bash
npm run studio
```

On the right side, find the **slug** box and type the reel's name (for example `coffee-sleepy`).

---

## 🎤 The voice

The kit uses **VoiceStudio**, a free voice program that runs on your Mac. `npm run setup`
installs it into the `voicestudio/` folder inside the kit (an older install in `~/VoiceStudio`
is used if it's there).

- ✅ **You don't need to start it.** The kit starts it by itself when needed.
- ⏳ The first time it starts, it takes 5–30 seconds. After that, it stays on and is fast.
- 🗣️ The voice is **af_heart**, a natural American female voice.

**Want a different voice?** Do this once:

```bash
open -e .env
```

A text window opens. Find the line `VOICESTUDIO_VOICE=af_heart` and change `af_heart` to
another voice. Save and close.

| Voice        | Sounds like          | Quality      |
| ------------ | -------------------- | ------------ |
| `af_heart`   | American woman       | ⭐ best      |
| `af_bella`   | American woman       | very good    |
| `af_nicole`  | American woman, soft | good         |
| `bf_emma`    | British woman        | good         |
| `am_michael` | American man         | okay         |
| `am_fenrir`  | American man         | okay         |
| `bm_george`  | British man          | okay         |

Then tell Claude `record the voice again` for your reel.

**Stop VoiceStudio** (to free memory, for example):

```bash
kill $(lsof -ti tcp:3900)
```

It starts again by itself next time you make a reel.

**Things this voice can't do:**

- 🇩🇪 **German.** This voice speaks English and a few other languages, but not German.
- 🧬 **Your own voice.** It can't copy your voice.

Both are possible with another voice model called OmniVoice. But its licence allows
**personal use only**, not paid or client work, and you have to accept that licence yourself.
Ask Claude if you want to switch.

---

## 🩺 If something goes wrong

First, run the check:

```bash
cd techno-reel && npm run doctor
```

| Sign | Meaning                                   |
| ---- | ----------------------------------------- |
| ✓    | all good                                  |
| !    | works, but could be better                |
| ✗    | broken; the line below says how to fix it |

**Common problems:**

| Problem                           | Why                                                                | Fix                                                                                       |
| --------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| The voice sounds like a robot     | VoiceStudio didn't start, so the kit used the Mac's built-in voice | Run `npm run doctor`. If VoiceStudio shows ✗, look at `out/voicestudio.log` or ask Claude |
| Captions are a bit early or late  | Same reason: with the robot voice, caption timing is guessed       | Get VoiceStudio running, then say `record the voice again`                                |
| The first reel of the day is slow | The voice models are loading                                       | Normal. The next reels are fast                                                           |
| Text is cut off or too big        | A shot has too many words                                          | Tell Claude `the text in shot 4 doesn't fit`                                              |
| The Mac feels slow                | VoiceStudio uses memory while it runs                              | Stop it with the command in [The voice](#-the-voice)                                      |

---

## 🧰 Without Claude (advanced)

Every reel is one file: `public/reels/<name>/script.json`. Copy
`public/reels/example/script.json`, change the text, then run these one by one:

```bash
npm run voice -- <name>
```

Records the voice. For your own video, first run `npm run transcribe -- <name> <video>`, then
write shots that each play a `clip` of it (see `CLAUDE.md`); `voice` then cuts them instead.

```bash
npm run check -- <name>
```

Checks timing. Fix anything marked **FAIL**.

```bash
npm run stills -- <name>
```

Saves one picture per shot in `out/<name>/stills/` so you can look at them.

```bash
npm run plan -- <name>
```

Makes `out/<name>/plan.html`: one card per shot to review. Works before the voice is recorded.
Add `--frames` after `stills` to put the pictures on the cards.

```bash
npm run render -- <name>
```

Makes the video at `out/<name>/<name>.mp4`.

**The shot types** you can use in `script.json`:

| Shot type    | Shows                                           |
| ------------ | ----------------------------------------------- |
| `Hook`       | 🪝 big bold headline, for the first shot        |
| `Statement`  | 💡 one idea on a tilted card                    |
| `ChatPrompt` | 💬 a chat box where a prompt types itself in    |
| `BigNumber`  | 🔢 a number that counts up                      |
| `List`       | 📋 2–4 numbered points                          |
| `Compare`    | ⚖️ two things side by side                      |
| `Meter`      | 📈 a tank filling up: something building up     |
| `Swarm`      | 🕸️ one node spawning many: agents, teams, networks |
| `Screenshot` | 🖼️ your own screenshot or photo in a window     |
| `CTA`        | 👉 the ending: "Follow" button                  |

Every shot type works in both looks: `"style": "flat"` (bold outlines) or `"style": "print"`
(cut paper with a little presenter). `Statement`, `ChatPrompt`, `List` and `Swarm` can show an
AI tool's logo (ChatGPT, Claude, Copilot, Gemini, Grok, Cursor) with `"icon"`.

Claude can also make new shot types when none fits. Those stay on your Mac in
`src/scenes/local/`, never in git, unless you ask to add one to the kit.

---

## 🧱 Built with

| Tool                                                                                     | Job                                                |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 🎞️ [Remotion](https://www.remotion.dev)                                                  | turns React code into video, frame by frame        |
| ⚛️ [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)             | every scene, caption and the paper host            |
| 🎤 [VoiceStudio](https://github.com/debpalash/VoiceStudio) + Kokoro                      | free voice and word timing, on your Mac            |
| 🔊 ffmpeg                                                                                | levels and cleans your own recordings              |
| 🤖 [Claude Code](https://claude.com/claude-code), Gemini CLI, Codex                      | the director: writes, checks and fixes every reel  |

---

## 📌 Good to know

- 💸 **Cost:** everything here is free except Claude itself. ElevenLabs (an optional paid voice)
  is only used if you add a key to `.env`.
- 📜 **Licences:** this kit is MIT (see `LICENSE`). Remotion (the video tool) is free for people
  and companies with up to 3 employees; bigger companies need a
  [Remotion company licence](https://www.remotion.dev/license). VoiceStudio is AGPL-3.0; setup
  downloads it separately, it isn't part of this repo. The af_heart voice model (Kokoro) has an
  Apache-2.0 licence label.
- 🔊 **Sounds and music:** every sound effect and music bed is CC0 (public domain): use them
  anywhere, no credit needed. They're from [Kenney](https://kenney.nl), [Freesound](https://freesound.org)
  and [HoliznaCC0](https://holiznacc0.bandcamp.com); `public/sfx/CREDITS.md` lists each one.
  Want trending Instagram audio instead? Say `no music` and add it in the Instagram app.
- 🔒 **Your reels stay private:** `.gitignore` keeps your own reels, recordings, renders and `.env`
  out of git. Only `public/reels/example/` is shared.
- 🎬 **Example:** `public/reels/example/` is a finished reel. Rebuild it with
  `npm run render -- example`.
- 🤖 **Instructions for Claude** are in `CLAUDE.md`. You don't need to read them.

---

## 👋 About me

<table>
<tr>
<td width="140" valign="top">
<img src="https://github.com/Nayan014.png" width="120" alt="Nayan Vekariya">
</td>
<td>

Hi, I'm **Nayan Vekariya** 👨‍💻, a Technical Lead and Software Architect with 10+ years of
building React Native and React apps that serve millions of users, across healthcare, e-commerce
and utilities. On the side I run **Techno Ravan**, a channel about AI and future tech.

- 🇩🇪 Based in Germany
- 📱 React Native · React · Next.js · TypeScript
- 🤖 Building with AI every day: Claude, Gemini, Cursor
- 🎥 Creator of [Techno Ravan](https://www.youtube.com/@techno_ravan): AI, tech guides, reviews
- 🗣️ English · Gujarati · Hindi

</td>
</tr>
</table>

[![Website](https://img.shields.io/badge/Website-vekariya.ai.studio-111111?logo=googlechrome&logoColor=white)](https://vekariya.ai.studio/)
[![YouTube](https://img.shields.io/badge/YouTube-@techno__ravan-FF0000?logo=youtube&logoColor=white)](https://www.youtube.com/@techno_ravan)
[![Instagram](https://img.shields.io/badge/Instagram-@techno__ravan-E4405F?logo=instagram&logoColor=white)](https://www.instagram.com/techno_ravan)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Nayan%20Vekariya-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/nayan-vekariya/)
[![Medium](https://img.shields.io/badge/Medium-@nayan.vekariya014-000000?logo=medium&logoColor=white)](https://medium.com/@nayan.vekariya014)
[![Upwork](https://img.shields.io/badge/Hire%20me-Upwork-14A800?logo=upwork&logoColor=white)](https://www.upwork.com/freelancers/~01c4ffd8f428873af2)

---

<div align="center">

⭐ **If Techno Reel saved you an evening in a video editor, star the repo** and tag
**@techno_ravan** in your reel. I'd love to see it!

Made with ❤️ and a lot of ☕ in Germany 🇩🇪 by [Nayan Vekariya](https://vekariya.ai.studio/)

</div>
