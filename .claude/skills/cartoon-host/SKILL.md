---
name: cartoon-host
description: Turn the user's photo into their own cartoon presenter for every reel. They make one image of 8 poses with an image AI, `npm run host` cuts it out into public/host/, and you place each pose's mouth so it lip-syncs. Use when the user wants a host or character that looks like them, their own avatar, mascot or cartoon in the reels.
---

# Your own cartoon host

A reel with `"host": "character"` in `script.json` is presented by the user's own cartoon instead
of the paper host, in either style. It stands bottom left, pops into a new pose on every shot
and lip-syncs to the voice. It's set up once and reused by every reel. It lives in `public/host/`,
which git ignores: it's the user's face, so it never goes into the kit or a commit.

## 1. The user makes the picture

You don't generate it, and you don't upload their photo anywhere. Ask them to:

1. Pick one clear, front-facing photo of themselves: good light, face fully visible.
2. Open an image AI that takes a reference photo (Canva's AI image, ChatGPT, Gemini, …), upload
   the photo and paste the prompt below.
3. Save the full-size result into this folder and tell you its name.

```text
Turn the person in the reference photo into a cartoon presenter: thick black ink outlines, flat
cel shading with two tones of skin, a plain single-colour top with no logo or text. The same
face, hair and clothes in every pose, so it is clearly one character.

One image, a grid of 4 columns and 2 rows: 8 equal cells. In every cell the character is seen
from the waist up, centred, facing the viewer, with room around the hands.
Top row, left to right:
1) relaxed, arms down, friendly
2) pointing with one hand towards the right edge of the picture
3) one open palm held out to the right, presenting something
4) thinking, hand on chin, eyes up
Bottom row, left to right:
5) shrugging, both palms up
6) shocked, hands on cheeks, eyebrows high
7) cheering, both fists raised
8) waving with one hand

The mouth is closed in a small neutral smile in every cell. Every cell's background is one solid
flat pure magenta (#FF00FF), edge to edge: no gradient, shadow, floor, text, numbers or borders.
Nothing on the character is pink, magenta or purple.
```

Why it's written that way: magenta appears nowhere on a person, so it keys out cleanly; the mouth
is closed because the reel draws the talking mouth over it; one image keeps one face; the right
edge is where the stage is, since the host stands bottom left.

## 2. Cut it out

```bash
npm run host -- <sheet.png>
```

Look at the sheet first. If the poses come in another order, name them as they appear, left to
right, top to bottom: `--order=idle,point,present,think,shrug,shock,cheer,wave` (those are the
cells 1–8 above). This writes `public/host/<pose>.png`, `public/host/host.json` and
`out/host/check.png`.

If one pose came out wrong, have the image AI redo only that one (the sheet as the reference, the
same magenta), then replace just it: `npm run host -- <that.png> --pose=shock`.

## 3. Place the mouths

Read `out/host/check.png`: every pose side by side on grey, with a red bar where `host.json` puts
its mouth. Read each `public/host/<pose>.png` too, and set in `public/host/host.json`:

- `"mouth"`: for each pose, the centre of its closed mouth, `[x, y]` as 0–1 of the image from the
  left and the top.
- `"mouthWidth"`: the mouth's width as a share of the image's width (one value for all poses).

Run `npm run host` (no image) to redraw the check, and repeat until every bar sits on its mouth,
as wide as it.

Also check the cut-out: no magenta fringe, nothing of the character keyed away. A pink fringe on
a JPEG: re-run with a wider key, `--key=0.4`. Holes in the character: something on it was too
close to magenta, so ask the image AI again without it.

## 4. Use it

Set `"host": "character"` in a reel's `script.json`; `pose` per shot works as with the paper host.
Run `npm run check -- <slug>` (it fails if a pose is missing), then `npm run stills -- <slug>`
and look at the host in every still: inside the frame, clear of the captions, mouth in place.
