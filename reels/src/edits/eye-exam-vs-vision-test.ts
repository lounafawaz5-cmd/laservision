import { BrollReelProps } from "../templates/BrollReel";
import { Overlay } from "../components/PopOverlay";

// LaserVision · "Seeing well ≠ healthy eyes": vision test vs comprehensive eye exam (Drive IMG_1389.mov, 13 Nov).
// Style after the reference reel DcV1yP9OCYW minus the zoom-ins: talking head, a few stock B-roll cut-ins,
// pop-up illustration badges under the subtitles, house captions (brand/Video_Editing_Guide.pdf).
//
// Footage (not committed; pulled per session into public/footage/2026-11-13/):
//   main.mp4  = IMG_1389.mov scaled to 1080×1920 @30
//   edit.mp4  = main.mp4 with the long pauses cut (SEGS below), audio faded 30–40 ms at each join
//   broll/<id>.mp4 = Mixkit stock clips (Mixkit free license), https://mixkit.co/free-stock-video/<slug>-<id>/
const DIR = "footage/2026-11-13";

// Kept ranges of the source, in source seconds. Everything below is written in source time and mapped.
const SEGS: [number, number][] = [
  [3.4, 19.35],
  [20.0, 24.62],
  [25.4, 40.2],
  [41.1, 49.5],
  [50.33, 60.75],
];
const ms = (src: number) => {
  let acc = 0;
  for (const [s, e] of SEGS) {
    if (src <= e) return Math.round((acc + Math.max(0, src - s)) * 1000);
    acc += e - s;
  }
  return Math.round(acc * 1000);
};
const DURATION_MS = Math.round(SEGS.reduce((a, [s, e]) => a + e - s, 0) * 1000);

// [text, source start]; each line ends at the next one's start, or at an explicit end in source time.
const LINES: [string, number, number?][] = [
  ["بتشوفوا منيح", 3.45],
  ["يعني عيونكم منيح؟", 5.44, 7.06],
  ["مش ضروري", 7.06, 8.04],
  ["فحص النظر", 8.78],
  ["أو الـ REFRACTION", 9.58],
  ["بحدد", 10.72],
  ["إذا كنتوا بحاجة", 11.46],
  ["لعوينات", 12.68],
  ["أو CONTACT LENSES", 13.48, 14.75],
  ["وبيساعدكم", 15.31],
  ["تلاقوا الدرجات", 15.88],
  ["اللي بتعطيكم", 16.82],
  ["رؤية واضحة", 17.6],
  ["ومريحة", 18.58, 19.3],
  ["بس هون", 20.11, 20.74],
  ["منكون عم نركز", 21.13],
  ["على شغلة وحدة", 22.2, 23.32],
  ["كيف عم تقشعوا", 23.76, 24.62],
  ["أما الفحص الكامل", 25.48],
  ["للعيون", 26.6, 27.37],
  ["فهو أوسع بكتير", 27.88, 29.15],
  ["بيشمل", 29.77],
  ["الـ CORNEA", 30.16],
  ["عدسة العين", 30.84],
  ["الشبكية", 32.24],
  ["عصب العين", 33.22],
  ["وحتى ضغط العين", 34.28, 35.38],
  ["ولهيك", 36.16, 36.53],
  ["ممكن الطبيب", 36.95],
  ["يحطلكم قطرات", 37.72],
  ["لتوسيع بؤبؤ العين", 38.86, 40.15],
  ["ليش؟", 41.19, 41.74],
  ["لأنه في أمراض", 42.31],
  ["متل الـ GLAUCOMA", 43.32],
  ["والـ DIABETIC RETINOPATHY", 44.46, 46.33],
  ["بتبلش", 46.78],
  ["بمرحلتها الأولى", 47.2],
  ["بلا أي عوارض", 48.26, 49.48],
  ["لهيك", 50.43, 50.89],
  ["مش بس لازم", 51.29],
  ["تفحصوا نظركم", 51.96, 53.34],
  ["لازم تتشيكوا", 53.72],
  ["على صحة عيونكم", 54.42, 55.84],
  ["وتذكروا", 56.26, 57.02],
  ["الرؤية الواضحة", 57.48],
  ["مش دايماً يعني", 58.32],
  ["عيون بصحة جيدة", 59.24, 60.62],
];

const captions = LINES.map(([text, s, e], i) => ({
  text,
  startMs: ms(s),
  endMs: ms(e ?? LINES[i + 1][1]),
}));

// B-roll in edited-timeline seconds, Mix in and out with a whoosh. Pause cuts not under B-roll get a Mix too.
const B = (id: number, from: number, to: number, startSec: number, x: number) => ({
  src: `${DIR}/broll/${id}.mp4`,
  fromMs: Math.round(from * 1000),
  toMs: Math.round(to * 1000),
  startSec,
  x,
});
// v2 (Luna, 13 Nov): far fewer cut-ins. Removed the trial frame, trial lenses, "vision device", pupil
// (its DILATING DROPS overlay stays), the eye after DIABETIC RETINOPATHY and the vision-test shots.
const broll = [
  B(20962, 2.04, 3.66, 1, 52), // "يعني عيونكم منيح؟" eye close-up
  B(22130, 9.28, 11.35, 8.0, 62), // "لعوينات أو CONTACT LENSES" man puts on a pair of glasses
  B(13072, 19.71, 20.57, 3, 38), // "كيف عم تقشعوا" cover test
  B(13073, 20.57, 22.5, 10, 82), // "أما الفحص الكامل" slit lamp
  B(36420, 47.16, 49.28, 1, 97), // "تتشيكوا على صحة عيونكم" slit lamp exam
];

const O = (kind: Overlay["kind"], fromSrc: number, toSrc: number, label: string, steps?: Overlay["steps"]): Overlay => ({
  kind,
  fromMs: ms(fromSrc),
  toMs: ms(toSrc),
  label,
  steps,
});
const overlays: Overlay[] = [
  O("question", 7.06, 8.7, "20/20 = HEALTHY?"),
  O("chart", 8.78, 10.68, "REFRACTION"),
  O("focus", 22.2, 23.7, "VISION ONLY"),
  O("exam", 26.6, 29.4, "COMPREHENSIVE EXAM"),
  O("anatomy", 29.77, 35.38, "CORNEA", [
    { part: "cornea", atMs: ms(30.16), label: "CORNEA" },
    { part: "lens", atMs: ms(30.84), label: "LENS" },
    { part: "retina", atMs: ms(32.24), label: "RETINA" },
    { part: "nerve", atMs: ms(33.22), label: "OPTIC NERVE" },
    { part: "pressure", atMs: ms(34.28), label: "EYE PRESSURE" },
  ]),
  O("drops", 37.72, 40.15, "DILATING DROPS"),
  O("glaucoma", 43.32, 44.46, "GLAUCOMA"),
  O("retinopathy", 44.46, 46.33, "DIABETIC RETINOPATHY"),
  O("silent", 48.26, 49.48, "NO SYMPTOMS"),
  O("check", 51.96, 53.34, "VISION TEST"),
  O("check", 53.72, 55.84, "EYE HEALTH CHECK"),
  O("statement", 57.48, 60.75, "CLEAR VISION|≠ HEALTHY EYES"),
];

export const eyeExamVsVisionTest: BrollReelProps = {
  brand: "laservision",
  video: `${DIR}/main.mp4`,
  segs: SEGS,
  audio: `${DIR}/edit.mp4`,
  durationMs: DURATION_MS,
  broll,
  overlays,
  captions,
};
