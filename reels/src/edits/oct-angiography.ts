import { CapcutFinishProps } from "../templates/CapcutFinish";

// LaserVision · OCT vs angiography (optometrist Serine, LaserVision Tripoli).
// Source: Luna's CapCut export "1103.mp4" (Drive), 53.8 s, put in public/footage/1103/.
// All times are in that export's timeline.
// Luna's notes (3 Nov): glow the logo when it pops (~0:05); OCT machine sticker (~0:10);
// list the diseases on screen with a ding each (~0:15); remove the repeated take (0:26–0:31);
// angiography sticker (~0:36).
const s = (text: string, start: number, end: number) => ({ text, startMs: start * 1000, endMs: end * 1000 });

export const octAngiography: CapcutFinishProps = {
  brand: "laservision",
  video: "footage/1103/1103.mp4",
  // The list is said twice; the second take (25.05–31.30, between two pauses) is removed.
  // A slight punch-in after the cut hides the jump.
  keep: [
    { from: 0, to: 25.05 },
    { from: 31.3, to: 53.833, zoom: 1.07 },
  ],
  // Arabic subtitles, 1–3 words, English terms in English (REEL_STYLE.md).
  captions: [
    s("مش كل", 0.0, 0.64),
    s("مشاكل العين", 0.64, 1.58),
    s("فينا نشوفها", 1.58, 2.22),
    s("بالفحص العادي", 2.22, 3.12),
    s("هاي أنا سيرين", 3.12, 4.4),
    s("OPTOMETRIST", 4.4, 5.24),
    s("بـ LaserVision Tripoli", 5.24, 6.44),
    s("إذا بدكن تعرفوا", 6.44, 7.46),
    s("شو عم بيصير", 7.46, 8.0),
    s("فعلياً", 8.0, 8.52),
    s("داخل الشبكية", 8.52, 9.5),
    s("الـ OCT", 9.5, 10.1),
    s("هو تصوير", 10.1, 11.08),
    s("مقطعي", 11.08, 11.66),
    s("لطبقات العين", 11.66, 12.52),
    s("من خلالو", 12.52, 13.58),
    s("فينا نقيّم", 13.58, 14.16),
    // 14.16–18.42: the diseases are shown as the on-screen list instead.
    s("لنقدر نتابع", 18.42, 19.66),
    s("الحالة مع الوقت", 19.66, 20.86),
    s("والأهم", 20.86, 21.76),
    s("الفحص سريع", 21.76, 22.76),
    s("ما في وجع", 22.76, 23.64),
    s("وما مندق بالعين", 23.64, 24.9),
    s("بس مش دايماً", 31.4, 32.06),
    s("الـ OCT بيكون", 32.06, 32.86),
    s("كافي لحالو", 32.86, 33.7),
    s("وهون بيجي", 33.7, 34.68),
    s("دور الـ ANGIOGRAPHY", 34.68, 35.68),
    s("هو فحص مهم", 35.68, 37.06),
    s("بالتشخيص", 37.06, 37.78),
    s("بيكشف تفاصيل", 37.78, 38.8),
    s("دقيقة", 38.8, 39.34),
    s("بتقييم", 39.34, 40.06),
    s("الأوعية الدموية", 40.06, 41.02),
    s("وأي تسرّبات", 41.02, 42.16),
    s("وتغيّرات بالشبكية", 42.16, 43.42),
    s("من خلال مادة", 43.42, 44.36),
    s("ملوّنة", 44.36, 44.76),
    s("بتنعطى بالعرق", 44.76, 45.64),
    s("هالفحصين", 45.64, 46.56),
    s("بيكمّلوا بعض", 46.56, 47.48),
    s("وإذا طبيبك", 47.48, 48.5),
    s("طلبهن منك", 48.5, 49.32),
    s("مش ضروري", 49.32, 49.92),
    s("تروح بعيد", 49.92, 50.64),
    s("بـ LaserVision Tripoli", 50.64, 51.96),
    s("نحنا جاهزين", 51.96, 52.68),
    s("نساعدك", 52.68, 53.8),
  ],
  lists: [
    {
      items: [
        { text: "أمراض الشبكية", atMs: 14160 },
        { text: "السكري", atMs: 15440 },
        { text: "GLAUCOMA", atMs: 16140 },
        { text: "مشاكل العصب البصري", atMs: 16860 },
      ],
      endMs: 18420,
      top: 1040,
      sfx: "sfx/ding.wav",
      sfxVolume: 0.35,
    },
  ],
  stickers: [
    { kind: "oct", startMs: 9450, endMs: 12500, x: 640, y: 640, size: 400, tilt: 6 },
    { kind: "angiography", startMs: 34800, endMs: 39300, x: 40, y: 640, size: 400, tilt: -6 },
  ],
  // The logo CapCut pops in at 4.97 s sits at y 1404–1601; masks cover 4.9–6.7 s.
  logoGlow: { startMs: 4900, maskDir: "footage/1103/logo-mask", maskFrames: 54, top: 1300, height: 400 },
};
