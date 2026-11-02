# Direct local publishing

Publish a completed reel to YouTube and Instagram from your computer. No scheduler subscription or public video hosting is needed. TikTok is excluded: its Direct Post guidelines do not accept utilities limited to accounts you or your team manage.

Rendering never uploads anything. The dashboard does not accept publishing credentials. These commands are local CLI operations, separate from Auto/Plan video creation.

## Credentials and the public repository

Copy the blank publishing variables from `.env.example` to your ignored `.env`, or supply them through the process environment. Never paste tokens into chat, screenshots, source code, issue reports, or command arguments. Use `chmod 600 .env`. The repository ignores `.env`, `.env.*`, `.local/`, and `projects/`.

Queue files and publishing plans use owner-only file permissions. Queue files can include sensitive resumable-upload URLs. Do not share them. Credentials are read only at execution and are not copied into queue items. HTTP error bodies and network causes are not printed because they can contain secrets. Git ignore rules do not protect files already tracked: review `git diff --cached` before pushing. If a credential leaks, revoke it at the provider; deleting it from the latest commit is insufficient.

Do not put downloaded OAuth client JSON in the repository root. Store it in `.local/publishing/`, which is ignored. There is no shared developer app or bundled account: each user creates and authorizes their own app.

## YouTube setup

1. Create a Google Cloud project and enable YouTube Data API v3.
2. Configure OAuth consent and create an OAuth client suitable for your authorization tool. If the consent app is in testing, add yourself as a test user. Testing-mode refresh tokens can expire; use Google's current publishing/verification guidance for persistent access.
3. Authorize your own channel with `https://www.googleapis.com/auth/youtube.upload` and offline access. Use a trusted local OAuth client or Google's OAuth Playground with **your own OAuth credentials** and its registered redirect URI. Obtain a refresh token; an API key alone cannot upload videos.
4. Set `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, and `YOUTUBE_REFRESH_TOKEN` in `.env`. Revoke access through your Google account when disconnecting, then remove the local values.

The uploader refreshes access tokens when running. No OAuth web server is included in this first version. The current insert documentation says unverified API projects are not restricted to private uploads, but consent, quota, account restrictions and platform policy still apply. Upload acceptance is recorded as `uploaded`, not a guarantee that processing finished or that the video is publicly available. Check YouTube Studio for processing, claims, or restrictions. Vertical reels can qualify as Shorts under YouTube's current rules; there is no separate Shorts upload endpoint.

## Instagram setup

Use **Facebook Login for Business**, not the Instagram Login route: direct local-byte upload uses Meta's resumable-upload endpoint.

1. Create your Meta developer app and configure Facebook Login for Business and Instagram API access.
2. Link a professional Instagram Business/Creator account to a Facebook Page. Configure app roles/access for your own account; broader use may require App Review and Advanced Access.
3. Obtain an appropriate Page access token with `instagram_basic`, `instagram_content_publish`, and `pages_read_engagement`; account discovery may also require `pages_show_list`.
4. Set `INSTAGRAM_ACCOUNT_ID` to the Instagram professional account ID (not the Page ID), `INSTAGRAM_ACCESS_TOKEN` to the authorized token, and `META_GRAPH_VERSION` to a currently supported version enabled for your app, such as `v25.0` if supported. No version is silently selected.

Token renewal is manual in this version. When Meta expires or revokes the token, replace it locally. The uploader creates a Reel container, streams the MP4 to Meta, waits for processing and publishes it. It uses the first video frame as the cover. Uploading the separate cover PNG and adding platform music are outside this version.

## Review, queue, publish

The project must be marked `exported`, with a current final export fingerprint and passing current `check` and `pace` gates. Complete the normal visual review too. Drafts are not accepted.

```sh
npm run publish -- init my-reel
```

Edit `projects/my-reel/publish.json`. Choose `platforms` (`youtube`, `instagram`, or both), review each caption, and explicitly review YouTube `privacy`, `madeForKids`, and `containsSyntheticMedia`. Defaults are private, not made for kids, and no synthetic-media disclosure; these are editable settings, not an assessment of your content. Set the disclosures according to your actual video. Set `at` to `null` for the next execution or an ISO timestamp with a timezone, e.g. `2026-12-01T18:00:00+01:00`.

```sh
npm run publish -- preview my-reel
npm run publish -- enqueue my-reel
npm run publish -- status
npm run publish -- run
npm run publish -- run --execute
```

Preview and enqueue never contact social platforms. `run` previews due work. **`run --execute` uploads due queued work and publishes to Instagram or uses the selected YouTube privacy.** Only execute after approving the exact video and plan. The queue snapshots text and settings; later edits to `publish.json` do not change an existing job. A changed MP4 or outdated project blocks execution.

The local worker runs once and exits. To automate timing, call `npm run publish -- run --execute` periodically through your operating system's scheduler, with this repository as the working directory and the correct Node executable. Your computer must be awake and online. Jobs run on the first invocation after their due time; there is no exact-time or cloud scheduling guarantee.

```sh
npm run publish -- cancel JOB_ID_FROM_STATUS
```

Cancellation stops future local work, not an already accepted upload or remote post. Review remote results before replacing cancelled jobs. Queue records deliberately prevent posting the same file to overlapping platforms twice, even if the caption or schedule changes.

## Interruptions and retries

Run the worker again after fixing credentials or connectivity. Finished targets are skipped. YouTube stores its resumable session and queries its offset before resending bytes, including recovering a completed upload after a lost response. Expired sessions require manual inspection in Studio before replacing the job. Instagram retains its container and upload state. A publish attempt with an uncertain response is blocked from automatic repetition; a subsequent run can recognize a `PUBLISHED` container. Otherwise inspect the profile and container before deciding how to recover. Do not delete queue state just to clear an error.

A lock prevents concurrent queue mutations. If the worker crashes, first confirm no publishing process remains, then remove `.local/publishing/worker.lock`. No automatic stale-lock removal is attempted.

## Official references

- [YouTube videos.insert](https://developers.google.com/youtube/data/reference/rest/v3/videos/insert)
- [YouTube resumable uploads](https://developers.google.com/youtube/data/guides/using_resumable_upload_protocol)
- [Google OAuth for installed applications](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Meta's local-file Reel publishing sample](https://github.com/fbsamples/reels_publishing_apis/tree/main/insta_reels_publishing_api_sample)
- [Meta Instagram API collection and permissions](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api)
- [TikTok Direct Post restrictions](https://developers.tiktok.com/docs/en/content-sharing-guidelines)
