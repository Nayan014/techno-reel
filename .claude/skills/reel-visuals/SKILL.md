---
name: reel-visuals
description: Rules and workflows for designing multidimensional thematic background artwork and high-converting cover posters for video reels.
---

# Reel Visuals: Thematic Backgrounds & Cover Posters

Every reel must have strong, purposeful visual direction that reflects the multidimensional nature of its topic, paired with a custom-designed cover poster for social distribution.

---

## Channel Visual Identity Standard

The canonical visual standard for the channel is **Flat Clay**:
- **Style**: `flat` (dot grid, bold typography, hard drop shadows).
- **Palette**: `clay`
  - Accent: `#C8643B` (warm terracotta)
  - Paper: `#F3EEE6` (warm off-white / sand)
  - Card: `#FFFCF7` (soft cream)
  - Ink: `#161412` (dark espresso black)

Use Flat Clay as the default baseline across all reels, cards, and covers to maintain cohesive channel branding.

---

## 1. Thematic Backgrounds

Avoid generic plain-paper backgrounds. Tie each reel's artwork directly to the topic's core facets (e.g. technology, spirituality, conflict/unchecked power).

### Workflow by Mode:
- **Plan Mode**:
  1. Identify the core facets of the topic.
  2. Generate a custom thematic background artwork matching the channel palette at `projects/<slug>/working/images/background.png` and set `"background": "images/background.png"` in `script.json`.
  3. Display the background concept directly in `plan.html` and present it to the user for review and approval alongside the storyboard before recording voice or rendering.
- **Auto Mode**:
  1. Identify the multidimensional themes from the prompt.
  2. Generate the background artwork automatically and apply it with the topic-matched palette.

### Asset Placement:
- Save backgrounds into `projects/<slug>/working/images/background.png`.
- Set `"background": "images/background.png"` at the top level of `script.json`. Remotion blends it seamlessly behind cards with a safe-zone readability gradient.
- Topic-specific SVG, AI-generated imagery, or code-drawn artwork is suitable.
- Keep the center of background artwork readable and balanced to avoid clashing with on-screen cards and captions.

---

## 2. Creative Cover Posters

Never use a raw video frame (frame 0) as the cover. High-performing social posts require a dedicated, creative poster that grabs attention.

### Cover Design Standards:
1. **Dimensions**: 1080×1920 (9:16 vertical).
2. **Instagram 1:1 Grid Safe Zone**:
   - The central 1080×1080 square (vertical range `y: 420` to `y: 1500`) is visible on the Instagram profile grid.
   - All essential elements (Headline and core Concept card) **must** sit inside this safe zone.
3. **Minimal Text & Clutter-Free**:
   - Keep cover posters clean, bold, and minimal. Avoid cluttering with unnecessary kicker tags, secondary taglines, or CTA buttons ("Full story inside", "Watch now").
   - **No Social Handles**: Do not include `@handle` inside the cover image; platforms already display the creator profile and handle alongside the post.
   - Keep the question visible, but do not reveal its answer on the cover. An optional short, intriguing hint can suggest the topic without giving away the payoff.
4. **Typography & High-Impact Styling**:
   - Use bold display typography (`display` / Anton or Bricolage) with clean contrast and subtle text lift.
   - Use multi-tone colored words or a single slanted badge card for maximum punch (e.g., `WHY` in white, `TECHNO` in cyber cyan, `RAVAN?` on an angled terracotta badge).
5. **Glassmorphism ("Glass View") Concept Card**:
   - For the supporting takeaway line, use a translucent frosted glass card (`background: rgba(255, 255, 255, 0.08)`, `backdropFilter: blur(24px)`, `border: 1.5px solid rgba(255, 255, 255, 0.22)`). This ensures high legibility while allowing the background artwork to remain visible and immersive.
6. **Export**:
   - Save the finalized cover image as `projects/<slug>/export/cover.png`.
   - Rendering the reel generates a frame-based cover, so regenerate the dedicated poster after each final video render and verify the final export.

## Initial review and export check

- Include the cover concept in the first visual review; do not wait for the creator to request
  an improved cover after export. The question, headline and artwork should communicate this reel’s
  specific topic, remain readable at thumbnail size and preserve curiosity without giving the answer.
- Topic-specific backgrounds should support the explanation with recognizable elements (for
  example AI servers and chat interfaces), while leaving a quiet area behind charts and captions.
- After each final render, inspect the actual `export/cover.png`: the renderer may overwrite a
  custom poster. Deliver the reviewed poster, with no social handle or unnecessary CTA badge.
