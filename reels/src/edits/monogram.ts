import { BeatAdProps } from "../templates/BeatAd";

// ZVC · "monogram" reel (Trello ZVC board). Footage: Drive Videos/RIB_0166–0183.
// Song: Mimosa 2000. Until the track is in public/audio/, the cut runs on an even 120 BPM grid.
const c = (n: string) => `footage/monogram/RIB_${n}.MP4`;

export const monogram: BeatAdProps = {
  brand: "zvc",
  audio: "",
  audioStartSec: 0,
  beatTimesMs: [],
  bpm: 120,
  shots: [
    // Intro, 2 beats a shot: set the scene and the name.
    { src: c("0179"), at: 1, beats: 2, rate: 2, move: "push" },
    { src: c("0172"), at: 13, beats: 2, rate: 2, move: "punch", flash: true },
    { src: c("0170"), at: 3, beats: 2, rate: 1.5, move: "punch" },
    { src: c("0182"), at: 2, beats: 2, rate: 2, move: "slideL" },
    // Build, 1 beat a shot: optical, then sun.
    { src: c("0166"), at: 2, beats: 1, rate: 3, move: "punch", flash: true },
    { src: c("0176"), at: 2, beats: 1, rate: 3, move: "slideR" },
    { src: c("0167"), at: 4, beats: 1, rate: 3, move: "punch" },
    { src: c("0176"), at: 9, beats: 1, rate: 3, move: "spin" },
    { src: c("0168"), at: 2, beats: 1, rate: 3, move: "punch", flash: true },
    { src: c("0183"), at: 1, beats: 1, rate: 3, move: "slideL" },
    { src: c("0169"), at: 3, beats: 1, rate: 3, move: "punch" },
    { src: c("0181"), at: 2, beats: 1, rate: 3, move: "spin" },
    // Stutter, half a beat a shot, into the drop.
    { src: c("0172"), at: 18, beats: 0.5, rate: 4, move: "punch", flash: true },
    { src: c("0183"), at: 6, beats: 0.5, rate: 4, move: "punch" },
    { src: c("0167"), at: 12, beats: 0.5, rate: 4, move: "punch", flash: true },
    { src: c("0168"), at: 9, beats: 0.5, rate: 4, move: "punch" },
    { src: c("0166"), at: 7, beats: 0.5, rate: 4, move: "punch", flash: true },
    { src: c("0181"), at: 9, beats: 0.5, rate: 4, move: "punch" },
    { src: c("0176"), at: 5, beats: 0.5, rate: 4, move: "punch", flash: true },
    { src: c("0169"), at: 14, beats: 0.5, rate: 4, move: "punch" },
    // Drop: one slow hero shot, then 2-beat heroes.
    { src: c("0169"), at: 0, beats: 4, rate: 1, move: "pull", flash: true },
    { src: c("0183"), at: 4, beats: 2, rate: 1.5, move: "push" },
    { src: c("0168"), at: 6, beats: 2, rate: 1.5, move: "spin" },
    { src: c("0171"), at: 24, beats: 2, rate: 1, move: "push" },
    { src: c("0170"), at: 10, beats: 2, rate: 2, move: "punch", flash: true },
  ],
  texts: [
    { text: "MONOGRAM", beat: 0, beats: 4, style: "letters" },
    { text: "for ZEISS", beat: 4, beats: 4, style: "small" },
    { text: "OPTICAL", beat: 8, beats: 2, style: "slam" },
    { text: "SUN", beat: 12, beats: 2, style: "slam" },
    { text: "MONOGRAM\nfor ZEISS", beat: 20, beats: 4, style: "outline" },
    { text: "NOW IN STORE", beat: 30, beats: 2, style: "tag" },
  ],
  outroBeats: 8,
  outroTitle: "MONOGRAM",
  outroLine: "Hazmieh · WhatsApp 81 47 20 20",
};
