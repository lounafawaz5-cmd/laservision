import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { REEL_FONT } from "../brands";
import { WhatsAppIcon } from "./WhatsAppIcon";

// Pop-up overlays for talking-head reels: a round illustration badge with an English term under it,
// or a short statement card. They sit UNDER the captions (Luna, 13 Nov), with a pop on each entrance
// (brand/Video_Editing_Guide.pdf: pop on text pop-ups).
// Colors: LaserVision brand palette only (brand/laservision/GUIDELINES.md).
const C = {
  navy: "#00303F",
  blue: "#005D83",
  teal: "#30A4BF",
  mint: "#B6DFE5",
  gray: "#F1F2F2",
  white: "#FFFFFF",
};
// Editing guide: all on-screen text in Montserrat Arabic Bold.
const FONT = `"${REEL_FONT}", sans-serif`;

export type OverlayKind =
  | "question"
  | "chart"
  | "focus"
  | "exam"
  | "anatomy"
  | "drops"
  | "glaucoma"
  | "retinopathy"
  | "silent"
  | "check"
  | "statement"
  // Dry eye reel (RIB_0074)
  | "tears"
  | "tearfilm"
  | "symptoms"
  | "contact";

export type AnatomyPart = "cornea" | "lens" | "retina" | "nerve" | "pressure";
export type TearPart = "quantity" | "quality" | "evaporation";
export type SymptomPart = "burning" | "sand" | "screen" | "blur";
export type StepPart = AnatomyPart | TearPart | SymptomPart;

export type Overlay = {
  kind: OverlayKind;
  fromMs: number;
  toMs: number;
  label: string;
  // Anatomy only: which part lights up from which time. The label follows the active part.
  steps?: { part: StepPart; atMs: number; label: string }[];
};

const Eye: React.FC<{ y?: number }> = ({ y = 100 }) => (
  <g>
    <path d={`M20 ${y} Q100 ${y - 62} 180 ${y} Q100 ${y + 62} 20 ${y} Z`} fill={C.white} stroke={C.navy} strokeWidth={7} />
    <circle cx={100} cy={y} r={28} fill={C.teal} />
    <circle cx={100} cy={y} r={12} fill={C.navy} />
    <circle cx={108} cy={y - 8} r={5} fill={C.white} />
  </g>
);

const Illustration: React.FC<{ kind: OverlayKind; part?: StepPart }> = ({ kind, part }) => {
  switch (kind) {
    case "question":
      return (
        <g>
          <Eye y={112} />
          <text x={150} y={62} fontFamily={FONT} fontWeight={700} fontSize={64} fill={C.teal}>?</text>
        </g>
      );
    case "chart": {
      const rows = ["E", "F P", "T O Z", "L P E D"];
      return (
        <g>
          <rect x={45} y={22} width={110} height={156} rx={10} fill={C.white} stroke={C.navy} strokeWidth={6} />
          {rows.map((r, i) => (
            <text key={r} x={100} y={70 + i * 32 - (i === 0 ? 4 : 0)} textAnchor="middle" fontFamily={FONT} fontWeight={700}
              fontSize={[48, 28, 21, 16][i]} fill={i === 0 ? C.blue : C.navy} letterSpacing={2}>{r}</text>
          ))}
        </g>
      );
    }
    case "focus":
      return (
        <g>
          {[70, 50, 30].map((r, i) => (
            <circle key={r} cx={100} cy={100} r={r} fill={i === 1 ? C.mint : C.white} stroke={C.navy} strokeWidth={6} />
          ))}
          <circle cx={100} cy={100} r={12} fill={C.teal} />
        </g>
      );
    case "exam":
      return (
        <g>
          <Eye y={92} />
          <circle cx={128} cy={118} r={34} fill="none" stroke={C.blue} strokeWidth={9} />
          <line x1={152} y1={142} x2={180} y2={170} stroke={C.blue} strokeWidth={14} strokeLinecap="round" />
        </g>
      );
    case "anatomy": {
      const on = (p: AnatomyPart) => part === p;
      const hi = (p: AnatomyPart) => (on(p) ? C.teal : C.navy);
      return (
        <g>
          {/* eyeball, facing left */}
          <circle cx={108} cy={100} r={62} fill={on("pressure") ? C.mint : C.white} stroke={C.navy} strokeWidth={6} />
          {/* optic nerve */}
          <path d="M166 84 L196 78 L196 122 L166 116 Z" fill={on("nerve") ? C.teal : C.mint} stroke={C.navy} strokeWidth={5} />
          {/* retina */}
          <path d="M136 46 A56 56 0 0 1 136 154" fill="none" stroke={hi("retina")} strokeWidth={on("retina") ? 13 : 6} strokeLinecap="round" />
          {/* cornea */}
          <path d="M60 64 Q24 100 60 136" fill={on("cornea") ? C.mint : "none"} stroke={hi("cornea")} strokeWidth={on("cornea") ? 11 : 6} strokeLinecap="round" />
          {/* iris */}
          <line x1={58} y1={70} x2={58} y2={86} stroke={C.blue} strokeWidth={7} strokeLinecap="round" />
          <line x1={58} y1={114} x2={58} y2={130} stroke={C.blue} strokeWidth={7} strokeLinecap="round" />
          {/* lens */}
          <ellipse cx={70} cy={100} rx={on("lens") ? 12 : 9} ry={24} fill={on("lens") ? C.teal : C.mint} stroke={C.navy} strokeWidth={5} />
          {/* pressure arrows */}
          {on("pressure")
            ? [0, 72, 144, 216, 288].map((a) => (
                <g key={a} transform={`rotate(${a} 108 100)`}>
                  <line x1={108} y1={86} x2={108} y2={56} stroke={C.blue} strokeWidth={7} strokeLinecap="round" />
                  <path d="M96 62 L108 48 L120 62" fill="none" stroke={C.blue} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              ))
            : null}
        </g>
      );
    }
    case "drops":
      return (
        <g>
          <rect x={84} y={14} width={32} height={30} rx={8} fill={C.navy} />
          <path d="M80 44 H120 V96 Q120 108 108 112 L104 132 H96 L92 112 Q80 108 80 96 Z" fill={C.mint} stroke={C.navy} strokeWidth={6} />
          <path d="M100 146 Q84 168 100 182 Q116 168 100 146 Z" fill={C.teal} />
        </g>
      );
    case "glaucoma":
      return (
        <g>
          <circle cx={100} cy={100} r={74} fill={C.mint} stroke={C.navy} strokeWidth={6} />
          {/* optic disc with an enlarged cup */}
          <circle cx={100} cy={100} r={34} fill={C.white} stroke={C.navy} strokeWidth={5} />
          <circle cx={100} cy={100} r={24} fill={C.teal} />
          {[-60, -20, 20, 60, 120, 160, 200, 240].map((a) => (
            <path key={a} d={`M${100 + 34 * Math.cos((a * Math.PI) / 180)} ${100 + 34 * Math.sin((a * Math.PI) / 180)} L${100 + 70 * Math.cos(((a + 12) * Math.PI) / 180)} ${100 + 70 * Math.sin(((a + 12) * Math.PI) / 180)}`}
              stroke={C.blue} strokeWidth={5} strokeLinecap="round" />
          ))}
        </g>
      );
    case "retinopathy":
      return (
        <g>
          <circle cx={100} cy={100} r={74} fill={C.mint} stroke={C.navy} strokeWidth={6} />
          <circle cx={130} cy={100} r={14} fill={C.white} stroke={C.navy} strokeWidth={4} />
          <path d="M124 90 Q90 60 44 66 M124 110 Q90 140 44 134 M118 96 Q80 92 40 100" fill="none" stroke={C.blue} strokeWidth={5} strokeLinecap="round" />
          {[[70, 80], [84, 118], [60, 112], [96, 74], [74, 96], [108, 136]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r={6} fill={C.navy} />
          ))}
        </g>
      );
    case "silent":
      return (
        <g>
          <Eye y={100} />
          <circle cx={156} cy={52} r={30} fill={C.white} stroke={C.navy} strokeWidth={6} />
          <line x1={140} y1={36} x2={172} y2={68} stroke={C.navy} strokeWidth={7} strokeLinecap="round" />
          <text x={156} y={62} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={30} fill={C.teal}>!</text>
        </g>
      );
    case "check":
      return (
        <g>
          <circle cx={100} cy={100} r={70} fill={C.teal} />
          <path d="M66 102 L90 126 L138 76" fill="none" stroke={C.white} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "tears":
      // A watery eye: tears running down, yet it can still be a dry eye.
      return (
        <g>
          <Eye y={86} />
          <path d="M70 128 Q58 150 70 162 Q82 150 70 128 Z" fill={C.teal} />
          <path d="M132 136 Q122 154 132 164 Q142 154 132 136 Z" fill={C.teal} />
          <path d="M100 150 Q90 168 100 178 Q110 168 100 150 Z" fill={C.mint} stroke={C.teal} strokeWidth={3} />
        </g>
      );
    case "tearfilm": {
      if (part === "quantity")
        // A drop with a level line: how much tear there is.
        return (
          <g>
            <path d="M100 24 Q48 98 56 130 Q64 176 100 176 Q136 176 144 130 Q152 98 100 24 Z" fill={C.white} stroke={C.navy} strokeWidth={7} />
            <path d="M58 132 Q64 174 100 174 Q136 174 142 132 Z" fill={C.teal} />
            <line x1={50} y1={132} x2={150} y2={132} stroke={C.navy} strokeWidth={5} strokeDasharray="10 8" />
          </g>
        );
      if (part === "quality")
        // The tear film's three layers.
        return (
          <g>
            <rect x={30} y={44} width={140} height={30} rx={10} fill={C.blue} />
            <rect x={30} y={82} width={140} height={44} rx={10} fill={C.mint} stroke={C.teal} strokeWidth={4} />
            <rect x={30} y={134} width={140} height={22} rx={10} fill={C.teal} />
            <path d="M44 104 Q60 94 76 104 T108 104 T140 104 T172 104" fill="none" stroke={C.white} strokeWidth={5} strokeLinecap="round" />
          </g>
        );
      // evaporation: a drop with rising wavy lines
      return (
        <g>
          <path d="M100 82 Q66 130 72 152 Q78 182 100 182 Q122 182 128 152 Q134 130 100 82 Z" fill={C.teal} stroke={C.navy} strokeWidth={6} />
          {[64, 100, 136].map((x) => (
            <path key={x} d={`M${x} 66 Q${x - 12} 52 ${x} 38 Q${x + 12} 24 ${x} 12`} fill="none" stroke={C.blue} strokeWidth={7} strokeLinecap="round" />
          ))}
        </g>
      );
    }
    case "symptoms": {
      if (part === "burning")
        return (
          <g>
            <path d="M100 18 Q140 70 132 112 Q150 98 148 78 Q176 118 160 152 Q144 184 100 184 Q56 184 40 152 Q26 118 56 84 Q56 108 72 116 Q60 64 100 18 Z" fill={C.teal} stroke={C.navy} strokeWidth={6} strokeLinejoin="round" />
            <path d="M100 96 Q124 124 118 150 Q112 170 100 170 Q88 170 82 150 Q78 128 100 96 Z" fill={C.mint} />
          </g>
        );
      if (part === "sand")
        // An eye with grains of sand.
        return (
          <g>
            <Eye y={82} />
            {[[54, 150, 9], [80, 164, 7], [106, 148, 10], [130, 166, 8], [150, 146, 7], [92, 182, 6], [124, 184, 6]].map(([x, y, r]) => (
              <circle key={`${x}${y}`} cx={x} cy={y} r={r} fill={C.blue} />
            ))}
          </g>
        );
      if (part === "screen")
        return (
          <g>
            <rect x={26} y={34} width={148} height={100} rx={10} fill={C.white} stroke={C.navy} strokeWidth={7} />
            <rect x={40} y={48} width={120} height={72} rx={4} fill={C.mint} />
            <path d="M82 134 L76 162 H124 L118 134 Z" fill={C.navy} />
            <rect x={60} y={160} width={80} height={10} rx={5} fill={C.navy} />
            <path d="M74 84 Q100 62 126 84 Q100 106 74 84 Z" fill={C.white} stroke={C.blue} strokeWidth={4} />
            <circle cx={100} cy={84} r={8} fill={C.blue} />
          </g>
        );
      // blur: a doubled, soft eye chart letter
      return (
        <g>
          <rect x={45} y={22} width={110} height={156} rx={10} fill={C.white} stroke={C.navy} strokeWidth={6} />
          <text x={108} y={124} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={88} fill={C.mint}>E</text>
          <text x={96} y={118} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={88} fill={C.teal} opacity={0.75}>E</text>
        </g>
      );
    }
    default:
      return null;
  }
};

// Captions sit at y≈1110–1200; overlays start below them.
const BADGE = 290;
const CENTER_Y = 1390;

const OverlayView: React.FC<{ o: Overlay; nowMs: number }> = ({ o, nowMs }) => {
  const { fps } = useVideoConfig();
  const local = ((nowMs - o.fromMs) / 1000) * fps;
  const left = ((o.toMs - nowMs) / 1000) * fps;
  const pop = spring({ frame: local, fps, config: { damping: 9, stiffness: 160, mass: 0.6 } });
  const out = interpolate(left, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = pop * out;

  const step = o.steps?.filter((s) => nowMs >= s.atMs).pop();
  const label = step ? step.label : o.label;
  // Each new anatomy step re-pops the label.
  const labelLocal = step ? ((nowMs - step.atMs) / 1000) * fps : local - 4;
  const labelPop = spring({ frame: labelLocal, fps, config: { damping: 10, stiffness: 180, mass: 0.5 } }) * out;

  if (o.kind === "contact") {
    // Closing card: branch + WhatsApp icon and number (never the word "WhatsApp" on screen).
    const [place, number] = o.label.split("|");
    return (
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 1290 }}>
        <div style={{ transform: `scale(${scale})`, background: C.navy, borderRadius: 34, padding: "26px 44px",
          boxShadow: "0 18px 50px rgba(0,0,0,0.35)", textAlign: "center", fontFamily: FONT, border: `4px solid ${C.teal}` }}>
          <div style={{ color: C.mint, fontWeight: 700, fontSize: 40, letterSpacing: 2 }}>{place}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 10, transform: `scale(${labelPop})` }}>
            <WhatsAppIcon size={58} />
            <span dir="ltr" style={{ color: C.white, fontWeight: 700, fontSize: 56 }}>{number}</span>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  if (o.kind === "statement") {
    const [a, b] = o.label.split("|");
    return (
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 1250 }}>
        <div style={{ transform: `scale(${scale})`, background: C.navy, borderRadius: 34, padding: "34px 52px",
          boxShadow: "0 18px 50px rgba(0,0,0,0.35)", textAlign: "center", fontFamily: FONT, border: `4px solid ${C.teal}` }}>
          <div style={{ color: C.white, fontWeight: 700, fontSize: 62 }}>{a}</div>
          <div style={{ color: C.mint, fontWeight: 700, fontSize: 46, marginTop: 6 }}>{b}</div>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: CENTER_Y - BADGE / 2 }}>
      <div style={{ transform: `scale(${scale})`, width: BADGE, height: BADGE, borderRadius: "50%", background: C.gray,
        border: `10px solid ${C.mint}`, boxShadow: "0 16px 44px rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={BADGE * 0.74} height={BADGE * 0.74} viewBox="0 0 200 200">
          <Illustration kind={o.kind} part={step?.part} />
        </svg>
      </div>
      <div style={{ marginTop: -26, transform: `scale(${labelPop})`, background: C.blue, color: C.white, fontFamily: FONT,
        fontWeight: 700, fontSize: 40, letterSpacing: 1, padding: "10px 30px", borderRadius: 999, whiteSpace: "nowrap",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
        {label}
      </div>
    </AbsoluteFill>
  );
};

export const PopOverlays: React.FC<{ overlays: Overlay[]; popSfx?: string; popVolume?: number }> = ({
  overlays,
  popSfx = "sfx/pop.wav",
  popVolume = 0.18,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const f = (ms: number) => Math.round((ms / 1000) * fps);
  // A pop on every entrance, and on each new anatomy label.
  const pops = overlays.flatMap((o) => [o.fromMs, ...(o.steps ?? []).map((s) => s.atMs).filter((t) => t > o.fromMs + 150)]);
  return (
    <>
      {overlays
        .filter((o) => nowMs >= o.fromMs && nowMs < o.toMs)
        .map((o) => (
          <OverlayView key={`${o.kind}${o.fromMs}`} o={o} nowMs={nowMs} />
        ))}
      {pops.map((t) => (
        <Sequence key={`pop${t}`} from={f(t)} durationInFrames={f(1000)}>
          <Audio src={staticFile(popSfx)} volume={popVolume} />
        </Sequence>
      ))}
    </>
  );
};
