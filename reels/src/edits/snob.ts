import { BeatAdProps } from "../templates/BeatAd";

// ZVC · Snob Milano fashion edit. Teal frame with a clip-on sun lens: sunglasses and optical in one.
// Footage: Drive "Videos" folder (Sept 29), RIB_0153–0164 (0154 and 0164 pending: over the connector's 10 MB limit).
// Draft v1: silent, on an even 120 BPM grid (1 beat = 0.5 s). Swap in the song + its bpm/start once chosen.
const c = (n: string) => `footage/snob/RIB_${n}.MP4`;

export const snob: BeatAdProps = {
  brand: "zvc",
  look: "energetic",
  audio: "",
  audioStartSec: 0,
  beatTimesMs: [],
  bpm: 120,
  shots: [
    // The bag lands on the counter.
    { src: c("0153"), at: 0.2, beats: 5.5, rate: 1, move: "push" },
    // Flat-lay: the sunglasses.
    { src: c("0157"), at: 0, beats: 3, rate: 1, move: "punch", flash: true },
    // Details: the temple, macro.
    { src: c("0161"), at: 2.0, beats: 3, rate: 1, move: "slideL" },
    { src: c("0160"), at: 1.4, beats: 1.5, rate: 1, move: "punch" },
    // Sun → optical: the clip-on comes off.
    { src: c("0163"), at: 0, beats: 4, rate: 1, move: "push", flash: true },
    { src: c("0158"), at: 0, beats: 3, rate: 1, move: "slideR" },
    // Optical: the Snob logo on the lens.
    { src: c("0159"), at: 0, beats: 4, rate: 1, move: "push" },
    // And back to sun.
    { src: c("0163"), at: 2.6, beats: 2, rate: 1, move: "punch", flash: true },
  ],
  texts: [
    { text: "SNOB MILANO", beat: 0, beats: 2.5, style: "word" },
    { text: "SUN", beat: 13, beats: 1.5, style: "word" },
    { text: "OPTICAL", beat: 20, beats: 3.5, style: "word" },
    { text: "ONE FRAME", beat: 24, beats: 2, style: "word" },
  ],
  hudLogo: "",
  outroBeats: 6,
  outroLogo: "",
  outroLine: "HAZMIEH",
  whatsapp: "81 47 20 20",
};
