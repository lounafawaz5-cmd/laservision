# LaserVision carousel: before & after checklist

8 slides, 1080 × 1350 (4:5), English, Outfit. Pillar: **Educational → Prep & After**.
Finished slides: `out/slide-01.png` … `out/slide-08.png`.

## Files
| File | What |
|---|---|
| `slides.html` | All 8 slides (HTML + inline SVG line art). Edit copy here. |
| `render.mjs` | `node carousels/laservision/prep-aftercare-checklist/render.mjs` → re-renders `out/` |
| `photos/` | Nurse photos (Hazmieh, shot for a reel) used as tinted, low-opacity backgrounds on slides 2–7. |
| `export-canva.cjs` | Builds `canva/` (background image + editable text boxes per slide) for import into Canva. |

## Slides
| # | Background | Label | Headline |
|---|---|---|---|
| 1 | Dark | Laser vision correction | Your before & after **checklist.** |
| 2 | Light | BEFORE · Start with the right tests | Preparation starts before **procedure day.** |
| 3 | Dark | BEFORE · Before your measurements | Contact lenses? **Follow your instructions.** |
| 4 | Light | BEFORE · Procedure day | Keep the day **simple.** |
| 5 | Dark | AFTER · The first hours | Rest. Protect. **Don’t rub.** |
| 6 | Light | AFTER · During recovery | Follow your **recovery plan.** |
| 7 | Dark | AFTER · Wait for clearance | Before **returning to…** (4 icon cards) |
| 8 | Light | Before & after | Your instructions are **personal to you.** + CTA |

Highlights: cyan (#30A4BF) text on dark slides; on light slides cyan text is too faint (2.6:1), so the
highlight is a cyan marker band behind navy text.

## Where this departs from the brief, and why
- **"WhatsApp us to book…" (slide 8)** became *"Book your tests or consultation."* + WhatsApp icon +
  **+961 81 54 20 20**. House rule: never the word "WhatsApp" on screen.
- **Photography:** real staff photos only (no stock, no AI). Slides 2–7 use the nurse photos as grayscale,
  brand-tinted backgrounds at low opacity, with a navy/gray gradient over the text side. Cover and closing
  slide keep the line art and light visuals. In the syringe shot (IMG_1692) the needle sits under the heavy
  text overlay on the left and doesn't show, keeping the slides free of graphic clinical imagery.
- **Size:** 1080 × 1350 as requested. The reference carousel (`CAROUSEL_STYLE.md`) is 1200 × 1500, also 4:5,
  so the two are interchangeable on Instagram.
- **"Before / After" chips** added to the labels so the checklist reads as two halves when saved.
- **Outfit Regular** (body text) was missing from `brand/fonts/Outfit/`. Added `Outfit-Regular.woff2`
  (Latin subset, SIL OFL, from Fontsource).

## Compliance check
- No promise of results or recovery times; no fear language; no exact stopping periods, doses or timelines.
- LASIK / PRK / Femto called out as different (slides 6, 7); timings deferred to the team (slide 3).
- The treating ophthalmologist decides suitability, procedure and instructions (slides 2, 5, 7, 8). No optometrist role mentioned.
- No doctors shown or named. WhatsApp: icon + number only.

## Photos used
| Slide | Photo | Shows |
|---|---|---|
| 2 | IMG_1696 | Nurse, close-up |
| 3 | IMG_1700 | Opening a contact-lens pack |
| 4 | IMG_1712 | Preparing the tray |
| 5 | IMG_1678 | Drops (dropper bottle) |
| 6 | IMG_1692 | Nurse, close-up (needle hidden under the overlay) |
| 7 | IMG_1710 | Gloved hands with instrument |

Footer on slides 2–7: LaserVision logo · Hazmieh · Saida · Tripoli · Hôtel-Dieu · WhatsApp icon + number.

Caption reminder: WhatsApp **+961 81 54 20 20** goes in the caption too (every LaserVision post).
