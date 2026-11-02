---
name: reel-publishing
description: Prepare and execute direct local publishing of completed reels to Instagram and YouTube.
---

Read `docs/publishing.md` before publishing. Keep creation Auto/Plan modes independent of publication. A request to make a reel does not authorize posting it. Prepare the exact plan and preview before seeking approval unless the user has already authorized that concrete publishing scope. Never execute uploads during setup, tests or previews.

Use `npm run publish -- init <slug>`, review the ignored project `publish.json`, preview, then enqueue. Execute with `npm run publish -- run --execute` only within the user's publishing authorization. Review platform captions, destination, time, privacy, audience and synthetic-media disclosure. Do not infer disclosure settings from defaults. Preserve all normal reel validation and visual review gates.

Store credentials only in ignored `.env` or the process environment; downloaded credentials go under `.local/publishing/`. Never print tokens, raw provider responses or upload-session URLs. Never force-add project or local publishing data to Git. No TikTok direct uploader: its personal-utility restrictions apply.

Use status and existing queue state for retries. Never discard an uncertain remote publishing result to force a fresh upload. Finished targets are skipped. Scheduling requires the local computer awake, online and invoking the worker.
