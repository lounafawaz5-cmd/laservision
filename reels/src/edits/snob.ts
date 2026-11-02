import { EditorialProps } from "../templates/Editorial";

// ZVC · Snob Milano fashion edit. Teal frame with a clip-on sun lens: sunglasses and optical in one.
// Footage: Drive "Videos" folder (Sept 29), RIB_0153–0164. All sources are 1080×1920, 50 fps.
// v2 (review 2 Nov): its own editorial template, no beat pulses. Silent until the song is chosen.
// v3: unboxing (RIB_0154) removed; Luna edits it herself and links it. Standard brand end card.
// v4: the bag handover (RIB_0153) back in as the closing shot.
const c = (n: string) => `footage/snob/RIB_${n}.MP4`;

export const snob: EditorialProps = {
  audio: "",
  audioStartSec: 0,
  shots: [
    // Hook: the model in the sunglasses, slow motion.
    { src: c("0164"), at: 1.7, rate: 0.6, sec: 2.0 },
    // Details: the temple, macro.
    { src: c("0161"), at: 2.0, rate: 0.6, sec: 1.6 },
    { src: c("0160"), at: 1.3, rate: 1, sec: 0.9 },
    // Sun | optical.
    { src: c("0157"), at: 0, rate: 1, sec: 1.8, split: { src: c("0159"), at: 0, rate: 1 }, labels: ["SUN", "OPTICAL"] },
    // The clip-on comes off.
    { src: c("0158"), at: 0, rate: 1, sec: 1.4 },
    // Payoff: she flips the clip-on up, slow motion.
    { src: c("0164"), at: 2.7, rate: 0.6, sec: 3.4 },
    // Close: the Snob bag handed over the counter.
    { src: c("0153"), at: 1.0, rate: 1, sec: 2.0 },
  ],
  titles: [
    { text: "Snob\nMilano", sub: "SUN & OPTICAL", at: 0.2, sec: 1.8 },
    { text: "Two looks.\nOne frame.", sub: "SNOB MILANO", at: 9.2, sec: 1.9 },
  ],
  cornerLeft: "ZEISS VISION CENTER",
  cornerRight: "HAZMIEH",
};
