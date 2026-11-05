import { ExportPatchProps } from "../templates/ExportPatch";
import { visualField } from "./visual-field";

// LaserVision · Visual field test, final pass on Luna's CapCut edit of v2 ("capcut-v3.mp4" on Drive, 55.7 s,
// put in public/footage/visual-field/). Her edit trims 0.6 s before 0:16 and 0.9 s around 0:38, so from
// 0:16 to 0:36 her timeline = v2 − 0.6 s (found by matching the two audio tracks).
// Luna's notes (5 Nov): she laughs at ~0:17, cover it. Use the eye overlay as a B-roll: LaserVision-colour
// background with that overlay on it. The card spans the whole eye moment (0:16.85–0:22.45, where the
// burned-in eye pops in and out), so the small eye under it never shows; lines spread on "على الجوانب".
const SHIFT = -600;
const card = { fromMs: 16850, toMs: 22450 };

export const visualFieldFinal: ExportPatchProps = {
  brand: "laservision",
  video: "footage/visual-field/capcut-v3.mp4",
  durationSec: 55.681,
  mixFrames: 5,
  cards: [{ ...card, overlay: { kind: "fieldEye", y: 760, eyeWidth: 420, spreadAtMs: 20510 + SHIFT - card.fromMs } }],
  // v2's subtitles for the card's span, moved onto her timeline (the burned-in ones are under the card).
  captions: visualField.captions
    .filter((c) => c.endMs + SHIFT > card.fromMs && c.startMs + SHIFT < card.toMs)
    .map((c) => ({ ...c, startMs: c.startMs + SHIFT, endMs: c.endMs + SHIFT, words: c.words?.map((w) => w + SHIFT) })),
};
