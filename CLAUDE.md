# LaserVision & ZEISS Vision Center: standing rules

Read before any work in this repo. These are Luna's decisions; don't re-ask them.

## On-screen design (reels, carousels, end cards, covers)
- **Never write the word "WhatsApp" on screen.** Use the WhatsApp **icon** (`reels/src/components/WhatsAppIcon.tsx`) followed by the number.
  - LaserVision: **+961 81 54 20 20** · ZVC: **81 47 20 20**
- **LaserVision colors:** from its brand guidelines, colors only (`brand/laservision/GUIDELINES.md`). Nothing else from that PDF applies.
- **ZVC:** the store name "ZEISS Vision Center" is fine; never the blue ZEISS block logo. Use the "by Laser Vision" wordmark (`brand/zeiss/`).
- **Carousels:** English only, font Outfit, house style in `references/laservision/CAROUSEL_STYLE.md`.
- **Reels:** Arabic subtitles on both accounts. LaserVision house style in `references/laservision/REEL_STYLE.md`.
- **Video editing guide (both accounts): `references/VIDEO_EDITING_GUIDE.pdf`. Always apply it.** Captions in Montserrat Arabic Bold, word-by-word fade,
  glow intensity 30 / range 58 in #005D83 (LaserVision) or #0C188D (ZVC). Transitions: Mix, Echo Fade, Film Reject, Acrylic Fades.
  Sound effects: whoosh on transitions, pop on text pop-ups. Implemented in `reels/src/components/Captions.tsx`.
- **B-roll:** keep it professional (no party or nightlife shots).
- **LaserVision reel covers: sticker style** (examples: `covers/laservision/*/cover.png`, branch `claude/laser-vision-zeiss-strategy-tbslie`;
  HTML source to copy: `covers/laservision/beltone-hearing/cover.html`). Speaker frame (mouth closed, warm, not sad) filling 1080×1920;
  two illustrated stickers beside her (white rounded square left, navy #00303F circle right) each with a tilted navy label pill in CAPS;
  ALL-CAPS English headline, white with cyan glow; one-line English subline; teal-to-navy fade at the bottom; no logo, no WhatsApp.

## Content
- Rules for what each brand says and never says: `strategy/SUMMARY.md`.
- Project status and decisions: `PROJECT_BRIEF.md`.
