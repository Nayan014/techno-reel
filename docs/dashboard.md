[← Getting started](../README.md)

# Review your projects

```bash
npm run dashboard
```

Open [the local dashboard](http://127.0.0.1:4173) to browse storyboards, stills, videos,
captions and saved checks. It refreshes every five seconds and flags outdated outputs.
**Production, feedback and approvals happen in your AI chat.**

```text
projects/<slug>/
  raw/          Untouched source recordings
  working/      Script, voice, assets and custom scenes
  preview/      Storyboard, stills and draft
  export/       <slug>.mp4, cover.png and caption.txt
```

### Set defaults for new reels

Open **Settings** in the dashboard to choose your presenter, voice, style, palette,
music and social handle. Leave style and palette on **Auto** to let the assistant choose
for each topic. You can override these choices in any reel.

Settings are saved locally in `.local/video-settings.json` and copied into each new
project. Existing projects keep their settings. Keys and advanced voice settings stay
in `.env` (see [.env.example](../.env.example)).

You can also upload an avatar reference, preview your prepared presenter and audition
installed voices. A reference photo needs the [cartoon-host setup](avatar.md)
before it can animate. Voice model downloads are available in Settings; review any
required licence in VoiceStudio first.
