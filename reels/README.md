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
