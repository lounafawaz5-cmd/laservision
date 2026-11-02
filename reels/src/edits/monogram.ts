import { BeatAdProps } from "../templates/BeatAd";

// ZVC · "monogram" reel (Trello ZVC board). Highlights the Monogram brand: handmade, lightweight, elegant, minimalistic. Footage: Drive Videos/RIB_0166–0183.
// Song: ne zakryl shashku – Mimosa 2000, 147.04 BPM (fitted to the kicks).
// Uses 2:19.85–2:39.4: 8 beats of the lead-in, the 32-beat main drop (first kick 2:23.112),
// then the first 8 beats of the bass-less break under the end card.
// Edit beat 8 = the drop. The drop's heavy hits fall on beats 0 and 2.5 of every bar.
const c = (n: string) => `footage/monogram/RIB_${n}.MP4`;

export const monogram: BeatAdProps = {
  brand: "zvc",
  look: "energetic",
  audio: "audio/mimosa-2000.mp3",
  audioStartSec: 139.848,
  beatTimesMs: [],
  bpm: 147.04,
  // v3 (review 26 Oct): slower. Ten shots at 1–1.5× instead of 26 at up to 4×, no stutter,
  // the wall as a general view of the Monogram section at the start and end,
  // a long hold on the colored-rim tray (customization), the flipped oval sunglasses once only.
  // Cuts still land on the lead-in plucks and the drop's heavy hits (beats 0 / 2.5 / 4 / 6.5 of each 8).
  shots: [
    // Lead-in: general view of the section, then the Monogram sign.
    { src: c("0179"), at: 0, beats: 5.5, rate: 1, move: "push" },
    { src: c("0182"), at: 2, beats: 2.5, rate: 1, move: "push" },
    // Drop.
    { src: c("0172"), at: 14, beats: 4, rate: 1, move: "punch", flash: true },
    { src: c("0166"), at: 2, beats: 4, rate: 1.5, move: "slideL" },
    { src: c("0183"), at: 1, beats: 4, rate: 1, move: "push" },
    { src: c("0181"), at: 2, beats: 4, rate: 1.5, move: "slideR" },
    // Customization: colored rims, held long and at real speed.
    { src: c("0176"), at: 1, beats: 6.5, rate: 1, move: "push" },
    { src: c("0167"), at: 4, beats: 1.5, rate: 1.5, move: "push" },
    { src: c("0169"), at: 0, beats: 4, rate: 1, move: "pull" },
    // Close on the wall again under the call to action.
    { src: c("0179"), at: 8, beats: 4, rate: 1, move: "pull" },
  ],
  // Brand-led: Monogram logo, then its four key points; the colored-rim hold stays clean.
  texts: [
    { text: "brand/monogram-logo-white.png", beat: 0, beats: 8, style: "logo" },
    { text: "HANDMADE", beat: 8, beats: 4, style: "word" },
    { text: "LIGHTWEIGHT", beat: 16, beats: 3.5, style: "word" },
    { text: "MINIMALISTIC", beat: 20, beats: 3.5, style: "word" },
    { text: "ELEGANT", beat: 32, beats: 4, style: "word" },
    { text: "Discover the full collection", beat: 36, beats: 4, style: "cta" },
  ],
  hudLogo: "brand/monogram-wordmark-white.png",
  outroBeats: 8,
  outroLogo: "brand/monogram-logo-white.png",
  outroLine: "HAZMIEH",
  whatsapp: "81 47 20 20",
};
