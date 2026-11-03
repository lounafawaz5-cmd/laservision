import { CapcutFinishProps } from "../templates/CapcutFinish";

// LaserVision · OCT vs angiography (optometrist Serine, LaserVision Tripoli).
// Source: Luna's CapCut export "1103.mp4" (Drive), 53.8 s, put in public/footage/1103/.
// All times are in that export's timeline.
// Luna's notes (3 Nov): glow the logo when it pops (~0:05); OCT machine sticker (~0:10);
// list the diseases on screen with a ding each (~0:15); remove the repeated take (0:26–0:31);
// angiography sticker (~0:36).
// s(text, start s, end s, each word's start in ms for the word-by-word fade)
const s = (text: string, start: number, end: number, words: number[]) => ({ text, startMs: start * 1000, endMs: end * 1000, words });

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
    s("مش كل", 0.0, 0.64, [0, 320]),
    s("مشاكل العين", 0.64, 1.58, [640, 1140]),
    s("فينا نشوفها", 1.58, 2.22, [1580, 1800]),
    s("بالفحص العادي", 2.22, 3.12, [2220, 2640]),
    s("هاي أنا سيرين", 3.12, 4.4, [3120, 3680, 3940]),
    s("OPTOMETRIST", 4.4, 5.24, [4400]),
    s("بـ LaserVision Tripoli", 5.24, 6.44, [5240, 5620, 5980]),
    s("إذا بدكن تعرفوا", 6.44, 7.46, [6440, 6700, 6960]),
    s("شو عم بيصير", 7.46, 8.0, [7460, 7580, 7700]),
    s("فعلياً", 8.0, 8.52, [8000]),
    s("داخل الشبكية", 8.52, 9.5, [8520, 8840]),
    s("الـ OCT", 9.5, 10.1, [9500, 9800]),
    s("هو تصوير", 10.1, 11.08, [10100, 10480]),
    s("مقطعي", 11.08, 11.66, [11080]),
    s("لطبقات العين", 11.66, 12.52, [11660, 12100]),
    s("من خلالو", 12.52, 13.58, [12520, 13000]),
    s("فينا نقيّم", 13.58, 14.16, [13580, 13860]),
    // 14.16–18.42: the diseases are shown as the on-screen list instead.
    s("لنقدر نتابع", 18.42, 19.66, [18420, 19240]),
    s("الحالة مع الوقت", 19.66, 20.86, [19660, 20100, 20260]),
    s("والأهم", 20.86, 21.76, [20860]),
    s("الفحص سريع", 21.76, 22.76, [21760, 22220]),
    s("ما في وجع", 22.76, 23.64, [22760, 22980, 23100]),
    s("وما مندق بالعين", 23.64, 24.9, [23640, 23940, 24240]),
    s("بس مش دايماً", 31.4, 32.06, [31400, 31620, 31840]),
    s("الـ OCT بيكون", 32.06, 32.86, [32060, 32327, 32593]),
    s("كافي لحالو", 32.86, 33.7, [32860, 33180]),
    s("وهون بيجي", 33.7, 34.68, [33700, 34340]),
    s("دور الـ ANGIOGRAPHY", 34.68, 35.68, [34680, 34980, 35280]),
    s("هو فحص مهم", 35.68, 37.06, [35680, 36200, 36640]),
    s("بالتشخيص", 37.06, 37.78, [37060]),
    s("بيكشف تفاصيل", 37.78, 38.8, [37780, 38360]),
    s("دقيقة", 38.8, 39.34, [38800]),
    s("بتقييم", 39.34, 40.06, [39340]),
    s("الأوعية الدموية", 40.06, 41.02, [40060, 40500]),
    s("وأي تسرّبات", 41.02, 42.16, [41020, 41460]),
    s("وتغيّرات بالشبكية", 42.16, 43.42, [42160, 42840]),
    s("من خلال مادة", 43.42, 44.36, [43420, 43680, 44040]),
    s("ملوّنة", 44.36, 44.76, [44360]),
    s("بتنعطى بالعرق", 44.76, 45.64, [44760, 45220]),
    s("هالفحصين", 45.64, 46.56, [45640]),
    s("بيكمّلوا بعض", 46.56, 47.48, [46560, 47180]),
    s("وإذا طبيبك", 47.48, 48.5, [47480, 48000]),
    s("طلبهن منك", 48.5, 49.32, [48500, 48860]),
    s("مش ضروري", 49.32, 49.92, [49320, 49540]),
    s("تروح بعيد", 49.92, 50.64, [49920, 50220]),
    s("بـ LaserVision Tripoli", 50.64, 51.96, [50640, 51120, 51400]),
    s("نحنا جاهزين", 51.96, 52.68, [51960, 52280]),
    s("نساعدك", 52.68, 53.8, [52680]),
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
  // Glow around (not on) the logo CapCut pops in at 4.97 s (y 1404–1601). Halo frames cover 4.9–6.7 s:
  // Halo in LaserVision secondary #30A4BF: the #005d83 caption glow is the logo's own colour and would not show.
  // python3 scripts/logo-halo.py public/footage/1103/1103.mp4 4.9 6.7 public/footage/1103/logo-halo 1250 1750 "#30A4BF"
  logoGlow: { startMs: 4900, dir: "footage/1103/logo-halo", frames: 54, top: 1250, height: 500 },
};
