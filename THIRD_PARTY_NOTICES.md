# Third-party components

The MIT license in LICENSE covers this kit's own code. It does not replace the licenses of
its dependencies, model weights, fonts, logos or media. This inventory is not legal advice
or a grant of rights to third-party assets.

| Component | Where / terms to review |
| --- | --- |
| Remotion and its packages | [Remotion license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md). Remotion has eligibility-based Free and Company licenses; do not assume this kit's MIT license covers your organization's Remotion use. Installed package notices apply to the locked version. |
| React, React DOM, TypeScript and other npm packages | See each installed package's LICENSE and package-lock.json for the exact dependency versions. |
| VoiceStudio | Installed separately, not committed here; [pinned source](https://github.com/debpalash/VoiceStudio/tree/e0451f1a9c0d4e9aaac82d8d849490b199c1557f). Review the LICENSE at that revision. Application terms and model terms are separate. |
| Kokoro / MLX-Audio | Default voice engine. Review upstream [Kokoro model card](https://huggingface.co/hexgrad/Kokoro-82M) and [MLX-Audio](https://github.com/Blaizzy/mlx-audio) notices for downloaded assets. |
| Alternative models, including OmniVoice | Review the exact model's terms before downloading or using it, especially for commercial work. The agent must not accept licenses for the user. The kit's current workflow treats OmniVoice as restricted; a different upstream release does not automatically change the pinned integration. |
| Anton, Bricolage Grotesque, Inter | Loaded through @remotion/google-fonts. See each family's license in [Google Fonts](https://github.com/google/fonts) (ofl/anton, ofl/bricolagegrotesque, ofl/inter). |
| Sound effects and music | Source URLs, authors and recorded CC0 terms are listed in [public/sfx/CREDITS.md](public/sfx/CREDITS.md). Preserve that provenance when distributing the assets; check source terms if replacing them. |
| Product logos | Not shipped. Downloaded per reel; copyright and trademark terms remain with their owners. |
| ElevenLabs / image services | Optional external services retain their own terms, account requirements and data policies. |

The shipped example includes generated voice audio so it can render without installing a
voice engine. Do not infer permission to clone a real person's voice from this example.
