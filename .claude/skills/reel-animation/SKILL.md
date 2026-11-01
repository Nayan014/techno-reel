---
name: reel-animation
description: Engineering and visual quality standards for typography animations, graphics, sound mixing, transitions, and framing.
---

# Reel Animation & Quality Standards

These standards govern animation rendering, component staging, and audio-visual consistency across all kit scenes.

---

## 1. Typography & Motion
- **Highlighted Words**: Animate a highlighted word once per intended beat. Avoid double landings, redundant pop springs, or secondary bounces unless explicitly requested.
- **Hook beats**: The Hook scene lands each word once. Do not add a second payoff hit or a shot-level zoom to the Hook; inspect the opening at playback speed for repeated movement and sound.
- **Motion Verification**: Inspect the hook and each shot at full playback speed and frame-by-frame. No element should sit completely still for more than 1.2 s.
- **Pacing**: Follow the Motion Gate (`npm run pace -- <slug>`). Stretches over 1.2 s fail; the opening 2 s must maintain constant visual engagement.

---

## 2. Graphic Elements & Sequencing
- **Progressive Disclosure**: In flows, sequences, or multi-step lists, reveal each connecting arrow or step only after its source is visible, timed to the spoken transition. Never show the full completed path before it is explained.
- **Accuracy**: Any contextual graphics (e.g., clock hands) must match the displayed or spoken values.

---

## 3. Transitions & Cuts
- **Clean Shot Cuts**: Keep cuts crisp and intentional. Avoid flickering, glitch overlays, or jarring jump artifacts between consecutive shots.
- **Scene Alternation**: Never use two identical scenes consecutively (with the single exception of `Statement`).

---

## 4. Audio Mixing & Voice
- **Music Ducking**: Keep the background music bed comfortably ducked below spoken audio throughout the reel so narration is clear and intelligible.
- **Voice Engine**: Default to VoiceStudio (`mlx-audio`, Kokoro/OmniVoice). Never use obsolete or paid external voice providers for new reels.

---

## 5. Framing & Handles
- **Handle Display**: Hide the social handle component completely when none is supplied; do not leave empty badges or placeholder gaps.
- **Safe Area**: Respect the Instagram interface boundaries (top ~220 px, bottom ~380 px, right ~150 px).
