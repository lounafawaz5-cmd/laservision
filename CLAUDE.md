# LaserVision & ZEISS Vision Center: standing rules

Read before any work in this repo. These are Luna's decisions; don't re-ask them.

## On-screen design (reels, carousels, end cards, covers)
- **Never write the word "WhatsApp" on screen.** Use the WhatsApp **icon** (`reels/src/components/WhatsAppIcon.tsx`) followed by the number.
  - LaserVision: **+961 81 54 20 20** · ZVC: **81 47 20 20**
- **LaserVision colors:** from its brand guidelines, colors only (`brand/laservision/GUIDELINES.md`). Nothing else from that PDF applies.
- **ZVC:** the store name "ZEISS Vision Center" is fine; never the blue ZEISS block logo. Use the "by Laser Vision" wordmark (`brand/zeiss/`).
- **Carousels:** English only, font Outfit, house style in `references/laservision/CAROUSEL_STYLE.md`.
- **End card (decided 2 Nov, final):** every reel on both accounts ends on the one standard brand end card, `reels/src/templates/BrandOutro.tsx` (`Outro-LaserVision` / `Outro-ZVC`, 2.5 s). ZVC = black, white "by Laser Vision" wordmark, WhatsApp icon + number. For a brand-led post the brand's white logo goes above the wordmark (`partnerLogo`, e.g. `Outro-ZVC-Snob`); nothing else changes. Never design a new or edit-specific end card; templates render `<BrandOutro>`, finished exports get it via `reels/scripts/append-outro.sh`.
- **Reels:** Arabic subtitles on both accounts. LaserVision house style in `references/laservision/REEL_STYLE.md`.

## Content
- Rules for what each brand says and never says: `strategy/SUMMARY.md`.
- Project status and decisions: `PROJECT_BRIEF.md`.
