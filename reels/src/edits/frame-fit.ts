import { FrameFitProps } from "../templates/FrameFit";

// ZVC: right vs wrong frame fit. Footage: RIB_0146 (green frame, right) and RIB_0148 (wrong frame).
// Clips go in public/footage/frame-fit/ (H.264 copies of the .mov files + first-frame PNGs); ding in public/audio/.
export const frameFit: FrameFitProps = {
  title: "How should your frames fit?",
  wrong: {
    src: "footage/frame-fit/wrong.mp4",
    still: "footage/frame-fit/wrong-first.png",
    srcW: 1444,
    srcH: 812,
    centerX: 777,
    glasses: { x: 777, y: 222, w: 265, h: 105 },
  },
  right: {
    src: "footage/frame-fit/right.mp4",
    still: "footage/frame-fit/right-first.png",
    srcW: 1402,
    srcH: 788,
    centerX: 737,
    glasses: { x: 737, y: 222, w: 275, h: 95 },
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
