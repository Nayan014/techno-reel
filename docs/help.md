[← Getting started](../README.md)

# Help and reference

Start with `npm run doctor` (or `npm run doctor -- --render-only` for rendering alone). Common fixes:

- **Node too old:** install Node 24 LTS (`brew install node` or `nvm install`), then rerun setup.
- **VoiceStudio won't start:** read the end of `.local/logs/voicestudio.log`. Another process on
  port 3900 (`lsof -i :3900`) blocks it; stop that, then run `npm run doctor`.
- **Intel Mac:** local MLX voice needs Apple Silicon. See the platform limits under
  [legacy voice providers](voice.md#legacy-voice-providers). Linux and Windows are untested.
- **A download failed:** check your connection and rerun `npm run setup`; it skips what's
  done and resumes the rest.

- [Workflow and scene reference](../CLAUDE.md) — production steps, validation gates, scene props and custom scenes.
- [Contributing](../CONTRIBUTING.md) — development, bug reports and dependency notes.
- [Release checks](release-check.md) — validation results and platform limits.
- [Security](../SECURITY.md) — sensitive reports.

**Upgrading an older installation?** Run `npm run migrate` to preview, then
`npm run migrate -- --apply` to copy projects into the new layout. Originals stay intact.
`npm run migrate -- --rollback` removes unchanged copies. Legacy custom scenes need manual
assignment to `working/scenes/` and updated relative imports.
