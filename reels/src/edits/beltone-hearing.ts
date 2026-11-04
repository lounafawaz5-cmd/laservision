import { TalkingHeadProps } from "../templates/TalkingHead";

// LaserVision: hearing / Beltone hearing aids talking head (RIB_0129), with b-roll, stickers and CTA.
// Footage: public/footage/rib0129/ (Drive: RIB_0129, RIB_0136, RIB_0138; stock-*.mp4 = Mixkit free license).

// The first 2.2 s of RIB_0129 is a false start, so everything below is on the trimmed timeline.
const TRIM = 2.2;

// Lines are timed on the raw clip (seconds), from the Whisper word timings, then shifted by TRIM.
const lines: [string, number, number][] = [
  ["ادي من الأصوات", 2.2, 3.52],
  ["بحياتكم اليومية", 3.52, 4.82],
  ["بتمرق", 4.82, 5.58],
  ["بدون ما تنتبهولا؟", 5.58, 6.88],
  ["ضحكة حدا", 6.88, 8.0],
  ["بتحبّوا", 8.0, 8.82],
  ["حكي الأصحاب", 8.82, 9.9],
  ["وصوت التلفزيون", 9.9, 11.16],
  ["أو حتى", 11.18, 12.08],
  ["حديث بمطعم", 12.08, 13.26],
  ["مليان ناس", 13.26, 14.14],
  ["مع Beltone", 14.2, 15.4],
  ["التكنولوجيا المتطورة", 15.4, 16.8],
  ["وميزات الـ AI", 16.8, 18.18],
  ["بتساعدك تلقط", 18.18, 19.48],
  ["الأصوات المهمّة", 19.48, 20.64],
  ["بوضوح أكتر", 20.64, 21.74],
  ["وبتخفف تأثير", 21.74, 23.08],
  ["الأصوات المزعجة", 23.08, 24.45],
  ["حواليك", 24.45, 25.05],
  ["تصميم عملي", 25.1, 26.48],
  ["وتكنولوجيا ذكية", 26.48, 27.84],
  ["وتجربة سمع", 27.84, 29.62],
  ["بتتكيّف مع يومك", 29.62, 30.88],
  ["والأهم", 30.9, 31.84],
  ["إنّو كل سمّاعة", 31.84, 33.24],
  ["بتكون مبرمجة", 33.24, 34.28],
  ["حسب السمع", 34.28, 35.24],
  ["واحتياجات كل شخص", 35.24, 36.46],
  ["ونحنا بـ LaserVision", 36.5, 38.08],
  ["صرنا جاهزين", 38.08, 39.02],
  ["نفحص سمعك", 39.02, 39.98],
  ["ونساعدك تختار", 39.98, 41.5],
  ["الحل الأنسب لإلك", 41.5, 43.16],
  ["إذا حاسس إنّك", 43.3, 44.58],
  ["عم تفوّت", 44.58, 45.2],
  ["جزء من الحديث", 45.2, 46.16],
  ["أو عم تتعب", 46.16, 47.08],
  ["لتفهم الحكي", 47.08, 48.06],
  ["احجز موعدك", 48.06, 49.3],
  ["واكتشف الفرق", 49.3, 50.48],
  ["بنفسك", 50.48, 51.4],
];

const dir = "footage/rib0129/";

export const beltoneHearing: TalkingHeadProps = {
  brand: "laservision",
  video: `${dir}RIB_0129.mp4`,
  trimStartSec: TRIM,
  mainSec: 49.3,
  hook: "",
  hookSeconds: 0,
  outroSeconds: 2.5,
  outroStyle: "brand",
  captions: lines.map(([text, s, e]) => ({
    text,
    startMs: Math.round((s - TRIM) * 1000),
    endMs: Math.round((e - TRIM) * 1000),
  })),
  broll: [
    // "ضحكة حدا بتحبّوا، حكي الأصحاب": family gathering laughing in a garden, shot from across the yard
    { src: `${dir}stock-23135.mp4`, from: 4.68, to: 7.7, at: 3, focusX: 50, fit: true, sfx: true },
    // "وصوت التلفزيون"
    { src: `${dir}stock-26092.mp4`, from: 7.7, to: 9.58, at: 2, focusX: 16, sfx: true },
    // "حديث بمطعم مليان ناس"
    { src: `${dir}stock-4043.mp4`, from: 9.58, to: 12.0, at: 2, focusX: 50, sfx: true },
    // "مع Beltone…": the two Beltone shots from Drive
    { src: `${dir}RIB_0138.mp4`, from: 12.0, to: 14.4, at: 2, focusX: 50, sfx: true },
    { src: `${dir}RIB_0136.mp4`, from: 14.4, to: 16.8, at: 1, focusX: 50 },
  ],
  overlays: [
    // TV volume climbing to max over the TV shot.
    { type: "volume", from: 7.75, to: 9.58, x: 540, y: 430 },
    // "الأصوات المزعجة": noise marks beside her head (head spans x≈400–680, y≈390–760).
    { type: "zigzag", from: 20.85, to: 23.0, x: 900, y: 500 },
    // "بـ LaserVision": logo pops above her head.
    { type: "logo", from: 35.1, to: 38.0, x: 540, y: 250 },
    // "احجز موعدك": WhatsApp icon + number until the end card.
    { type: "whatsapp", from: 45.86, to: 49.3, x: 540, y: 1480 },
  ],
};
