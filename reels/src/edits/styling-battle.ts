import { BattleSplitProps } from "../templates/BattleSplit";

// ZVC styling battle, shot 1: Joyce (left, red) vs Sara (right, blue).
// Source: Drive file 1FQo_Cg7pUkVRBUHfTFbXY5ugSjbanZNp → public/footage/battle/shot1.mp4 (3.03 s, 4K vertical).
// Cut-outs: scripts/cutout.py → public/footage/battle/fg/.
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
