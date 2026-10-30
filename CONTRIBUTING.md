# Contributing

Use Node 24 LTS (or Node ≥22.18). Apple Silicon macOS is the primary supported environment.

```sh
npm run setup -- --render-only
npm test
npm run typecheck
npm run check -- example
npm run render -- example --draft
```

The render-only path does not need a voice model or cloud credentials. To test voice, configure
your own `.env` and run full setup. Never commit credentials, personal recordings or model files.

For kit changes, keep the patch focused and include a reproduction and validation results in
your pull request. Add regression tests for behavior fixes. Check visual changes with stills
in both flat and print styles; inspect the actual images. Follow `CLAUDE.md` for reel workflows.
Changes to the kit belong in tracked source; one-off reels and local scenes remain ignored.

CI installs locked packages, runs tests and TypeScript, checks the example, renders an example
draft and uploads it for review. It does not verify voice synthesis or claim Windows support.

Before reporting a bug, check existing issues. Include your OS/architecture, Node version,
command, expected behavior and sanitized error output. A minimal script is useful; private
recordings and `.env` files are not. Use the private reporting route in SECURITY.md for secrets
or vulnerabilities. Contributions to the kit are under its MIT license; preserve third-party notices.

Dependency note: package.json overrides Zod to 4.6.6 for
[GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). Remotion currently
pins an affected version. Revisit the override when upstream adopts a patched release; validate
TypeScript, the example render and Studio after any change.
Studio currently prints a Zod version-mismatch warning because of this security override.
The example render and Studio HTTP startup were verified with 4.6.6; this is not a guarantee
for every Studio feature. Do not revert to the affected version just to silence the warning.
