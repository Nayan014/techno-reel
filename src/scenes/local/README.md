# Scenes for one reel

A scene written for a single reel goes here, not in `src/scenes/`. Git ignores this folder
(except this file), so one-off scenes stay on your Mac and never show up as changes to push.

- One file per scene: `<Name>.tsx` exporting `export const <Name>`.
- It loads by itself; don't add it to `src/scenes/index.ts`.
- Its name can't be one the kit already uses.

To turn one into a kit scene everyone gets, move it to `src/scenes/`, register it in
`src/scenes/index.ts`, give it a default pose in `src/poses.ts`, and list it in `CLAUDE.md` and
`README.md`.
