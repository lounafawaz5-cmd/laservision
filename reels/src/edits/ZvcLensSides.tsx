import {
  AbsoluteFill,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brands, CAPTION_FONT } from "../brands";
import { Caption, Captions } from "../components/Captions";

// ZVC reel: contact lens right side vs. inside out (Luna talking head, RIB_0115).
// Footage + photos are pulled from Drive into public/footage/zvc-lens-sides/ (never committed).

const DIR = "footage/zvc-lens-sides";
const ZVC_BLUE = brands.zvc.colors.captionGlow; // #0C188D
export const ZVC_LENS_SIDES_SECONDS = 36.2;

// Times in seconds, taken from the word timestamps of the transcript.
const T = {
  lenses: [2.8, 5.0], // "contact lenses"
  bang: [4.2, 5.8], // "مهم" (important)
  tick: [8.25, 10.0], // "صح" (right side)
  cross: [9.1, 10.0], // "مقلوب" (inside out)
  question: [10.0, 11.4], // "كيف منعرف الفرق؟"
  brollRight: [16.6, 20.6], // GAM_0312, right side (cup shape)
  brollWrong: [21.3, 24.6], // GAM_0313, inside out (edges flare out)
  rubbing: [27.2, 30.4], // "رح تحسّوا كأنّو في شي بعينكن"
  bottle: [31.9, 35.2], // "contact lens solution"
};

// ZVC subtitles: Arabic, English terms in CAPS. Look comes from the Video Editing Guide (components/Captions).
const s = (text: string, a: number, b: number): Caption => ({ text, startMs: a * 1000, endMs: b * 1000 });
export const zvcLensSidesCaptions: Caption[] = [
  s("إذا أول مرة", 0.0, 1.5),
  s("بدكن تلبسوا", 1.5, 2.86),
  s("CONTACT LENSES", 2.86, 3.94),
  s("في شي مهم", 3.94, 4.84),
  s("لازم تعرفوه", 4.84, 5.85),
  s("الـ CONTACT LENS", 5.88, 6.92),
  s("إلها TWO SIDES", 6.92, 7.9),
  s("في وجه صح", 7.94, 8.68),
  s("ووجه مقلوب", 8.68, 9.98),
  s("بس كيف منعرف الفرق؟", 10.0, 11.32),
  s("حطّوا الـ CONTACT LENS", 11.32, 12.52),
  s("على راس إصبعكن", 12.52, 13.66),
  s("وتطلّعوا عليها من الجنب", 13.66, 15.5),
  s("إذا شكلها متل الـ CUP", 15.58, 17.1),
  s("وأطرافها مايلة لفوق", 17.1, 18.7),
  s("يعني هي بالاتجاه الصح", 18.7, 20.5),
  s("وإذا الـ PERIPHERY", 20.6, 21.4),
  s("طلع لبرّا", 21.4, 22.24),
  s("يعني الـ CONTACT LENS", 22.24, 23.5),
  s("مقلوبة", 23.5, 24.5),
  s("وإذا بالغلط", 24.54, 25.18),
  s("حطّيتوها مقلوبة", 25.18, 26.4),
  s("لا تخافوا", 26.4, 27.16),
  s("رح تحسّوا كأنّو", 27.2, 27.98),
  s("في شي بعينكن", 27.98, 28.92),
  s("متل غبرة أو شعرة", 28.92, 30.4),
  s("شيلوها", 30.54, 31.25),
  s("غسّلوها منيح", 31.32, 31.98),
  s("بالـ CONTACT LENS", 31.98, 32.62),
  s("SOLUTION", 32.62, 33.36),
  s("ورجعوا حطّوها", 33.36, 34.48),
  s("بالطريقة الصح", 34.48, 35.8),
];

// Her shirt gapes slightly at the bottom button (about x 535-590, y 1345-1400 for the whole take).
// The subtitles sit on that spot on a #0C188D box (Luna asked for the box on this reel only; the guide
// otherwise says no box) and never leave a pause, so it stays covered:
// each line runs until the next one starts, and the last one holds to the end.
const SHIRT_GAP = { x: 562, y: 1372 };
const coveringCaptions: Caption[] = zvcLensSidesCaptions.map((c, i, all) => ({
  ...c,
  startMs: i === 0 ? 0 : c.startMs,
  endMs: i < all.length - 1 ? all[i + 1].startMs : ZVC_LENS_SIDES_SECONDS * 1000,
}));

// Under the subtitles, a soft patch of the same shirt copied from just beside the gap,
// so nothing shows between the letters. She barely moves, so a fixed patch holds for the whole take.
const PATCH_SHIFT_X = 95;
const ShirtPatch: React.FC = () => (
  <AbsoluteFill
    style={{
      WebkitMaskImage: `radial-gradient(ellipse 48px 44px at ${SHIRT_GAP.x}px ${SHIRT_GAP.y}px, #000 55%, transparent 100%)`,
      maskImage: `radial-gradient(ellipse 48px 44px at ${SHIRT_GAP.x}px ${SHIRT_GAP.y}px, #000 55%, transparent 100%)`,
    }}
  >
    <OffthreadVideo
      src={staticFile(`${DIR}/main.mp4`)}
      muted
      style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translateX(-${PATCH_SHIFT_X}px)` }}
    />
  </AbsoluteFill>
);

// ---------- motion helpers ----------

// Pop: overshoot in, quick shrink out. Returns scale 0..~1.15..1..0.
const usePop = (dur: number, delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inS = spring({ frame: frame - delay, fps, config: { damping: 9, stiffness: 180, mass: 0.6 } });
  const out = interpolate(frame, [dur - 7, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return inS * out;
};

// Rise from the bottom edge, hold, drop back down.
const useRise = (dur: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const up = spring({ frame, fps, config: { damping: 11, stiffness: 140 } });
  const down = spring({ frame: frame - (dur - 12), fps, config: { damping: 14, stiffness: 160 } });
  return (1 - up + down) * 650; // translateY in px
};

const At: React.FC<{ t: number[]; children: React.ReactNode }> = ({ t, children }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.round(t[0] * fps)} durationInFrames={Math.round((t[1] - t[0]) * fps)} layout="none">
      {children}
    </Sequence>
  );
};

const durOf = (t: number[], fps: number) => Math.round((t[1] - t[0]) * fps);

const shadow = "drop-shadow(0 10px 22px rgba(0,0,0,0.28))";

// ---------- overlays ----------

const LensDome: React.FC<{ id: string }> = ({ id }) => (
  <svg viewBox="0 0 200 130" width={260} height={169}>
    <defs>
      <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#D8EEFF" stopOpacity="0.95" />
        <stop offset="1" stopColor="#7FB9EC" stopOpacity="0.95" />
      </linearGradient>
    </defs>
    {/* dome */}
    <path d="M12 96 C 22 18, 178 18, 188 96 Z" fill={`url(#g${id})`} stroke="#4A90D9" strokeWidth="5" />
    {/* rim */}
    <ellipse cx="100" cy="96" rx="88" ry="22" fill="#BFE0FB" stroke="#4A90D9" strokeWidth="5" />
    {/* shine */}
    <path d="M48 70 C 56 46, 84 36, 104 36" fill="none" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" />
    <circle cx="128" cy="44" r="6" fill="#FFFFFF" />
  </svg>
);

const ContactLensesPopUp: React.FC = () => {
  const { fps } = useVideoConfig();
  const y = useRise(durOf(T.lenses, fps));
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 6) * 6;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 70 }}>
      <div
        style={{
          transform: `translateY(${y}px)`,
          background: "#FFFFFF",
          borderRadius: 48,
          padding: "34px 44px 26px",
          display: "flex",
          gap: 30,
          filter: shadow,
        }}
      >
        <div style={{ transform: `translateY(${bob}px) rotate(-8deg)` }}>
          <LensDome id="a" />
        </div>
        <div style={{ transform: `translateY(${-bob}px) rotate(8deg)` }}>
          <LensDome id="b" />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const outlinedText = {
  fontFamily: `"${CAPTION_FONT}", sans-serif`,
  fontWeight: 700,
  color: ZVC_BLUE, // ZVC color from the Video Editing Guide, white outline
  WebkitTextStroke: "12px #FFFFFF",
  paintOrder: "stroke fill",
  lineHeight: 1,
} as const;

const Bang: React.FC<{ delay: number; rotate: number; dur: number }> = ({ delay, rotate, dur }) => {
  const sc = usePop(dur, delay);
  return <div style={{ ...outlinedText, fontSize: 260, transform: `scale(${sc}) rotate(${rotate}deg)`, filter: shadow }}>!</div>;
};

const Important: React.FC = () => {
  const { fps } = useVideoConfig();
  const dur = durOf(T.bang, fps);
  return (
    <div style={{ position: "absolute", left: 740, top: 250, display: "flex", gap: 6 }}>
      <Bang delay={0} rotate={-10} dur={dur} />
      <Bang delay={5} rotate={8} dur={dur} />
    </div>
  );
};

// Circle badge whose mark draws itself in.
const MarkBadge: React.FC<{ kind: "tick" | "cross"; t: number[]; left: number; top: number }> = ({ kind, t, left, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = usePop(durOf(t, fps));
  const draw = interpolate(frame, [4, 14], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tick = kind === "tick";
  return (
    <div style={{ position: "absolute", left, top, transform: `scale(${sc})`, filter: shadow }}>
      <svg viewBox="0 0 200 200" width={230} height={230}>
        <circle cx="100" cy="100" r="92" fill={tick ? ZVC_BLUE : "#000000"} stroke="#FFFFFF" strokeWidth="10" />
        {tick ? (
          <path d="M55 104 L88 136 L148 70" fill="none" stroke="#FFFFFF" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={draw} />
        ) : (
          <g stroke="#FFFFFF" strokeWidth="22" strokeLinecap="round">
            <path d="M64 64 L136 136" pathLength={1} strokeDasharray={1} strokeDashoffset={draw} />
            <path d="M136 64 L64 136" pathLength={1} strokeDasharray={1} strokeDashoffset={Math.min(1, draw * 2)} />
          </g>
        )}
      </svg>
    </div>
  );
};

const Question: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = usePop(durOf(T.question, fps));
  const wobble = Math.sin(frame / 4) * 9;
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ ...outlinedText, fontSize: 250, marginTop: 10, marginLeft: -20, transform: `scale(${sc}) rotate(${wobble}deg)`, transformOrigin: "50% 90%", filter: shadow }}>
        ?
      </div>
    </AbsoluteFill>
  );
};

// Full-screen photo B-roll: fade in, slow push, fade out.
// focusY = where the lens sits in the photo (0..1); it is lifted to targetY so subtitles never cover it.
// The zoom range must be big enough that no black edge shows: targetY + (1 - focusY) * zoom >= 1.
const PhotoBroll: React.FC<{ src: string; t: number[]; focusY: number; zoom: [number, number] }> = ({ src, t, focusY, zoom }) => {
  const targetY = 0.48;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = durOf(t, fps);
  const fade = 0.45 * fps;
  const opacity = interpolate(frame, [0, fade, dur - fade, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, dur], zoom);
  const lift = (targetY - focusY) * 1920;
  return (
    <AbsoluteFill style={{ opacity, overflow: "hidden" }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translateY(${lift}px) scale(${scale})`, transformOrigin: `52% ${focusY * 100}%` }} />
    </AbsoluteFill>
  );
};

// Cartoon character rubbing its eyes, rising from the bottom.
const EyeRubber: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const y = useRise(durOf(T.rubbing, fps));
  const a = frame / 2.6;
  const lx = Math.cos(a) * 9;
  const ly = Math.sin(a) * 7;
  const rx = Math.cos(a + Math.PI) * 9;
  const ry = Math.sin(a + Math.PI) * 7;
  const sway = Math.sin(frame / 7) * 4;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center" }}>
      <svg viewBox="0 0 400 360" width={440} height={396} style={{ transform: `translateY(${y + 6}px) rotate(${sway}deg)`, transformOrigin: "50% 100%", filter: shadow }}>
        {/* shoulders */}
        <path d="M60 360 C 70 290, 330 290, 340 360 Z" fill={ZVC_BLUE} />
        {/* head */}
        <circle cx="200" cy="170" r="125" fill="#FFD166" stroke="#1A1A1A" strokeWidth="8" />
        {/* hair tuft */}
        <path d="M170 50 C 180 20, 205 30, 200 52 C 215 28, 240 40, 228 60" fill="none" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
        {/* cheeks */}
        <circle cx="118" cy="205" r="18" fill="#FF8FA3" opacity="0.7" />
        <circle cx="282" cy="205" r="18" fill="#FF8FA3" opacity="0.7" />
        {/* wobbly frown */}
        <path d="M160 245 Q 175 232 190 245 Q 205 258 220 245 Q 232 234 242 244" fill="none" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
        {/* tears */}
        <path d="M112 175 q -12 26 0 34 q 12 -8 0 -34 Z" fill="#7FC8FF" stroke="#1A1A1A" strokeWidth="4" />
        <path d="M290 175 q -12 26 0 34 q 12 -8 0 -34 Z" fill="#7FC8FF" stroke="#1A1A1A" strokeWidth="4" />
        {/* fists rubbing the eyes */}
        <g transform={`translate(${lx} ${ly})`}>
          <path d="M60 330 C 80 260, 110 190, 140 160" fill="none" stroke="#FFD166" strokeWidth="34" strokeLinecap="round" />
          <circle cx="150" cy="148" r="40" fill="#FFD166" stroke="#1A1A1A" strokeWidth="8" />
          <path d="M128 140 h 30 M128 156 h 30" stroke="#1A1A1A" strokeWidth="5" strokeLinecap="round" />
        </g>
        <g transform={`translate(${rx} ${ry})`}>
          <path d="M340 330 C 320 260, 290 190, 260 160" fill="none" stroke="#FFD166" strokeWidth="34" strokeLinecap="round" />
          <circle cx="250" cy="148" r="40" fill="#FFD166" stroke="#1A1A1A" strokeWidth="8" />
          <path d="M242 140 h 30 M242 156 h 30" stroke="#1A1A1A" strokeWidth="5" strokeLinecap="round" />
        </g>
        {/* little irritation sparks */}
        <g stroke="#EF4444" strokeWidth="7" strokeLinecap="round" opacity={0.6 + 0.4 * Math.sin(frame / 3)}>
          <path d="M60 90 l -22 -14" />
          <path d="M70 66 l -10 -22" />
          <path d="M340 90 l 22 -14" />
          <path d="M330 66 l 10 -22" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// Contact lens solution bottle, popping in and rocking back and forth.
const SolutionBottle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = usePop(durOf(T.bottle, fps));
  const rock = Math.sin(frame / 5) * 13;
  return (
    <div style={{ position: "absolute", left: 50, top: 210, transform: `scale(${sc})`, transformOrigin: "50% 100%" }}>
      <svg viewBox="0 0 220 420" width={250} height={477} style={{ transform: `rotate(${rock}deg)`, transformOrigin: "50% 95%", filter: shadow }}>
        {/* nozzle + cap */}
        <path d="M98 10 h 24 l 8 46 h -40 Z" fill={ZVC_BLUE} stroke="#1A1A1A" strokeWidth="6" strokeLinejoin="round" />
        <rect x="72" y="54" width="76" height="42" rx="10" fill={ZVC_BLUE} stroke="#1A1A1A" strokeWidth="6" />
        {/* body */}
        <path d="M60 96 h 100 c 30 14 40 40 40 70 v 214 c 0 18 -12 30 -30 30 h -120 c -18 0 -30 -12 -30 -30 v -214 c 0 -30 10 -56 40 -70 Z" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="7" />
        {/* label */}
        <rect x="34" y="190" width="152" height="150" rx="16" fill="#0072EF" />
        <text x="110" y="232" textAnchor="middle" fontFamily={CAPTION_FONT} fontWeight={700} fontSize="25" fill="#FFFFFF">LENS</text>
        <text x="110" y="262" textAnchor="middle" fontFamily={CAPTION_FONT} fontWeight={700} fontSize="22" fill="#FFFFFF">SOLUTION</text>
        <path d="M78 312 C 84 282, 136 282, 142 312 Z" fill="#BFE0FB" stroke="#FFFFFF" strokeWidth="5" />
        {/* shine */}
        <path d="M48 140 v 40" stroke="#E6EEF7" strokeWidth="10" strokeLinecap="round" />
      </svg>
    </div>
  );
};

// ---------- composition ----------

// Subtitles alone on a transparent background, to lay over the footage in CapCut.
export const ZvcLensSidesCaptions: React.FC = () => (
  <AbsoluteFill>
    <Captions captions={coveringCaptions} brand={brands.zvc} cover={SHIRT_GAP} />
  </AbsoluteFill>
);

export const ZvcLensSides: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  // Short audio fade at the very end so the cut doesn't click.
  const vol = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile(`${DIR}/main.mp4`)} volume={vol} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <ShirtPatch />

      <At t={T.brollRight}><PhotoBroll src={`${DIR}/GAM_0312.jpg`} t={T.brollRight} focusY={0.53} zoom={[1.3, 1.45]} /></At>
      <At t={T.brollWrong}><PhotoBroll src={`${DIR}/GAM_0313.jpg`} t={T.brollWrong} focusY={0.65} zoom={[1.52, 1.65]} /></At>

      <At t={T.lenses}><ContactLensesPopUp /></At>
      <At t={T.bang}><Important /></At>
      <At t={T.tick}><MarkBadge kind="tick" t={T.tick} left={770} top={360} /></At>
      <At t={T.cross}><MarkBadge kind="cross" t={T.cross} left={80} top={360} /></At>
      <At t={T.question}><Question /></At>
      <At t={T.rubbing}><EyeRubber /></At>
      <At t={T.bottle}><SolutionBottle /></At>

      <Captions captions={coveringCaptions} brand={brands.zvc} cover={SHIRT_GAP} />
    </AbsoluteFill>
  );
};
