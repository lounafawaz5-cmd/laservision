# Reels (Remotion)

Reel templates for Laser Vision and Zeiss. Vertical 1080×1920, 30 fps.

## Layout
```
src/
  brands/index.ts        brand colors, fonts, outro line (placeholders until the brand kits arrive)
  components/            building blocks: Hook, Captions (English + Arabic RTL), Outro
  templates/             one file per reel template
  Root.tsx               registers each template per brand
public/
  fonts/                 bundled fonts (Inter, Noto Sans Arabic)
  footage/               raw clips pulled from Google Drive per session (never committed)
out/                     renders (never committed)
```

## Commands
```
npm install                        # once per session
npm run typecheck
npx remotion render src/index.ts TalkingHead-LaserVision out/reel.mp4
npx remotion render src/index.ts TalkingHead-Zeiss out/reel.mp4 --props=props.json
```

## Templates
| Template | Status | What it is |
|---|---|---|
| BrandOutro | Ready | 2.5 s end card: LaserVision = navy, white logo, branches, WhatsApp icon + number. ZVC = black, wordmark, WhatsApp icon + number. |
| CapcutFinish | Ready | Finishing pass on a CapCut export: remove sections (times in the export's own timeline), Arabic subtitles, on-screen lists with a ding per item, illustrated stickers (OCT, angiography), glow on a burned-in logo (`scripts/logo-mask.py`). First use: `src/edits/oct-angiography.ts`. |
| MultiTake | Ready | One talking head built from several takes of the same set-up: best delivery of each line, short Mix on each join, B-roll cut-ins (labelled placeholder until the clip exists), illustrated overlays with a pop (field-of-view eye, rocking brain, squinting eyes, logo with halo), house captions. Word timings: `scripts/multitake-words.py`. First use: `src/edits/visual-field.ts`. |
| ReelCover | Ready | Reel cover still (1080×1920). Speaker frame, navy scrim, English term in CAPS + Arabic name underneath (Montserrat Arabic Bold, house glow), optional motif from the reel, small white logo; all inside the 4:5 grid crop (y 285–1635). Render: `npx remotion still src/index.ts Cover-VisualField out/visual-field-cover.png --frame=34`. |
| TalkingHead | Starter | Footage + timed captions; optional hook card and end card. LaserVision preset matches the reference reel (no cards, word-by-word subtitles). |

The full template list (doctor Q&A, patient story, before/after, product showcase, listicle,
trend formats…) is decided together in Step 8, then built here.

## Adding the end card to a finished edit (e.g. a CapCut export)
```
scripts/append-outro.sh path/to/export.mp4 laservision out/final.mp4   # or: zvc
```
Renders the brand end card (`Outro-LaserVision` / `Outro-ZVC`, 2.5 s), matches it to the video's size and
frame rate, adds silence under it, and joins the two.

## Per-reel flow
1. Clips go in Google Drive `Footage/<Brand>/<date topic>/`
2. Claude pulls them into `public/footage/`, transcribes (English/Arabic), and writes the props (cuts, hook, captions)
3. Render → review → revise

## License
Remotion is free for individuals and companies with up to 3 employees; larger companies need a
company license (remotion.pro). Confirm before publishing.
