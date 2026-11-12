import { BattleSplitProps } from "../templates/BattleSplit";
import { BattleDiagonalProps } from "../templates/BattleDiagonal";

// ZVC styling battle, shot 1: Joyce (left, red) vs Sara (right, blue).
// Source: Drive file 1FQo_Cg7pUkVRBUHfTFbXY5ugSjbanZNp → public/footage/battle/shot1.mp4 (3.03 s, 4K vertical).
// Cut-outs: scripts/cutout.py → public/footage/battle/fg/.

// v3: vertical split, full-strength colors.
export const stylingBattleShot1: BattleSplitProps = {
  video: "footage/battle/shot1.mp4",
  cutout: "footage/battle/fg",
  volume: 0.6,
  impactSec: 1.3,
  title: "Styling Battle",
  dividerTop: 0.6,
  dividerBottom: 0.46,
  boltWidth: 0.045,
  boltJog: 0.06,
  boltSegments: 2,
  vsY: 0.42,
  namesY: 0.66,
  left: { name: "Joyce", label: "Team Red", color: "#E3202B" },
  right: { name: "Sara", label: "Team Blue", color: "#0F4BF0" },
};

// v4: diagonal split, Joyce top-left, Sara bottom-right, light tint.
export const stylingBattleShot1Diagonal: BattleDiagonalProps = {
  video: "footage/battle/shot1.mp4",
  cutout: "footage/battle/fg",
  sourceSplit: 0.53,
  volume: 0.6,
  impactSec: 1.3,
  title: "Styling Battle",
  yLeft: 0.6,
  yRight: 0.4,
  boltWidth: 0.045,
  boltJog: 0.07,
  boltJogs: 2,
  tint: 0.55,
  left: {
    name: "Joyce",
    label: "Team Red",
    color: "#E3202B",
    framing: { scale: 2, x: -250, y: -1230 },
    tag: { x: 60, y: 560, anchor: "right" },
  },
  right: {
    name: "Sara",
    label: "Team Blue",
    color: "#0F4BF0",
    framing: { scale: 2, x: -1080, y: -260 },
    tag: { x: 60, y: 1180, anchor: "left" },
  },
};
