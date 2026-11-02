import { EditorialProps } from "../templates/Editorial";

// ZVC · Snob Milano fashion edit. Teal frame with a clip-on sun lens: sunglasses and optical in one.
// Footage: Drive "Videos" folder (Sept 29), RIB_0153–0164. All sources are 1080×1920, 50 fps.
// v2 (review 2 Nov): its own editorial template, no beat pulses. Silent until the song is chosen.
const c = (n: string) => `footage/snob/RIB_${n}.MP4`;

export const snob: EditorialProps = {
  audio: "",
  audioStartSec: 0,
  shots: [
    // Hook: the model in the sunglasses, slow motion.
    { src: c("0164"), at: 1.7, rate: 0.6, sec: 2.0 },
    // Unboxing, top-down: bag, box, the case opening on the frame.
    { src: c("0154"), at: 0.4, rate: 1, sec: 1.1 },
    { src: c("0154"), at: 3.3, rate: 1, sec: 1.0 },
    { src: c("0154"), at: 10.2, rate: 1, sec: 1.4 },
    // Frame and clip-on side by side.
    { src: c("0154"), at: 15.9, rate: 0.6, sec: 1.3 },
    // Details: the temple, macro.
    { src: c("0161"), at: 2.0, rate: 0.6, sec: 1.6 },
    { src: c("0160"), at: 1.3, rate: 1, sec: 0.9 },
    // Sun | optical.
    { src: c("0157"), at: 0, rate: 1, sec: 1.8, split: { src: c("0159"), at: 0, rate: 1 }, labels: ["SUN", "OPTICAL"] },
    // The clip-on comes off.
    { src: c("0158"), at: 0, rate: 1, sec: 1.4 },
    // Payoff: she flips the clip-on up, slow motion.
    { src: c("0164"), at: 2.7, rate: 0.6, sec: 3.4 },
  ],
  titles: [
    { text: "Snob\nMilano", sub: "SUN & OPTICAL", at: 0.2, sec: 1.8 },
    { text: "Two looks.\nOne frame.", sub: "SNOB MILANO", at: 14.0, sec: 1.9 },
  ],
  cornerLeft: "ZEISS VISION CENTER",
  cornerRight: "HAZMIEH",
  endSec: 3,
  endLine: "HAZMIEH",
  whatsapp: "81 47 20 20",
};
