import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// Flat illustrated stickers for medical terms. Not realistic on purpose: they only need to say
// "this is the OCT machine" / "this is an angiography" at a glance. LaserVision colors only.
const C = { navy: "#00303F", blue: "#005D83", cyan: "#30A4BF", ice: "#B6DFE5", light: "#F1F2F2" };
const LABEL_FONT = "\"Montserrat Arabic\", sans-serif"; // brand/Video_Editing_Guide.pdf: all on-screen text

export type StickerKind = "oct" | "angiography";

// Pops in with a little overshoot and tilt, floats while on screen, shrinks away at the end.
export const Sticker: React.FC<{ kind: StickerKind; x: number; y: number; size: number; tilt: number }> = ({
  kind,
  x,
  y,
  size,
  tilt,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 9, stiffness: 160, mass: 0.7 } });
  const exit = spring({ frame: frame - (durationInFrames - 8), fps, config: { damping: 200 } });
  const scale = enter * (1 - exit);
  const bob = Math.sin((frame / fps) * Math.PI * 1.2) * 6;
  const rot = tilt + interpolate(enter, [0, 1], [-14, 0]) + Math.sin((frame / fps) * Math.PI) * 1.2;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + bob,
        width: size,
        height: size,
        transform: `scale(${scale}) rotate(${rot}deg)`,
        transformOrigin: "50% 60%",
        filter: "drop-shadow(0 14px 22px rgba(0,30,45,0.35))",
      }}
    >
      {kind === "oct" ? <OctArt /> : <AngiographyArt />}
    </div>
  );
};

const Label: React.FC<{ text: string; width: number }> = ({ text, width }) => (
  <g>
    <rect x={(400 - width) / 2} y={334} width={width} height={50} rx={25} fill={C.blue} stroke="#fff" strokeWidth={6} />
    <text
      x={200}
      y={368}
      textAnchor="middle"
      fill="#fff"
      fontFamily={LABEL_FONT}
      fontWeight={700}
      fontSize={28}
      letterSpacing={2}
    >
      {text}
    </text>
  </g>
);

// Tabletop OCT: base, column, scan head with lens, chin rest, and a monitor showing retinal layers.
const OctArt: React.FC = () => (
  <svg viewBox="0 0 400 400" width="100%" height="100%">
    {/* Sticker backing: white die-cut outline around a soft card */}
    <rect x={14} y={14} width={372} height={340} rx={46} fill="#fff" />
    <rect x={26} y={26} width={348} height={316} rx={36} fill={C.light} />

    {/* Monitor with the OCT B-scan (stacked retinal layers with the foveal dip) */}
    <rect x={196} y={52} width={156} height={112} rx={12} fill={C.navy} />
    <rect x={206} y={62} width={136} height={84} rx={6} fill="#06222d" />
    {[
      { d: 0, c: C.ice, w: 5 },
      { d: 10, c: C.cyan, w: 4 },
      { d: 19, c: "#e7f6f8", w: 3 },
      { d: 28, c: C.cyan, w: 6 },
      { d: 40, c: C.ice, w: 3 },
    ].map((l, i) => (
      <path
        key={i}
        d={`M212 ${84 + l.d} C 240 ${84 + l.d}, 255 ${84 + l.d}, 268 ${96 + l.d * 0.85} S 300 ${84 + l.d}, 336 ${84 + l.d}`}
        stroke={l.c}
        strokeWidth={l.w}
        fill="none"
        strokeLinecap="round"
        opacity={0.95}
      />
    ))}
    <rect x={262} y={164} width={24} height={16} fill={C.navy} />
    <rect x={244} y={178} width={60} height={8} rx={4} fill={C.navy} />

    {/* Table and base */}
    <rect x={44} y={292} width={312} height={18} rx={9} fill={C.navy} />
    <rect x={70} y={258} width={170} height={36} rx={10} fill={C.blue} />
    <rect x={92} y={268} width={36} height={12} rx={6} fill={C.ice} />

    {/* Column and scan head */}
    <rect x={136} y={176} width={40} height={84} rx={8} fill={C.blue} />
    <rect x={90} y={110} width={122} height={82} rx={20} fill={C.blue} />
    <rect x={98} y={118} width={106} height={20} rx={10} fill="#1b7aa0" />
    {/* Lens facing the patient side */}
    <circle cx={92} cy={156} r={26} fill={C.navy} />
    <circle cx={92} cy={156} r={17} fill={C.cyan} />
    <circle cx={92} cy={156} r={8} fill={C.ice} />
    <circle cx={86} cy={150} r={4} fill="#fff" />

    {/* Chin rest frame */}
    <rect x={44} y={96} width={8} height={168} rx={4} fill={C.navy} />
    <rect x={44} y={96} width={30} height={8} rx={4} fill={C.navy} />
    <rect x={40} y={208} width={34} height={12} rx={6} fill={C.ice} stroke={C.navy} strokeWidth={3} />

    <Label text="OCT" width={130} />
  </svg>
);

// Fluorescein angiography look: dark fundus, bright branching vessels from the optic disc.
const AngiographyArt: React.FC = () => {
  const disc = { x: 236, y: 172 };
  // Main arcades leave the disc up and down, then sweep left around the macula.
  const vessels = [
    `M${disc.x} ${disc.y} C 220 120, 170 92, 108 104`,
    `M${disc.x} ${disc.y} C 222 224, 172 252, 108 242`,
    `M${disc.x} ${disc.y} C 250 126, 268 104, 300 92`,
    `M${disc.x} ${disc.y} C 252 220, 270 244, 302 254`,
    `M190 112 C 170 128, 150 140, 128 140`,
    `M188 236 C 170 220, 150 210, 128 210`,
    `M150 98 C 140 80, 126 74, 110 76`,
    `M150 248 C 140 266, 126 272, 110 270`,
    `M${disc.x} ${disc.y} C 280 168, 300 170, 318 176`,
    `M272 104 C 280 84, 292 76, 300 70`,
    `M276 242 C 284 262, 294 270, 300 276`,
  ];
  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%">
      <defs>
        <radialGradient id="fundus" cx="0.55" cy="0.48" r="0.6">
          <stop offset="0" stopColor="#0e4a5e" />
          <stop offset="0.7" stopColor={C.navy} />
          <stop offset="1" stopColor="#041a22" />
        </radialGradient>
        <filter id="vglow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="eye">
          <circle cx={200} cy={174} r={142} />
        </clipPath>
      </defs>

      {/* White die-cut backing */}
      <circle cx={200} cy={174} r={162} fill="#fff" />
      <circle cx={200} cy={174} r={142} fill="url(#fundus)" />
      <g clipPath="url(#eye)" filter="url(#vglow)">
        {vessels.map((d, i) => (
          <path key={i} d={d} stroke={i < 4 ? "#eafaff" : C.ice} strokeWidth={i < 4 ? 7 : 4} fill="none" strokeLinecap="round" />
        ))}
        {/* Macula: the darker spot the arcades curve around */}
        <circle cx={150} cy={174} r={26} fill="#031419" opacity={0.7} />
        {/* Optic disc */}
        <circle cx={disc.x} cy={disc.y} r={24} fill={C.ice} />
        <circle cx={disc.x + 3} cy={disc.y - 2} r={12} fill="#fff" />
      </g>
      <circle cx={200} cy={174} r={142} fill="none" stroke={C.cyan} strokeWidth={4} opacity={0.6} />

      <Label text="ANGIOGRAPHY" width={250} />
    </svg>
  );
};
