import { BeatAdProps } from "../templates/BeatAd";

// ZVC · "monogram" reel (Trello ZVC board). Highlights the Monogram brand: handmade, lightweight, elegant, minimalistic. Footage: Drive Videos/RIB_0166–0183.
// Song: ne zakryl shashku – Mimosa 2000, 147.04 BPM (fitted to the kicks).
// Uses 2:19.85–2:39.4: 8 beats of the lead-in, the 32-beat main drop (first kick 2:23.112),
// then the first 8 beats of the bass-less break under the end card.
// Edit beat 8 = the drop. The drop's heavy hits fall on beats 0 and 2.5 of every bar,
// so drop shots run 2.5 + 1.5 beats to cut on them.
const c = (n: string) => `footage/monogram/RIB_${n}.MP4`;

export const monogram: BeatAdProps = {
  brand: "zvc",
  audio: "audio/mimosa-2000.mp3",
  audioStartSec: 139.848,
  beatTimesMs: [],
  bpm: 147.04,
  shots: [
    // Lead-in (beats 0–8): cuts on the plucks at 0, 3, 4, 5.5, 7.
    { src: c("0179"), at: 1, beats: 3, rate: 1.5, move: "push" },
    { src: c("0172"), at: 13, beats: 1, rate: 2, move: "punch", flash: true },
    { src: c("0170"), at: 3, beats: 1.5, rate: 1.5, move: "punch" },
    { src: c("0182"), at: 2, beats: 1.5, rate: 2, move: "slideL" },
    { src: c("0171"), at: 4, beats: 1, rate: 2, move: "punch" },
    // Drop bars 1–2: optical.
    { src: c("0166"), at: 2, beats: 2.5, rate: 3, move: "punch", flash: true },
    { src: c("0176"), at: 2, beats: 1.5, rate: 3, move: "slideR" },
    { src: c("0167"), at: 4, beats: 2.5, rate: 3, move: "punch", flash: true },
    { src: c("0176"), at: 8, beats: 1.5, rate: 3, move: "spin" },
    // Drop bars 3–4: sun.
    { src: c("0168"), at: 2, beats: 2.5, rate: 3, move: "punch", flash: true },
    { src: c("0183"), at: 1, beats: 1.5, rate: 3, move: "slideL" },
    { src: c("0169"), at: 3, beats: 2.5, rate: 3, move: "punch", flash: true },
    { src: c("0181"), at: 2, beats: 1.5, rate: 3, move: "spin" },
    // Drop bar 5: half-beat stutter.
    { src: c("0172"), at: 18, beats: 0.5, rate: 4, move: "punch", flash: true },
    { src: c("0183"), at: 6, beats: 0.5, rate: 4, move: "punch" },
    { src: c("0167"), at: 12, beats: 0.5, rate: 4, move: "punch", flash: true },
    { src: c("0168"), at: 9, beats: 0.5, rate: 4, move: "punch" },
    { src: c("0166"), at: 7, beats: 0.5, rate: 4, move: "punch", flash: true },
    { src: c("0181"), at: 9, beats: 0.5, rate: 4, move: "punch" },
    { src: c("0176"), at: 5, beats: 0.5, rate: 4, move: "punch", flash: true },
    { src: c("0169"), at: 14, beats: 0.5, rate: 4, move: "punch" },
    // Drop bar 6.
    { src: c("0179"), at: 8, beats: 2.5, rate: 3, move: "slideR", flash: true },
    { src: c("0182"), at: 6, beats: 1.5, rate: 3, move: "punch" },
    // Drop bars 7–8: hero.
    { src: c("0169"), at: 0, beats: 4, rate: 1, move: "pull", flash: true },
    { src: c("0183"), at: 5, beats: 2.5, rate: 1.5, move: "push" },
    { src: c("0170"), at: 10, beats: 1.5, rate: 2, move: "punch", flash: true },
  ],
  // Brand-led: Monogram logo, then its four key points on the drop's big hits.
  texts: [
    { text: "brand/monogram-logo-white.png", beat: 0, beats: 8, style: "logo" },
    { text: "HANDMADE", beat: 8, beats: 4, style: "word" },
    { text: "LIGHTWEIGHT", beat: 16, beats: 4, style: "word" },
    { text: "ELEGANT", beat: 28, beats: 4, style: "word" },
    { text: "MINIMALISTIC", beat: 32, beats: 4, style: "word" },
    { text: "Discover the full collection", beat: 36, beats: 4, style: "cta" },
  ],
  hudLogo: "brand/monogram-wordmark-white.png",
  outroBeats: 8,
  outroLogo: "brand/monogram-logo-white.png",
  outroLine: "HAZMIEH",
  whatsapp: "81 47 20 20",
};
