# Release validation — 2026-10-30

Completed locally on Apple Silicon macOS, Node 24.18.0:

- Exported tracked and pending release files to a separate directory, excluding ignored
  settings, dependencies, voice installation, hosts and user reels.
- Ran render-only setup with a fresh dependency install and Chrome download.
- Ran nine isolated setup/doctor regression tests, TypeScript and the example pace/structure check.
- Rendered the supplied example as a half-size draft. Voice generation was not required.
- Started Studio and received HTTP 200 from its local server, then stopped the server.
- npm audit reported zero vulnerabilities after overriding Zod to 4.6.6.
- Scanned reachable Git history objects for selected credential patterns and private-key headers;
  no remaining matches after inspecting false positives in empty example settings. This is a
  targeted pattern check, not a comprehensive security audit or dedicated secret-scanner run.
- No .env or custom-host files appeared in the inspected tracked history; .env.example is public.

Known limits:

- Full VoiceStudio installation/synthesis was not rerun; provider orchestration is covered by
  isolated tests. No model license was accepted and no paid API was used.
- Windows, Linux, Intel macOS and Node 22.18 have not been validated locally. CI includes
  Node 22.18 and 24 on macOS; its first GitHub run remains pending.
- Studio prints an expected Zod mismatch warning while Remotion pins the affected version.
  The override is documented in CONTRIBUTING.md. Startup and rendering were checked, not every
  interactive Studio feature.
- THIRD_PARTY_NOTICES.md inventories licenses and provenance; it is not a complete legal review
  of every dependency, media source or downloaded model.
- The sample's existing fast-speech and placeholder-handle warnings remain; its check passes.

Before public launch, enable GitHub private vulnerability reporting and available secret
scanning/push protection in repository settings, review the first CI run, and follow up on
any platform or license review required for your intended audience.
