---
name: brand-logos
description: Fetch the official, current logo of a product or company a reel shows (ChatGPT, Claude, Gemini, Copilot, Grok, Cursor…) into public/reels/<slug>/icons/ and point a scene's `icon` at it. Use while making a reel whenever a shot is about a product, app or brand.
---

# Brand logos

A shot about a product shows that product's real, current logo. The kit stores no logos: fetch
them for each reel into `public/reels/<slug>/icons/`, which git ignores. Logos are their owners'
trademarks, shown here editorially in a reel about that product: use them as published, and never
copy them into the kit or commit them.

## 1. Name the mark

For each product a shot names, decide whose logo it is, and take the symbol, not the wordmark.

- ChatGPT uses OpenAI's mark. Codex has its own.
- Claude is not Anthropic: Claude is the orange spark, Anthropic the "A\" mark.
- GitHub Copilot is not Microsoft Copilot. Grok, xAI and X are three marks.

Name the file after the product the shot says: `chatgpt.svg`, `claude.svg`.

## 2. Fetch it, best source first

Stop at the first source that has the current mark.

1. **svgl**: curated, current, in colour, often with the company's `brandUrl`.
   ```bash
   curl -s "https://api.svgl.app?search=openai"
   ```
   `route` is a URL or `{ "light", "dark" }`. Take `light`: dark ink, made for light cards.
   ```bash
   mkdir -p public/reels/<slug>/icons
   curl -sfL -o public/reels/<slug>/icons/chatgpt.svg https://svgl.app/library/openai.svg
   ```
2. **The company's brand or press page** (svgl's `brandUrl`, or search "<brand> brand assets"):
   the authority when svgl lacks the brand or you doubt its file is current. Kits often come as
   ZIPs: unzip in the scratchpad and copy only the symbol's SVG.
3. **Iconify, `logos` set only**: `https://api.iconify.design/logos/<name>.svg`; find names with
   `curl -s "https://api.iconify.design/search?query=<brand>&prefix=logos"`. Other Iconify sets are
   lookalikes: a search for "gemini" also returns the zodiac sign.
4. **Simple Icons**: `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/<slug>.svg`. One colour
   only, can lag a redesign (its Gemini is the pre-2025 spark) and drops brands on request (no
   OpenAI, no xAI).
5. **PNG, last resort**: the product site's own `apple-touch-icon.png` (see its `<head>`), saved as
   `<name>.png`.

svgl had these in October 2026. Brands redesign, so search again rather than trust the table:

| product          | search      | light file           |
| ---------------- | ----------- | -------------------- |
| ChatGPT, OpenAI  | `openai`    | `openai.svg`         |
| Codex            | `codex`     | `codex_light.svg`    |
| Claude           | `claude`    | `claude-ai-icon.svg` |
| Anthropic        | `anthropic` | `anthropic_black.svg`|
| Gemini           | `gemini`    | `gemini.svg`         |
| GitHub Copilot   | `copilot`   | `copilot.svg`        |
| Grok             | `grok`      | `grok-light.svg`     |
| xAI              | `xai`       | `xai_light.svg`      |
| Cursor           | `cursor`    | `cursor_light.svg`   |

## 3. Check it

- It is an image, not an error page: `head -c 200 <file>` starts with `<svg` or `<?xml` (for a
  PNG, `file <file>` says PNG image). Otherwise delete it.
- It draws on its own: `grep -E '<script|<foreignObject|href="http' <file>` finds nothing (none of
  these render inside an image). Otherwise delete it and try the next source.
- Look at it:
  ```bash
  qlmanage -t -s 512 -o out/<slug>/icons public/reels/<slug>/icons/<name>.svg
  ```
  and read `out/<slug>/icons/<name>.svg.png` (a file with `width="1em"` previews tiny but draws
  full size in the reel). It must be the product's mark as its own site and
  app show it today: the right product, the latest design, the symbol and not the wordmark, not
  cropped. Unsure? Open the product's site or its favicon and compare.

## 4. Use it

Set `"icon": "reels/<slug>/icons/<name>.svg"` on a `Statement`, a `ChatPrompt`, or a `List` or
`Swarm` item. A black, white or grey logo is redrawn in the reel's ink or card colour; a coloured
logo keeps its colours. The Look gate (`npm run stills`) shows it in place: check that it is sharp
and readable.

## Nothing found

If no source has the current mark, or you can't confirm a file is the right one, leave `icon` out:
the scene shows the app's initial, the number or a bot instead. Never use a lookalike, a generic
icon, an older version or a logo drawn from memory.
