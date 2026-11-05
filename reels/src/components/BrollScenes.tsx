import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";

// Animated B-roll for moments with no footage. Flat illustration in LaserVision colours, same family as Overlays.tsx.
const C = { navy: "#00303F", blue: "#005D83", cyan: "#30A4BF", ice: "#B6DFE5", light: "#F1F2F2" };

// Visual field test, seen over the patient's shoulder (patient only, no optometrist): the bowl perimeter in a
// dim room, a steady fixation light in the centre, small light dots flashing at random points around the
// field, and the patient clicking the response button after each one. One eye is patched (strap on the head).
export const VisualFieldScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();
  const t = frame / fps;
  const cx = width / 2;
  const bowl = { x: cx, y: 720, r: 410 };
  // Slow push-in, like a handheld B-roll shot.
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.07]);

  // A dot every 0.4 s at a random point in the field (mostly the periphery), on for 0.2 s.
  const period = 0.4;
  const k = Math.floor(t / period);
  const local = t - k * period;
  const ang = random(`a${k}`) * Math.PI * 2;
  const dist = (0.35 + random(`d${k}`) * 0.55) * bowl.r;
  const dot = { x: bowl.x + Math.cos(ang) * dist, y: bowl.y + Math.sin(ang) * dist };
  const dotOn = interpolate(local, [0.02, 0.06, 0.2, 0.24], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Patient clicks ~0.25 s after seeing it.
  const press = interpolate(local, [0.24, 0.28, 0.34, 0.38], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ring = interpolate(local, [0.26, 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fix = 0.85 + Math.sin(t * Math.PI * 2) * 0.15;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 38%, ${C.blue} 0%, ${C.navy} 70%)` }}>
      <svg width={width} height={1920} style={{ transform: `scale(${zoom})`, transformOrigin: "50% 45%" }}>
        <defs>
          <radialGradient id="vfBowl" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#a9c0c8" />
            <stop offset="0.75" stopColor="#8eaab4" />
            <stop offset="1" stopColor="#6f8f9b" />
          </radialGradient>
          <radialGradient id="vfDot">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.45" stopColor="#ffffff" stopOpacity={0.9} />
            <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="vfFix">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.4" stopColor={C.cyan} />
            <stop offset="1" stopColor={C.cyan} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Table */}
        <rect x={-40} y={1250} width={width + 80} height={120} rx={20} fill="#0b4257" />
        <rect x={-40} y={1250} width={width + 80} height={14} fill={C.cyan} opacity={0.35} />

        {/* Perimeter housing */}
        <rect x={70} y={230} width={940} height={1040} rx={140} fill={C.light} />
        <rect x={70} y={1150} width={940} height={120} rx={40} fill="#d9e3e6" />
        <rect x={430} y={1188} width={220} height={22} rx={11} fill={C.blue} opacity={0.5} />

        {/* Bowl with a faint test grid */}
        <circle cx={bowl.x} cy={bowl.y} r={bowl.r + 22} fill="#e6eef0" />
        <circle cx={bowl.x} cy={bowl.y} r={bowl.r} fill="url(#vfBowl)" />
        <g stroke="#ffffff" strokeOpacity={0.35} strokeWidth={2} fill="none">
          {[0.25, 0.5, 0.75].map((f) => (
            <circle key={f} cx={bowl.x} cy={bowl.y} r={bowl.r * f} />
          ))}
          {[0, 45, 90, 135].map((a) => (
            <line
              key={a}
              x1={bowl.x - Math.cos((a * Math.PI) / 180) * bowl.r}
              y1={bowl.y - Math.sin((a * Math.PI) / 180) * bowl.r}
              x2={bowl.x + Math.cos((a * Math.PI) / 180) * bowl.r}
              y2={bowl.y + Math.sin((a * Math.PI) / 180) * bowl.r}
            />
          ))}
        </g>

        {/* Fixation light and the flashing test dot */}
        <circle cx={bowl.x} cy={bowl.y} r={30 * fix} fill="url(#vfFix)" />
        <circle cx={dot.x} cy={dot.y} r={58} fill="url(#vfDot)" opacity={dotOn} />
        <circle cx={dot.x} cy={dot.y} r={14} fill="#ffffff" opacity={dotOn} />

        {/* Chin rest posts */}
        <rect x={bowl.x - 190} y={950} width={22} height={320} rx={11} fill="#d9e3e6" />
        <rect x={bowl.x + 168} y={950} width={22} height={320} rx={11} fill="#d9e3e6" />

        {/* Patient from behind: head with the eye-patch strap, neck, shoulders */}
        <g>
          <path d={`M ${cx - 470} 1920 C ${cx - 470} 1500, ${cx - 300} 1390, ${cx} 1390 C ${cx + 300} 1390, ${cx + 470} 1500, ${cx + 470} 1920 Z`} fill={C.navy} />
          <rect x={cx - 85} y={1250} width={170} height={190} rx={60} fill="#0a2a35" />
          <ellipse cx={cx} cy={1130} rx={190} ry={215} fill="#0a2a35" />
          <ellipse cx={cx - 40} cy={1060} rx={120} ry={110} fill={C.blue} opacity={0.18} />
          <path d={`M ${cx - 186} 1105 Q ${cx} 1160 ${cx + 186} 1085`} stroke={C.ice} strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.85} />
        </g>

        {/* Response button in the patient's hand, clicked after each dot */}
        <g transform={`translate(${cx + 330} 1560) rotate(-12)`}>
          <circle r={70 + ring * 70} fill="none" stroke={C.cyan} strokeWidth={6} opacity={ring > 0 ? (1 - ring) * 0.8 : 0} />
          <path d="M 0 140 C 10 260, -40 330, -20 420" stroke="#0a2a35" strokeWidth={10} fill="none" />
          <rect x={-46} y={-30} width={92} height={180} rx={40} fill={C.light} />
          <circle cy={8 + press * 4} r={30 - press * 4} fill={C.cyan} />
          <circle cy={8 + press * 4} r={30 - press * 4} fill="#fff" opacity={press * 0.5} />
          {/* Thumb */}
          <ellipse cx={-48} cy={30 + press * 8} rx={34} ry={56} fill={C.ice} transform="rotate(25)" />
        </g>
      </svg>
      {/* Dim-room vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,20,28,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};
