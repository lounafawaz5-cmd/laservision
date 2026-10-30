import { BeatAdProps } from "../templates/BeatAd";
import { monogram } from "./monogram";

// ZVC · "monogram" reel, v4 (review 30 Oct): calmer, for Monogram's older clientele.
// Song: Melvin Pierce – All Day and All Night, 90.02 BPM (fitted to the kicks; downbeats 0:12.197 + n × 2.666 s).
// Uses the instrumental intro: from the groove entry at 0:09.531 through 8 bars to 0:30.86, then the
// end card over the next bar and a half while the song fades.
// One shot per bar or half bar; dissolves are centred on those lines. Footage at real speed.
const c = (n: string) => `footage/monogram/RIB_${n}.MP4`;

export const monogramCalm: BeatAdProps = {
  ...monogram,
  look: "calm",
  audio: "audio/all-day-and-all-night.mp3",
  audioStartSec: 9.531,
  beatTimesMs: [],
  bpm: 90.02,
  shots: [
    // General view of the Monogram section under the logo.
    { src: c("0179"), at: 0, beats: 8, rate: 1, move: "push" },
    { src: c("0172"), at: 14, beats: 4, rate: 1, move: "push" },
    { src: c("0166"), at: 2, beats: 4, rate: 1, move: "slideL" },
    // Customization: the colored rims, held with no text.
    { src: c("0176"), at: 1, beats: 6, rate: 1, move: "push" },
    { src: c("0183"), at: 1, beats: 4, rate: 1, move: "push" },
    { src: c("0182"), at: 2, beats: 4, rate: 1, move: "slideR" },
    // The flipped oval sunglasses, once.
    { src: c("0169"), at: 0, beats: 4, rate: 1, move: "pull" },
    // Back to the wall for the call to action.
    { src: c("0179"), at: 8, beats: 4, rate: 1, move: "pull" },
  ],
  texts: [
    { text: "brand/monogram-logo-white.png", beat: 0.5, beats: 7, style: "logo" },
    { text: "HANDMADE", beat: 8.5, beats: 3.5, style: "word" },
    { text: "LIGHTWEIGHT", beat: 12.5, beats: 3.5, style: "word" },
    { text: "MINIMALISTIC", beat: 22.5, beats: 3.5, style: "word" },
    { text: "ELEGANT", beat: 30.5, beats: 3.5, style: "word" },
    { text: "Discover the full collection", beat: 34.5, beats: 3.5, style: "cta" },
  ],
  outroBeats: 6,
};
