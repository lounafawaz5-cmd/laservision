import { BrollReelProps } from "../templates/BrollReel";
import { Overlay, StepPart } from "../components/PopOverlay";

// LaserVision · "Watery eyes can still be dry eyes": the dry eye test, LaserVision Tripoli.
// Drive: RIB_0074.MP4 (talking head, shoot of 29 Sep). House style: references/laservision/REEL_STYLE.md,
// captions per brand/Video_Editing_Guide.pdf (Montserrat Arabic Bold, word-by-word fade, glow #005D83 30/58).
//
// Footage (not committed; pulled per session into public/footage/dry-eye-0074/):
//   main.mp4  = RIB_0074.MP4 at 30 fps (1080×1920)
//   edit.m4a  = RIB_0074 audio, 11.95–43.75 s, 30/80 ms fades
//   broll/RIB_2358.mp4 = RIB_2358.MP4 (Drive folder 1yA-zVRSiYf3v3-iUohpm5VrxFi_PSGoW), first 6 s at 30 fps, 1080×1920
const DIR = "footage/dry-eye-0074";

// One kept range: the 12 s warm-up before "عيونك" and the hand gesture after "Tripoli" are cut.
const SEGS: [number, number][] = [[11.95, 43.75]];
const ms = (src: number) => Math.round((src - SEGS[0][0]) * 1000);
const DURATION_MS = Math.round((SEGS[0][1] - SEGS[0][0]) * 1000);

// [text, start of each word in source seconds (Whisper large-v3), end of the line]
const LINES: [string, number[], number][] = [
  ["عيونك عم بتدمّع", [12.1, 12.46, 12.62], 13.22],
  ["بس ممكن", [13.22, 13.66], 13.92],
  ["تكون ناشفة", [13.92, 14.2], 14.78],
  ["جفاف العين", [14.78, 15.42], 15.88],
  ["مش يعني", [15.88, 16.12], 16.46],
  ["ما عندك دموع", [16.46, 16.62, 16.94], 17.36],
  ["أوقات المشكلة", [17.36, 18.04], 18.54],
  ["بتكون بكمية الدمع", [18.54, 18.96, 19.54], 20.04],
  ["ونوعيتها", [20.04], 20.76],
  ["وسرعة تبخّرها", [20.76, 21.28], 22.14],
  ["بالـ DRY EYE TEST", [22.14, 22.52, 22.76, 22.94], 23.36],
  ["منقيّم حالة العين", [23.36, 23.74, 24.2], 24.68],
  ["وسبب الجفاف", [24.68, 25.14], 25.78],
  ["وقدّيش مأثّر", [25.78, 26.3], 26.62],
  ["على راحة العين", [26.62, 26.8, 27.14], 27.52],
  ["والنظر", [27.52], 28.14],
  ["إذا بتحسّ", [28.14, 28.68], 29.12],
  ["بحرقة", [29.12], 29.7],
  ["رمل بالعين", [29.7, 30.22], 30.8],
  ["تعب عالـ SCREEN", [30.8, 31.3, 31.38], 31.9],
  ["أو غباشة", [31.9, 32.12], 32.58],
  ["بتزيد مع النهار", [32.58, 33.0, 33.12], 33.72],
  ["DRY EYE TEST", [33.72, 34.22, 34.42], 34.76],
  ["ممكن يكشف", [34.76, 35.2], 35.58],
  ["عن المشكلة", [35.58, 35.74], 36.34],
  ["ويساعدنا نختار", [36.34, 37.08], 37.44],
  ["العلاج المناسب", [37.44, 37.98], 38.46],
  ["هالفحص موجود عنا", [38.46, 39.48, 39.84], 40.2],
  ["شوف حكيمك", [40.2, 40.74], 41.22],
  ["وتواصل معنا", [41.22, 41.7], 41.98],
  // v4 (Luna, 16 Nov): no subtitle for "بـ LaserVision Tripoli"; the contact card below carries it.
];

const captions = LINES.map(([text, words, end]) => ({
  text,
  startMs: ms(words[0]),
  endMs: ms(end),
  words: words.map(ms),
}));

// The one B-roll (Luna, 17 Nov): the first time she says "DRY EYE TEST", RIB_2358 — the patient at the dry eye
// analyzer with his eye live on the laptop. Held through "منقيّم حالة العين", Mix in and out with a whoosh.
const broll: BrollReelProps["broll"] = [
  { src: `${DIR}/broll/RIB_2358.mp4`, fromMs: ms(22.0), toMs: ms(24.75), startSec: 1.0, x: 50 },
];

const O = (kind: Overlay["kind"], fromSrc: number, toSrc: number, label: string, steps?: [StepPart, number, string][]): Overlay => ({
  kind,
  fromMs: ms(fromSrc),
  toMs: ms(toSrc),
  label,
  steps: steps?.map(([part, at, l]) => ({ part, atMs: ms(at), label: l })),
});

// Pop-up badges UNDER the captions (Luna, 13 Nov). None over the B-roll.
// v4 (Luna, 16 Nov): removed WATERY EYES, DRY EYE ≠ NO TEARS and THE RIGHT TREATMENT.
const overlays: Overlay[] = [
  O("tearfilm", 18.96, 21.98, "QUANTITY", [
    ["quantity", 18.96, "QUANTITY"],
    ["quality", 20.04, "QUALITY"],
    ["evaporation", 20.76, "EVAPORATION"],
  ]),
  O("symptoms", 29.12, 33.72, "BURNING", [
    ["burning", 29.12, "BURNING"],
    ["sand", 29.7, "GRITTY EYES"],
    ["screen", 30.8, "SCREEN FATIGUE"],
    ["blur", 31.9, "BLURRY VISION"],
  ]),
  O("contact", 40.74, 43.75, "LASERVISION TRIPOLI|+961 81 54 20 20"),
];

export const dryEyeTest: BrollReelProps = {
  brand: "laservision",
  video: `${DIR}/main.mp4`,
  segs: SEGS,
  audio: `${DIR}/edit.m4a`,
  durationMs: DURATION_MS,
  broll,
  overlays,
  captions,
};
