# Techno Reel

This folder turns one line ("make a reel about X") into a finished, animated 1080×1920 reel:
script → voice → scenes in code → self-check → mp4 + caption. It also edits the user's own
talking-head recording into a reel (see **Talking head**). Video is React, rendered by
[Remotion](https://www.remotion.dev). Everything renders locally.

When the user asks for a reel, first ask **Auto** or **Plan** (see **Modes**), then run the
workflow below. Ask nothing else unless the topic is missing. Reply in the user's language and
write the reel in it too.

## Styles

`style` in `script.json` picks the look; every scene works in both.

- `flat` (default): bold outlines, hard shadows, dot grid, Anton headlines.
- `print`: a cut-paper studio. Grainy lit card stock, soft depth, paper-strip captions that
  fill in word by word, and a paper host standing bottom left who changes pose every shot and
  lip-syncs to the voice. Pick it for tips, explainers and lists, or when the user asks for
  paper, print or a host.
  `"host": false` hides the host. A shot's `pose` overrides its default: `idle`, `point`,
  `present`, `think`, `shrug`, `shock`, `cheer`, `wave`.

`"host": "character"` puts the user's own cartoon in place of the paper host, in either style,
with the same poses. It's made once from their photo with the `cartoon-host` skill
(`.claude/skills/cartoon-host/SKILL.md`) and kept in `public/host/`. Offer it when the user wants
a host that looks like them.


## First run

If `node_modules/` or the voice engine is missing, run `npm run setup` (installs packages,
makes `.env`, installs VoiceStudio into `./voicestudio`, then runs the doctor). Otherwise run
`npm run doctor`. Walk the user through every ✗ either prints.

The voice is **VoiceStudio**: free, local, served on `127.0.0.1:3900` from the headless install
in `./voicestudio` (made by `npm run setup`), or `~/VoiceStudio` if that's where it already is
(`VOICESTUDIO_DIR` overrides both). When it isn't running, `npm run voice` and `npm run doctor`
start it in the background themselves (about 30 s, log in `out/voicestudio.log`) and leave it
running for later reels; don't start it by hand. Default engine is Kokoro (`mlx-audio`, voice
`af_heart`): Apache-2.0, English, no German. For German or a cloned voice the user must switch
to OmniVoice and accept its non-commercial licence themselves; never accept a model licence for
them.

There is no fallback. When VoiceStudio won't answer or start, `npm run voice` stops without
recording. Stop too: show the user its error and the end of `out/voicestudio.log`, try what the
log points to (`npm run doctor`, a stale process on port 3900), and ask before anything else.
Never switch to another engine yourself. Only the user picks one, with `VOICE_PROVIDER` in
`.env`: `elevenlabs` (paid, needs `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID`) or `say` (macOS,
robotic, caption timing estimated). Both read the plain line, without its delivery marks.

Settings go in `.env` (copy `.env.example`).

## Modes

When the user gives you a topic or a video, ask once, as a two-choice question: **Auto** or
**Plan**? Skip the question when they already said which (`plan it first`, `just make it`).

- **Auto**: run the whole workflow on your own and hand over the mp4.
- **Plan**: the user reviews a storyboard twice before anything is rendered, and no voice is
  recorded until they've approved the frames.
  1. Do steps 1–2 (a talking head: Transcribe, Find the face and Cut first). If a shot needs a
     scene that doesn't exist yet, name it anyway; its card says "new scene, to write".
  2. `npm run plan -- <slug>` writes `out/<slug>/plan.html`: one card per shot with its frame,
     line and captions, on-screen text, and the tools that make it. Durations are estimated.
     Show the page to the user (open it in your browser pane or file preview if you have one,
     else `open out/<slug>/plan.html`) and stop. For each change they ask for ("03: make it a
     BigNumber"), edit `script.json`, re-run `plan`, show it again. Voice and render nothing yet.
  3. When they approve: write any new scenes, then step 5 (Look gate; fix what you find
     yourself) without recording the voice: `stills` times every line that has none yet by
     estimate. A talking head runs `voice` first; it only cuts the take. Then
     `npm run plan -- <slug> --frames` and show it again: real stills, estimated durations.
     Stop. For each change: edit (a talking head: re-run `voice` if a `clip` changed),
     `npm run stills -- <slug> --shot=<id>` for every changed shot, then `plan --frames`.
  4. When they approve the frames: steps 3–4 (Voice, Pace gate), then steps 6–9 (Render, Motion
     gate, Caption, Hand over). If a gate makes you change an approved shot, re-run its still and
     `plan --frames` and show the user before you render.

## Workflow

Pick a short kebab-case slug for the reel (`why-planes-curve`). All its files live in
`public/reels/<slug>/`.

A reel stays out of the kit. While making one, write only to `public/reels/<slug>/`,
`out/<slug>/` and `src/scenes/local/`, all ignored by git. When a kit scene lacks something
this reel needs, write a local scene instead of changing the kit one. Change kit files (`src/`,
`scripts/`, `public/sfx/`, the docs) only when the user asks to improve the kit itself.

1. **Plan.** Write the script as 5–9 shots, one spoken line each, 20–45 s total. Follow the
   playbook below. Pick a scene for every shot.
2. **Write `public/reels/<slug>/script.json`.** Copy the shape of `public/reels/example/script.json`.
   `palette` is one of `clay`, `cobalt`, `forest`, `mono`; `style` is `flat` or `print`;
   `handle` is the user's @handle (ask once if you don't know it, then reuse it).
   `music` is a bed under the voice that dips while a line is spoken: `lofi`, `upbeat`, `chill`
   or `funk`, picked to fit the topic. Leave it out when the user says no music, will add
   Instagram audio themselves, or on a talking head whose take already has music or noise.
   When a shot is about a product (ChatGPT, Claude, Cursor…), follow the `brand-logos` skill
   (`.claude/skills/brand-logos/SKILL.md`) to fetch its current logo, and set the shot's `icon`.
3. **Voice.** `npm run voice -- <slug>`. Writes `voice.json` and one audio file per shot.
   Unchanged lines are cached, so re-run it after every edit to a `say` line, its delivery marks
   included (see **Delivery** in the playbook). Lines marked `~`
   have estimated word timing. With VoiceStudio, a reel in another language times captions better
   with `VOICESTUDIO_LANGUAGE` set (`de`, `es`, …).
4. **Pace gate.** `npm run check -- <slug>`. Fix every `FAIL` (usually by shortening or splitting
   a line) and re-run voice + check until it passes. Treat warnings as a nudge, not a rule.
5. **Look gate.** `npm run stills -- <slug>` renders one PNG per shot into `out/<slug>/stills/`,
   taken just before the cut when everything is on screen. Read every PNG and check:
   - text is big, fully inside the frame, nothing overlapping or clipped
   - the stage content and the captions don't collide
   - one clear focal point per shot; the shot reads in under a second
   - consecutive shots look different from each other

   Fix by editing `props`, picking another scene, or writing a new scene (below). Re-render a
   single shot with `--shot=03`. Repeat until every still passes.

6. **Render.** `npm run render -- <slug> --draft` for a fast half-size check if you changed a lot,
   then `npm run render -- <slug>` for the final `out/<slug>/<slug>.mp4`.
7. **Motion gate.** `npm run pace -- <slug>` watches the mp4 and lists every stretch where nothing
   on screen changes. Fix every `FAIL` (still over 1.2 s) with a pop, a cue, a zoom or a shorter
   shot, re-render, re-run. A warn in the first 2 s is worth fixing too: that's where people swipe.
8. **Caption.** Write `out/<slug>/caption.txt`: a 1–2 line post caption in the reel's language,
   a question or CTA, and 3–5 relevant hashtags.
9. **Hand over.** Tell the user the mp4, caption and `out/<slug>/cover.png` (the hook as a cover
   image to pick when posting) paths and how long the reel is. Mention
   `npm run studio` if they want to scrub through it in the browser (set `slug` in the props panel).

## Talking head

When the user gives you a video of themselves talking ("edit this", a path to a .mov/.mp4),
cut it into a reel instead of writing and voicing one.

1. **Transcribe.** `npm run transcribe -- <slug> <path/to/video>` makes `take.mp4` (30 fps, voice
   levelled to −14 LUFS, denoised when Homebrew ffmpeg is installed), `transcript.json` and
   `transcript.txt`. The video can live anywhere; only the take is copied into the reel.
   Read `transcript.txt`: one phrase per line with its times, `[um]`-style fillers, pauses, and
   gaps with unworded sound (usually a filler Whisper skipped).
2. **Find the face.** Extract a frame and look at it
   (`npx remotion ffmpeg -ss 2 -i public/reels/<slug>/take.mp4 -frames:v 1 out/<slug>/face.png`),
   then set `focus` to where the face is, 0–1 from left and top (default `[0.5, 0.4]`).
3. **Cut.** Write `script.json` with `"take": "take.mp4"`. Each shot plays one `clip: [in, out]`
   of the take (seconds) and has `say` = the words in it, spelled right (captions use it).
   - Keep the best take of every line; drop fillers, false starts, repeats and rambles. A clip
     may stop and start mid-sentence; the voice step tightens it to its first and last word.
   - Use the user's words; never write words they didn't say. Reorder only if it still makes
     sense. The hook is still shot one, the best ≤ 1.5 s line in the take.
   - `layout` frames each shot: `full` (face fills the frame), `punch` (zoomed in on the face),
     `split` (a scene on top, the face in a window below) or `graphic` (a scene fills the frame,
     the voice keeps going). Alternate them so no two face shots in a row share a framing; that
     hides the jump cut. Put a scene on roughly every second or third shot: a `BigNumber` when a
     number is said, a `List` for steps, a `Screenshot` of what they're talking about.
   - A scene on a `full` or `punch` shot is laid over the face on a paper veil (good for a Hook).
   - The style applies to the scenes and captions; there is no print host on a talking head.
4. Then run the normal workflow from **Voice** on: `npm run voice` cuts the clips (instant, no
   recording), `check`, `stills`, `render`, `pace`, caption. Re-run `voice` after changing a clip.

## Playbook

Writing

- The hook is shot one, said in ≤ 1.5 s (≤ 5 words). It states the payoff or a surprising claim.
  Never open with "Hey guys", "In this video" or a question you don't answer.
- One idea per shot. A shot's line is ≤ 12 words, ideally 5–9.
- Write for the ear: short words, active voice, no lists of more than 4.
- Spell numbers out in `say` ("one point two seconds") and show digits on screen (`1.2`).
- End on a CTA shot: one action (follow, comment a keyword, save).
- Facts must be true. If unsure, write it as opinion or leave it out.

Hooks

Pick a shape, fill it with the topic, keep it ≤ 5 words, and stage the shot after it as shown.

| shape         | pattern                       | example                    | next shot              |
| ------------- | ----------------------------- | -------------------------- | ---------------------- |
| result first  | My [thing] just [did X].      | My phone just wrote this.  | `Screenshot` of it     |
| the number    | [Number] [things] [do X].     | Nine in ten skip this.     | `BigNumber`            |
| free vs paid  | [Thing]: $[X]. Mine: free.    | Course: $400. Mine: free.  | `Compare`              |
| the annoyance | You paid. Still [annoying X]? | You paid. Still ads?       | the answer, `List`     |
| the warning   | Don't [act] before this.      | Don't upgrade before this. | `Statement` with why   |

- The payoff is in frame one: a result, a number, a thing doing something surprising. The `Hook`
  scene is readable from its first frame, and that frame is also the cover.
- First person, present tense when it's the user's own story: "My…", "I just…".
- A question hook is answered within the reel, by the shot right after it when possible.
- When Insights shows a high skip rate (over ~60 %), re-cut only the first 2 s, a new hook line
  and scene, and keep the body.
- Never re-post the same body: Instagram marks it as already shared. New voice, new visuals.

Delivery

A line read in one even breath sounds robotic. Give the voice rhythm with marks in `say`;
captions never show them, and VoiceStudio records each marked phrase on its own.

- `|` is a beat (0.3 s), `||` a long pause (0.7 s). Put one before a payoff or between two
  short punches: `It does not make energy. | It borrows it.`
- `*words*` are said heavy: slower and louder. Use it on the payoff, 1–3 words, at the end of a
  line or right after a `|`: `Every cup pulls focus | *from tomorrow.*` At most one per line.
  A single heavy word mid-sentence (`It *borrows* it.`) gets choppy; save that for a hard stop.
- A `||` at the end of a line holds the silence before the cut, so the line can land.
- Punctuation shapes the read too: `?` rises, `,` is a breath, `.` ends with a fall.
- Vary it across the reel: some lines plain, some with a beat, a few with a heavy payoff. The
  hook is usually plain and fast; the CTA plain.
- Never on a talking head: its pauses are the user's own.

Staging

- Never two of the same scene in a row (Statement is the only exception).
- Show less than you say: on-screen text is the keyword, not the sentence.
- Hook uses `"captions": false` because it already shows the words.
- Nothing sits still for more than 1.2 s: every scene already floats or drifts; new scenes must too.
- Keep content inside the stage. Instagram covers the top ~220 px, the bottom ~380 px and a
  ~150 px column on the right; the layout in `src/theme.ts` (`LAYOUT`) already respects that.

## Scenes

| scene       | use for                | props                                                                       |
| ----------- | ---------------------- | --------------------------------------------------------------------------- |
| `Hook`      | shot one               | `lines: string[]` (1–3 short lines), `highlight?: string`                   |
| `Statement` | one big idea on a card | `text` (≤ 8 words), `kicker?` (small tag), `icon?` (logo path)              |
| `Stamp`     | the payoff word, slammed down | `text` (1–3 words), `kicker?`, `cue?` (spoken word that slams it, default its first word; end the line with `||` when it's the last word, so it can land) |
| `ChatPrompt` | asking an AI something | `prompt` (typed in over the shot), `title?`, `kicker?`, `app?` (default "Chat"), `icon?` (logo path) |
| `BigNumber` | a stat that counts up  | `value: number`, `label`, `prefix?`, `suffix?`, `decimals?`, `locale?`      |
| `List`      | 2–4 steps or rules     | `title?`, `items`: strings or `{text, icon?}` (each pops in when its first word is spoken; a logo `icon` replaces the number) |
| `Compare`   | this vs that           | `left: {label, value}`, `right: {label, value}`, `winner?: "left"\|"right"` |
| `Meter`     | something building up  | `label`, `top?`, `bottom?` (scale ends), `level?` (0–1, default 0.9)        |
| `Swarm`     | one spawns many        | `title?`, `lead?` (centre label), `count?` (3–12) or `items` (strings or `{name, icon?}`), `cue?` (word that spawns them, default "swarm") |
| `Screenshot` | a real screen or photo | `src` (path under `public/`), `label?`, `focus?: [x, y]` (0–1, where to push in) |
| `CTA`       | last shot              | `text`, `button?` (default "Follow")                                        |

Every shot also takes `"captions": false` to hide the word-by-word captions, and `"zoom": "word"`:
the stage snaps in 6 % with a whip when that word is said. Use it on the payoff word of a shot
that would otherwise sit still, at most every few shots, or it stops landing.

`icon` is a path under `public/` to a product's logo, like `Screenshot`'s `src`:
`"reels/<slug>/icons/chatgpt.svg"`. The kit ships no logos; the `brand-logos` skill fetches the
current official one into the reel's `icons/` folder. Use one only when the shot is about that
product, and leave it out when no real logo is found. A black, white or grey SVG is redrawn in the
theme's colours; a coloured logo or PNG keeps its own.

### Writing a new scene

When no scene fits, make one rather than forcing a bad fit. Put it in
`src/scenes/local/<Name>.tsx` with `export const <Name>`: it loads by itself, git ignores it, and
it stays out of the kit. Don't register it in `src/scenes/index.ts`. Only when the user asks to
add it to the kit, move it to `src/scenes/`, register it there, give it a default pose in
`src/poses.ts`, and add it to the table above and to `README.md`. Build it from what's there:

- `useTheme()` for colours (`paper`, `ink`, `accent`, `card`) and the style's look:
  `theme.display` (headline font; pass `theme.displayWidth` to `fitText`), `theme.edge(px)`,
  `theme.shadow(depth)`, `theme.textShadow(depth)` and `theme.surface(fill)` for card fills.
  Never hardcode hex, outlines or shadows, or the scene breaks in the other style.
- `body` font from `src/fonts.ts`.
- `usePop(delay)`, `useFloat()`, `Card`, `Sfx`, `fitText()` and `cueFrames()` from
  `src/components/ui.tsx`.
- `<Logo src size tint?>` and `useMonoLogo(src)` from `src/components/Logo.tsx` for an `icon`
  prop: pass `tint` (a theme colour) only when `useMonoLogo` says the logo is mono.
- `<Sfx name at? volume? variant?>` plays a sound at a frame of the shot. Names (in
  `src/sound.ts`): `whoosh`, `whip` (fast punch-in), `swipe` (paper or card slide), `pop`,
  `click`, `key` (one keystroke), `blip`, `ding`, `impact` (something big lands), `riser`
  (`RISER_SECONDS` long, peaks at its end), `shutter`, `coin`, `success`. Every file is levelled
  the same, so `volume` is the mix: about 0.3 for a hit, 0.1–0.2 for repeats. Sounds with several
  takes vary by themselves; pass `variant={i}` to step through them. One sound per beat: the cut
  already has a whoosh, so don't add one at frame 0.
- `useShot()` gives `words` (with timings), `frames` and `say`, so you can time a beat to the
  moment a word is spoken: `cueFrames(shot.words, ["keyword"], fps, shot.frames)`.
- Animate with `useCurrentFrame()` + `spring` / `interpolate`. No CSS transitions or
  `setTimeout`: Remotion renders frame by frame.

Read `src/scenes/List.tsx` first; it uses most of these. Check a new scene in both styles.
Run `npm run typecheck` after.

## Files

- `src/Reel.tsx`: lays shots end to end, adds voice, captions, a whoosh and a wipe between shots
  (glitch bars in flat, a paper swipe and halftone dots in print), each shot's snap `zoom`, the
  music bed, handle, the print host, and on a talking head the take framed by each shot's
  `layout`.
- `src/theme.ts`: palettes, the two styles (`makeTheme`) and the safe-area `LAYOUT`.
- `src/components/`: `Background`, `Captions`, `Host` (print presenter), `Take` (your video),
  `Music` (the ducked music bed), `Logo` (draws a reel's fetched logo for `icon` props), `Cut`
  (the wipe at each cut), `Character` (the user's own cartoon host).
- `src/sound.ts`: the sound effect and music names (also used by the scripts).
- `src/scenes/`: the kit's scenes, registered in `index.ts`. `src/scenes/local/`: scenes for one
  reel, loaded by themselves, ignored by git.
- `src/timeline.ts`: joins `script.json` and `voice.json` into timed shots (also used by the scripts).
- `src/poses.ts`: the print host's poses and each scene's default (also used by `plan`).
- `src/components/Captions.tsx`: word-by-word captions.
- `scripts/`: `setup`, `doctor`, `transcribe`, `voice`, `host`, `check`, `plan`, `stills`, `render`,
  `pace`, `sfx` (downloads the CC0 sources, masters them into `public/sfx/` and `public/music/`,
  writes `public/sfx/CREDITS.md` and an audition page at `out/sfx/index.html`). To swap a sound,
  change its source in `scripts/sfx.mjs` and re-run it.
- `public/sfx/`, `public/music/`: the sounds and music beds, all CC0 (public domain); sources in
  `public/sfx/CREDITS.md`.
- `.claude/skills/brand-logos/`: how to fetch and check a product's current logo for a reel.
- `.claude/skills/cartoon-host/`: how to turn the user's photo into their own cartoon host.
- `public/host/`: the user's cartoon, one PNG per pose and `host.json`; ignored by git.
- `public/reels/`: one folder per reel. Only `example/` is in git; the user's reels stay local.
- `out/<slug>/`: one folder per reel with `<slug>.mp4`, `caption.txt`, `plan.html` and
  `stills/`. Safe to delete.
