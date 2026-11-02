[← Getting started](../README.md)

# Under the hood

The assistant has no hidden powers: every step it takes is a plain npm script you can run,
read and change yourself. No AI needed.

### Make a reel by hand

```bash
npm run project -- my-reel
cp examples/example/script.json projects/my-reel/working/
# edit projects/my-reel/working/script.json
npm run voice -- my-reel
npm run check -- my-reel
npm run stills -- my-reel
npm run render -- my-reel
npm run pace -- my-reel
```

Inspect every still before rendering, fix any failed timing or motion checks, and write
`projects/my-reel/export/caption.txt` for the post caption.

A reel is one `script.json`: a few top-level choices and one entry per shot.

```json
{
  "title": "You have 1.5 seconds",
  "style": "print",
  "palette": "clay",
  "handle": "@yourhandle",
  "music": "upbeat",
  "shots": [
    {
      "id": "01",
      "say": "You have | *one and a half seconds.*",
      "scene": "Hook",
      "captions": false,
      "props": { "lines": ["You have", "1.5 seconds"], "highlight": "1.5" }
    }
  ]
}
```

- `style`: `flat` or `print` · `palette`: `clay`, `cobalt`, `forest`, `mono` ·
  `music`: `lofi`, `upbeat`, `chill`, `funk`, or leave it out.
- `say` is spoken and captioned. `|` adds a beat, `||` a long pause, `*words*` are said heavy.
- `scene` is one of `Hook`, `Statement`, `Stamp`, `ChatPrompt`, `BigNumber`, `List`, `Compare`,
  `Meter`, `Swarm`, `Screenshot`, `CTA`. Their props are in the
  [scene reference](../CLAUDE.md#scenes).
- Talking heads add `"take": "take.mp4"`, and each shot a `clip: [in, out]` and a `layout`.

### Every command

| Command | What it does |
| --- | --- |
| `npm run project -- <slug>` | Create `projects/<slug>/` |
| `npm run voice -- <slug>` | Record every line (unchanged lines are cached) and time its words |
| `npm run check -- <slug>` | Pace gate: hook length, words per second, reel length. Renders nothing |
| `npm run plan -- <slug> [--frames]` | Storyboard page at `preview/plan.html`; `--frames` adds real stills |
| `npm run stills -- <slug> [--shot=03]` | One PNG per shot, taken just before its cut |
| `npm run render -- <slug> [--draft]` | Final MP4 and cover; `--draft` is half size and fast |
| `npm run pace -- <slug> [--draft]` | Motion gate: flags anything still for over 1.2 s |
| `npm run studio -- <slug>` | Scrub and inspect the reel in Remotion Studio |
| `npm run dashboard` | Local project overview at `127.0.0.1:4173`, with an open-folder shortcut |
| `npm run transcribe -- <slug> <video>` | Talking head: level, denoise and transcribe your recording |
| `npm run host -- <sheet.png>` | Cut a cartoon pose sheet into your presenter |
| `npm run sfx` | Re-download and master the sound effects and music |
| `npm run doctor [-- --render-only]` | Check the setup and say how to fix what's missing |
| `npm test` · `npm run typecheck [-- <slug>]` | Kit tests; TypeScript for the kit and a reel's custom scenes |

### Make it yours

| To change | Edit |
| --- | --- |
| Voice and engine for new projects | Dashboard Settings |
| Advanced voice connection, speed, language and keys | `.env` (see [.env.example](../.env.example)) |
| Colours, styles, Instagram safe area | `src/theme.ts` |
| A scene just for one reel | `projects/<slug>/working/scenes/<Name>.tsx`; it loads by itself |
| The kit's scenes | `src/scenes/`, registered in `src/scenes/index.ts` |
| Captions, cuts, music bed, presenter | `src/components/` |
| Sound effects and music | the sources in `scripts/sfx.mjs`, then `npm run sfx` |
| How the assistant works | [CLAUDE.md](../CLAUDE.md); Codex, Cursor and Gemini read it via `AGENTS.md` and `GEMINI.md` |

New scenes build on the same helpers as the kit's: start from `src/scenes/List.tsx` and the
[scene guide](../CLAUDE.md#writing-a-new-scene). Check them in both styles with
`npm run stills`, and with `npm run typecheck -- <slug>`.
