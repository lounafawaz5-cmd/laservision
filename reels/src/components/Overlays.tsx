import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Flat illustrated overlays for the visual field reel. Cartoon, not realistic, LaserVision colours only
// (brand/laservision/GUIDELINES.md). Each pops in with a little overshoot and shrinks away at the end.
const C = { navy: "#00303F", blue: "#005D83", cyan: "#30A4BF", ice: "#B6DFE5", light: "#F1F2F2" };

const usePop = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 10, stiffness: 160, mass: 0.7 } });
  const exit = spring({ frame: frame - (durationInFrames - 8), fps, config: { damping: 200 } });
  return { frame, fps, durationInFrames, enter, scale: enter * (1 - exit), t: frame / fps };
};

const shadow = "drop-shadow(0 12px 20px rgba(0,30,45,0.35))";

// "Not just what the eye sees in front of it, but also on the sides": a cartoon eye at chest height,
// then two lines leave the pupil and run out horizontally to the left and right edges of the frame.
export const FieldEye: React.FC<{ y: number; spreadAtMs: number }> = ({ y, spreadAtMs }) => {
  const { scale, frame, fps, durationInFrames } = usePop();
  const { width } = useVideoConfig();
  const cx = width / 2;
  const eyeW = 300;
  // Lines leave the pupil on "على الجوانب" (`spreadAtMs` after the eye pops) and reach the edges in ~0.7 s.
  const s0 = (spreadAtMs / 1000) * fps;
  const reach = interpolate(frame, [s0, s0 + 0.7 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ease = 1 - Math.pow(1 - reach, 3);
  const fadeOut = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const left = cx - ease * cx;
  const right = cx + ease * cx;
  // Pupil looks straight ahead the whole time: the point is seeing the sides without moving the eye.
  return (
    <AbsoluteFill>
      <svg width={width} height={1920} style={{ position: "absolute", inset: 0, opacity: fadeOut, filter: shadow }}>
        <defs>
          <linearGradient id="fadeL" x1="1" x2="0">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="fadeR" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#ffffff" />
          </linearGradient>
        </defs>
        {reach > 0 ? (
          <g strokeLinecap="round">
            {/* Soft field band between the two lines */}
            <path d={`M ${cx} ${y} L ${left} ${y - 10 - ease * 40} L ${left} ${y + 10 + ease * 40} Z`} fill={C.cyan} opacity={0.35} />
            <path d={`M ${cx} ${y} L ${right} ${y - 10 - ease * 40} L ${right} ${y + 10 + ease * 40} Z`} fill={C.cyan} opacity={0.35} />
            <line x1={cx} y1={y} x2={left} y2={y} stroke="url(#fadeL)" strokeWidth={16} style={{ filter: `drop-shadow(0 0 10px ${C.cyan})` }} />
            <line x1={cx} y1={y} x2={right} y2={y} stroke="url(#fadeR)" strokeWidth={16} style={{ filter: `drop-shadow(0 0 10px ${C.cyan})` }} />
            {/* Arrow heads at the edges once they arrive */}
            <g opacity={interpolate(reach, [0.85, 1], [0, 1], { extrapolateLeft: "clamp" })}>
              <path d={`M ${left + 34} ${y - 22} L ${left + 6} ${y} L ${left + 34} ${y + 22}`} stroke="#ffffff" strokeWidth={14} fill="none" strokeLinejoin="round" />
              <path d={`M ${right - 34} ${y - 22} L ${right - 6} ${y} L ${right - 34} ${y + 22}`} stroke="#ffffff" strokeWidth={14} fill="none" strokeLinejoin="round" />
            </g>
          </g>
        ) : null}
        <g transform={`translate(${cx} ${y}) scale(${scale})`}>
          <CartoonEye w={eyeW} open={1} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// Almond eye: white sclera with a navy outline, teal iris, navy pupil, a highlight. `open` 0..1 closes the lids.
const CartoonEye: React.FC<{ w: number; open: number }> = ({ w, open }) => {
  const h = w * 0.62 * Math.max(open, 0.12);
  const lid = `M ${-w / 2} 0 Q 0 ${-h} ${w / 2} 0 Q 0 ${h} ${-w / 2} 0 Z`;
  const r = w * 0.2;
  return (
    <g>
      <clipPath id={`eye-${w}-${Math.round(open * 100)}`}>
        <path d={lid} />
      </clipPath>
      <path d={lid} fill="#fff" />
      <g clipPath={`url(#eye-${w}-${Math.round(open * 100)})`}>
        <circle r={r} fill={C.cyan} />
        <circle r={r * 0.72} fill={C.blue} />
        <circle r={r * 0.42} fill={C.navy} />
        <circle cx={r * 0.32} cy={-r * 0.34} r={r * 0.2} fill="#fff" />
      </g>
      <path d={lid} fill="none" stroke={C.navy} strokeWidth={w * 0.045} strokeLinejoin="round" />
    </g>
  );
};

// "...and some problems linked to the brain": a cartoon brain beside her head, rocking softly.
export const RockingBrain: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  const { scale, t, enter } = usePop();
  const rock = Math.sin(t * Math.PI * 1.1) * 7; // ±7°, about 0.55 Hz: soft, not wobbly
  const rot = rock + interpolate(enter, [0, 1], [-12, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        transform: `scale(${scale}) rotate(${rot}deg)`,
        transformOrigin: "50% 85%",
        filter: shadow,
      }}
    >
      <BrainArt />
    </div>
  );
};

const BrainArt: React.FC = () => (
  <svg viewBox="0 0 300 260" width="100%" height="100%">
    {/* Outer outline in navy, two hemispheres made of rounded lobes */}
    <g stroke={C.navy} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round">
      <path
        d="M150 38 C 128 14, 88 16, 78 40 C 50 34, 28 58, 36 84 C 14 96, 12 132, 34 146 C 22 172, 44 200, 72 196 C 82 220, 118 226, 136 206 C 142 214, 150 214, 150 214 Z"
        fill={C.ice}
      />
      <path
        d="M150 38 C 172 14, 212 16, 222 40 C 250 34, 272 58, 264 84 C 286 96, 288 132, 266 146 C 278 172, 256 200, 228 196 C 218 220, 182 226, 164 206 C 158 214, 150 214, 150 214 Z"
        fill="#d7eef2"
      />
      {/* Stem */}
      <path d="M140 210 C 142 230, 140 244, 132 252 L 166 252 C 160 242, 158 228, 160 210" fill={C.cyan} />
      {/* Folds */}
      <g fill="none" strokeWidth={7} stroke={C.blue}>
        <path d="M150 44 L150 206" stroke={C.navy} strokeWidth={8} />
        <path d="M84 62 C 104 60, 112 76, 104 92" />
        <path d="M54 110 C 76 100, 96 112, 92 132" />
        <path d="M66 168 C 82 152, 108 158, 112 176" />
        <path d="M118 112 C 128 124, 126 142, 114 150" />
        <path d="M216 62 C 196 60, 188 76, 196 92" />
        <path d="M246 110 C 224 100, 204 112, 208 132" />
        <path d="M234 168 C 218 152, 192 158, 188 176" />
        <path d="M182 112 C 172 124, 174 142, 186 150" />
      </g>
    </g>
    {/* Shine */}
    <ellipse cx={98} cy={58} rx={16} ry={8} fill="#fff" opacity={0.8} transform="rotate(-25 98 58)" />
  </svg>
);

// "...about the health of the eye": two cartoon eyes that squint (lids close to a slit and reopen) twice.
export const SquintEyes: React.FC<{ y: number; eyeWidth: number }> = ({ y, eyeWidth }) => {
  const { scale, t } = usePop();
  const { width } = useVideoConfig();
  // Open → squint → open → squint, each squint ~0.35 s, starting after the pop lands.
  const squint = (at: number) => interpolate(t, [at, at + 0.15, at + 0.4, at + 0.6], [1, 0.22, 0.22, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const open = Math.min(squint(0.5), squint(1.5));
  const gap = eyeWidth * 0.18;
  const brow = (1 - open) * 18; // brows dip a little as the eyes squint
  return (
    <AbsoluteFill>
      <svg width={width} height={1920} style={{ position: "absolute", inset: 0, filter: shadow }}>
        <g transform={`translate(${width / 2} ${y}) scale(${scale})`}>
          {[-1, 1].map((side) => (
            <g key={side} transform={`translate(${side * (eyeWidth / 2 + gap / 2)} 0)`}>
              <CartoonEye w={eyeWidth} open={open} />
              <path
                d={`M ${-eyeWidth * 0.42} ${-eyeWidth * 0.42 + brow} Q 0 ${-eyeWidth * 0.6 + brow} ${eyeWidth * 0.42} ${-eyeWidth * 0.42 + brow + side * 6}`}
                stroke={C.navy}
                strokeWidth={eyeWidth * 0.07}
                fill="none"
                strokeLinecap="round"
                transform={side === 1 ? "scale(-1 1)" : undefined}
              />
            </g>
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// LaserVision logo from the vector export (3230 px PNG), with a halo AROUND it (CLAUDE.md: never glow on the logo).
// The halo is a blurred copy behind the sharp logo, in secondary teal so it shows against the navy scrubs.
export const LogoPop: React.FC<{ y: number; width: number; src: string }> = ({ y, width, src }) => {
  const { scale, t } = usePop();
  const { width: W } = useVideoConfig();
  const glow = interpolate(t, [0, 0.5, 0.9, 1.3], [0.4, 1, 0.75, 0.95], { extrapolateRight: "clamp" });
  const h = width * (670 / 3230);
  const box: React.CSSProperties = { position: "absolute", left: (W - width) / 2, top: y - h / 2, width, height: h };
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: `50% ${y}px` }}>
      <Img src={staticFile(src)} style={{ ...box, filter: `blur(18px) drop-shadow(0 0 22px ${C.cyan}) drop-shadow(0 0 30px ${C.cyan})`, opacity: glow }} />
      <Img src={staticFile(src)} style={box} />
    </AbsoluteFill>
  );
};
