import { FrameFitProps } from "../templates/FrameFit";

// ZVC: right vs wrong frame fit. Footage: RIB_0146 (green frame, right) and RIB_0148 (wrong frame).
// Clips go in public/footage/frame-fit/ as H.264 copies of the .mov files.
export const frameFit: FrameFitProps = {
  wrong: { src: "footage/frame-fit/wrong.mp4", srcW: 1402, srcH: 788, centerX: 735 },
  right: { src: "footage/frame-fit/right.mp4", srcW: 1444, srcH: 812, centerX: 742 },
  rate: 0.65,
  clipSec: 6.8,
  // fromClipSec = time in the source clips where she starts that gesture.
  sections: [
    { title: "1. Eyebrow position", wrong: "Eyebrows visible inside the lenses.", right: "Frames sit below the eyebrows.", fromClipSec: 0 },
    { title: "2. Frame alignment", wrong: "Frames are not aligned with the facial contours.", right: "Frames are aligned with the facial contours.", fromClipSec: 1.65 },
    { title: "3. Nose bridge fit", wrong: "Frames do not fit properly on the nose.", right: "Frames fit properly on the nose.", fromClipSec: 3.4 },
  ],
  outroSec: 2.5,
};
