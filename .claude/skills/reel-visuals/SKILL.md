---
name: reel-visuals
description: Rules and workflows for designing multidimensional thematic background artwork and high-converting cover posters for video reels.
---

# Reel Visuals: Thematic Backgrounds & Cover Posters

Every reel must have strong, purposeful visual direction that reflects the multidimensional nature of its topic, paired with a custom-designed cover poster for social distribution.

---

## 1. Thematic Backgrounds

Avoid generic plain-paper backgrounds. Tie each reel's artwork directly to the topic's core facets (e.g. technology, spirituality, conflict/unchecked power).

### Workflow by Mode:
- **Plan Mode**:
  1. Identify all core thematic dimensions of the prompt.
  2. Generate **3 distinct background concepts** representing these dimensions.
  3. Present the 3 options to the user and request their choice before proceeding.
- **Auto Mode**:
  1. Identify the multidimensional themes from the prompt.
  2. Propose the background visual direction and confirm with the user before finalizing the render.

### Asset Placement:
- Save backgrounds into `projects/<slug>/working/images/background.png`.
- Reference in `script.json` as `"background": "images/background.png"`.
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
