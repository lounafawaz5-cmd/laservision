import { FrameFitProps } from "../templates/FrameFit";

// ZVC: right vs wrong frame fit. Footage: RIB_0146 (green frame, right) and RIB_0148 (wrong frame).
// Clips go in public/footage/frame-fit/ (H.264 copies of the .mov files + first-frame PNGs); ding in public/audio/.
export const frameFit: FrameFitProps = {
  title: "How should your frames fit?",
  wrong: {
    src: "footage/frame-fit/wrong.mp4",
    still: "footage/frame-fit/wrong-first.png",
    srcW: 1402,
    srcH: 788,
    centerX: 735,
    glasses: { lenses: [[[657.5, 176.2], [682.5, 172.5], [715.0, 172.0], [742.5, 175.0], [757.5, 180.0], [763.8, 190.0], [767.5, 207.5], [767.5, 230.0], [763.8, 247.5], [756.2, 260.0], [740.0, 267.5], [710.0, 269.5], [680.0, 267.5], [665.0, 260.0], [660.0, 245.0], [657.5, 220.0], [656.2, 195.0]], [[800.0, 180.0], [815.0, 176.2], [845.0, 175.0], [875.0, 176.2], [895.0, 178.8], [903.8, 187.5], [907.5, 207.5], [907.5, 232.5], [905.0, 255.0], [897.5, 267.5], [880.0, 272.5], [845.0, 273.8], [815.0, 271.2], [803.8, 262.5], [800.0, 245.0], [796.2, 222.5], [796.2, 197.5]]], parts: [[[643.8, 194.5], [657.5, 193.8], [657.5, 206.2], [643.8, 205.5]], [[905.0, 205.0], [916.2, 203.8], [916.2, 216.2], [906.2, 217.0]], [[766.2, 201.2], [800.0, 200.0], [800.0, 208.8], [766.2, 210.0]]] },
  },
  right: {
    src: "footage/frame-fit/right.mp4",
    still: "footage/frame-fit/right-first.png",
    srcW: 1444,
    srcH: 812,
    centerX: 742,
    glasses: { lenses: [[[621.2, 187.5], [642.5, 182.0], [667.5, 180.5], [692.5, 182.0], [715.0, 186.2], [725.0, 193.8], [728.0, 207.5], [726.2, 225.0], [721.2, 242.5], [712.5, 257.5], [697.5, 267.0], [675.0, 270.5], [650.0, 268.0], [633.8, 258.8], [623.8, 243.8], [620.0, 225.0], [619.5, 205.0]], [[755.0, 200.0], [770.0, 193.8], [792.5, 192.0], [817.5, 193.8], [842.5, 198.0], [857.5, 203.8], [860.0, 215.0], [857.0, 232.5], [852.5, 250.0], [843.8, 265.0], [827.5, 276.2], [805.0, 280.0], [782.5, 276.2], [766.2, 263.8], [758.8, 247.5], [755.0, 230.0], [753.8, 212.5]]], parts: [[[605.0, 187.0], [622.5, 185.0], [622.5, 198.8], [605.0, 198.0]], [[855.0, 202.5], [872.5, 208.0], [872.0, 218.0], [856.2, 216.2]], [[723.8, 200.0], [730.0, 201.2], [752.5, 201.2], [758.8, 198.8], [758.8, 211.2], [752.5, 210.0], [730.0, 210.0], [725.0, 212.5]]] },
  },
  introSec: 1.8,
  rate: 0.65,
  clipSec: 6.8,
  ding: "audio/ding.wav",
  dingsSec: [0.3, 0.75],
  // fromClipSec = time in the source clips where she starts that gesture.
  sections: [
    { title: "1. Eyebrow position", wrong: "Eyebrows visible inside the lenses.", right: "Frames sit below the eyebrows.", fromClipSec: 0 },
    { title: "2. Frame alignment", wrong: "Frames are not aligned with the facial contours.", right: "Frames are aligned with the facial contours.", fromClipSec: 1.65 },
    { title: "3. Nose bridge fit", wrong: "Frames do not fit properly on the nose.", right: "Frames fit properly on the nose.", fromClipSec: 3.4 },
  ],
  outroSec: 2.5,
};
