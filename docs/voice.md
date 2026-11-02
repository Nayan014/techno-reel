[← Getting started](../README.md)

# Voice: text-to-speech and cloning

### Text-to-speech

The default is **Kokoro / af_heart**, running locally through VoiceStudio on Apple Silicon.
It starts automatically when needed. Write a script, and the workflow generates speech and
word timings for captions. No voice cloning is needed to get started.

Choose the voice engine and voice name in dashboard Settings before creating a project.
For projects created before settings were saved, the `.env` voice configuration still applies.

Ask for delivery changes in chat: `Pause before the payoff in shot 3` or
`Say the last two words more slowly`. Delivery marks stay out of the captions.

### Voice cloning and other languages

The default Kokoro setup does **not** clone voices or support German. The repository's
VoiceStudio integration also supports **OmniVoice**, which adds those capabilities.

1. Set up OmniVoice in VoiceStudio and personally review and accept its **non-commercial licence**.
2. Create a saved voice profile in VoiceStudio using your reference recording.
3. In dashboard Settings, choose OmniVoice and enter the saved profile name or ID before creating a project. Set `VOICESTUDIO_LANGUAGE=de` in `.env` for German caption timing, or use the relevant language code.

Use the language code for your reel; `de` is the German example. Model setup and licence
acceptance happen in VoiceStudio. Ask your assistant for help with your installation.

### Legacy voice providers

The dashboard offers VoiceStudio only for new projects. Older CLI integrations remain for compatibility. Setup and doctor still use `VOICE_PROVIDER` in `.env` to determine which installation to check. Setup creates `.env` on its first run, or copy it yourself: `cp .env.example .env`.

| Provider | What you need |
| --- | --- |
| **VoiceStudio** (default) | Apple Silicon for local MLX voice. Full setup installs it. |
| **ElevenLabs** | `VOICE_PROVIDER=elevenlabs`, `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`. Paid cloud service. |
| **macOS say** | `VOICE_PROVIDER=say`. Built-in voice with estimated caption timing. |

Providers never switch automatically. Intel Macs need an alternative to local MLX voice;
the full Windows/Linux workflow is unverified. See [.env.example](../.env.example) for all settings.
