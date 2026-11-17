# LaserVision & ZEISS Vision Center: standing rules

Read before any work in this repo. These are Luna's decisions; don't re-ask them.

## On-screen design (reels, carousels, end cards, covers)
- **Never write the word "WhatsApp" on screen.** Use the WhatsApp **icon** (`reels/src/components/WhatsAppIcon.tsx`) followed by the number.
  - LaserVision: **+961 81 54 20 20** · ZVC: **81 47 20 20**
- **LaserVision colors:** from its brand guidelines, colors only (`brand/laservision/GUIDELINES.md`). Nothing else from that PDF applies.
- **ZVC:** the store name "ZEISS Vision Center" is fine; never the blue ZEISS block logo. Use the "by Laser Vision" wordmark (`brand/zeiss/`).
- **Carousels:** English only, font Outfit, house style in `references/laservision/CAROUSEL_STYLE.md`.
- **Reels:** Arabic subtitles on both accounts. **Editing settings (font, caption template, glow color, transitions, SFX): `brand/Video_Editing_Guide.pdf`. Read it before any reel edit.** Montserrat Arabic Bold, word-by-word fade, glow 30/58 in #005d83 (LaserVision) / #0c188d (ZVC). LaserVision house style in `references/laservision/REEL_STYLE.md`.
- **Reel B-roll and overlays:** B-roll sparingly, only where it shows what's said; no zoom-ins. Pop-up overlays go UNDER the captions.
- **Every reel ships with a cover and a post caption** (Luna, 17 Nov), both brands, without being asked:
  - Cover: `covers/<brand>/<topic>/cover.png` (+ `cover.html`, `bg.jpg`). LaserVision sticker style as in `covers/laservision/dry-eye-test-RIB_0074/`.
  - Post caption: `reels/post-captions/<topic>.md`, the brand's formula, ending with "WhatsApp:" + the number and hashtags (the word is fine in post text, never on screen). Also paste it in the reply.

## Content
- Rules for what each brand says and never says: `strategy/SUMMARY.md`.
- Project status and decisions: `PROJECT_BRIEF.md`.
