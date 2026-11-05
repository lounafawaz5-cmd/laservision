import { MultiTakeProps } from "../templates/MultiTake";

// LaserVision · Visual field test (optometrist Serine, LaserVision Tripoli).
// Three takes from Drive (same set-up): RIB_0026 (150 s, many restarts), RIB_0027 (106 s, stops after
// "glaucoma"), RIB_0029 (79 s, nearly complete). Put them in public/footage/visual-field/.
// Best delivery of each line (all joins are on pauses in the speech):
//   1–3  opening, intro          RIB_0027  clearest "وما تنتبه" (RIB_0029 swallows it)
//   4    "الـ visual field test…" RIB_0029  RIB_0027 slurs "فحص"
//   5–8  sides → eye health      RIB_0029  her redo at 0:28.6 (the 0:18–0:28 attempt is cut)
//   9    call to action           RIB_0029  second version (0:71): "إذا طبيبك طلب منك…", ends on a smile
// Luna's notes (5 Nov), times in RIB_0029's own timeline:
//   "visual field test" → B-roll of the machine with a patient only (no optometrist)
//   0:18 sides → cartoon eye, two lines from the pupil out to the edges
//   0:45 brain → cartoon brain beside her head, rocking softly
//   1:00 eye health → two squinting cartoon eyes in LaserVision colours
//   1:05 LaserVision → the logo, high-res
// s(text, start ms, end ms, each word's start in ms for the word-by-word fade); all OUTPUT timeline.
const s = (text: string, startMs: number, endMs: number, words: number[]) => ({ text, startMs, endMs, words });
const take = (n: string) => `footage/visual-field/RIB_${n}.MP4`;

export const visualField: MultiTakeProps = {
  brand: "laservision",
  mixFrames: 5, // Mix, the guide's default transition, kept short so the joins read as one take
  segments: [
    { src: take("0027"), from: 2.0, to: 14.0, note: "lines 1–3" }, // out 0–12.00
    { src: take("0029"), from: 12.3, to: 16.05, note: "line 4" }, // out 12.00–15.75
    { src: take("0029"), from: 28.6, to: 61.6, note: "lines 5–8" }, // out 15.75–48.75
    { src: take("0029"), from: 71.5, to: 77.4, note: "line 9" }, // out 48.75–54.65
  ],
  broll: [
    // No visual field (perimeter) footage in the Drive folder: the patient clips there are the Lenstar,
    // the Sirius topographer and a black-head device, none of them a perimeter. Drop the clip in as
    // footage/visual-field/broll-vf.mp4 and set src (from = where in the clip to start).
    { src: "", from: 0, atMs: 12100, durMs: 3600, label: "B-ROLL NEEDED\nVisual field machine, patient only" },
  ],
  overlays: [
    // Eye pops on "العين", lines run out on "على الجوانب" (out 20.5 s), hold through "من دون ما نحرّك عينينا".
    { kind: "fieldEye", atMs: 17500, durMs: 5500, y: 870, spreadAtMs: 3000 },
    // "المرتبطة بالدماغ": right of her head, where the background is clear.
    { kind: "brain", atMs: 32150, durMs: 3000, x: 925, y: 400, size: 270 },
    // "صحة العين": on the scrubs between chin and subtitles.
    { kind: "squintEyes", atMs: 47700, durMs: 2300, y: 860, eyeWidth: 210 },
    // "بـ LaserVision Tripoli": the logo holds to the last frame.
    { kind: "logo", atMs: 52650, durMs: 3000, y: 860, width: 660, src: "brand/laservision-logo-white.png" },
  ],
  popSfx: "sfx/pop.wav",
  popVolume: 0.18,
  captions: [
    s("ممكن تكون شايفة", 140, 1660, [140, 900, 1280]),
    s("منيح", 1660, 2220, [1660]),
    s("ومع هيك", 2220, 2800, [2220, 2480]),
    s("يكون عندك نقص", 2800, 3820, [2800, 3040, 3480]),
    s("بمجال الرؤية", 3820, 4820, [3820, 4240]),
    s("وما تنتبه", 4820, 5640, [4820, 5100]),
    s("هاي أنا سيرين", 5640, 7060, [5640, 6360, 6580]),
    s("OPTOMETRIST", 7060, 7860, [7060]),
    s("LaserVision Tripoli", 7860, 9300, [7860, 8700]),
    s("واليوم رح", 9300, 10280, [9300, 10040]),
    s("خبّركن أكتر", 10280, 11120, [10280, 10740]),
    s("عن هالموضوع", 11120, 12000, [11120, 11320]),
    s("الـ VISUAL FIELD", 12000, 12920, [12000, 12400, 12620]),
    s("TEST", 12920, 13240, [12920]),
    s("هو فحص", 13240, 14260, [13240, 13720]),
    s("بيقيس مجال الرؤية", 14260, 15750, [14260, 14600, 14940]),
    s("يعني مش بس", 15870, 17490, [15870, 16790, 17110]),
    s("شو العين بتشوف", 17490, 18350, [17490, 17670, 17990]),
    s("قدّامها", 18350, 18890, [18350]),
    s("كمان منقدر نشوف", 18890, 20510, [18890, 19590, 20150]),
    s("على الجوانب", 20510, 21370, [20510, 20710]),
    s("من دون ما", 21370, 21890, [21370, 21570, 21810]),
    s("نحرّك عينينا", 21890, 22770, [21890, 22250]),
    s("ليش هالفحص مهم؟", 22770, 24530, [22770, 23570, 24090]),
    s("بيساعدنا نكتشف", 24530, 26030, [24530, 25390]),
    s("أو نتابع", 26030, 26830, [26030, 26210]),
    s("مشاكل معيّنة", 26830, 27790, [26830, 27270]),
    s("خصوصاً مشاكل", 27790, 28970, [27790, 28510]),
    s("الـ OPTIC NERVE", 28970, 29690, [28970, 29170, 29350]),
    s("متل الـ GLAUCOMA", 29690, 30830, [29690, 30250, 30370]),
    s("وبعض المشاكل", 30830, 31830, [30830, 31330]),
    s("المرتبطة بالدماغ", 31830, 32890, [31830, 32410]),
    s("والأهم", 32890, 33890, [32890]),
    s("الشخص بيكون حاسس", 33890, 35430, [33890, 34710, 35010]),
    s("إنّو نظرو طبيعي", 35430, 36470, [35430, 35570, 35910]),
    s("بس ممكن يكون", 36470, 37610, [36470, 37030, 37330]),
    s("في عندو تغيّرات", 37610, 38650, [37610, 37730, 37970]),
    s("بمجال الرؤية", 38650, 39630, [38650, 39150]),
    s("وما بيلاحظها", 39630, 41210, [39630, 40650]),
    s("بحياتو اليومية", 41210, 42290, [41210, 41690]),
    s("لهيك", 42290, 43170, [42290]),
    s("الـ VISUAL FIELD", 43170, 44170, [43170, 43290, 43550]),
    s("مش بس", 44170, 44850, [44170, 44510]),
    s("فحص للنظر", 44850, 45730, [44850, 45170]),
    s("هو فحص بيساعدنا", 45730, 46930, [45730, 45910, 46330]),
    s("نعرف أكتر", 46930, 47690, [46930, 47210]),
    s("عن صحة العين", 47690, 48750, [47690, 47890, 48210]),
    s("إذا طبيبك", 48900, 49930, [48900, 49390]),
    s("طلب منك", 49930, 50530, [49930, 50190]),
    s("هيدا الـ TEST", 50530, 51270, [50530, 50710, 50710]),
    s("فبتلاقيه عنّا موجود", 51270, 52730, [51270, 52090, 52270]),
    s("بـ LaserVision Tripoli", 52730, 54650, [52730, 52800, 53450]),
  ],
};
