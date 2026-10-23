import { z } from "zod";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { brands } from "../brands";

// Fast, ad-style product montage cut to the beat of a song.
// Every cut and text hit is placed in beats, so a new song only needs new beat times.

const move = z.enum(["punch", "push", "pull", "slideL", "slideR", "spin"]);

export const beatAdSchema = z.object({
  brand: z.enum(["laservision", "zvc"]),
  // Song in public/, empty = silent preview. audioStartSec = where in the song the edit starts.
  audio: z.string(),
  audioStartSec: z.number(),
  // Beat times in ms relative to audioStartSec (from scripts/beats.py). Empty = even grid from bpm.
  beatTimesMs: z.array(z.number()),
  bpm: z.number(),
  shots: z.array(
    z.object({
      src: z.string(),
      // Seconds into the source clip.
      at: z.number(),
      beats: z.number(),
      // Footage speed; >1 is the fast-motion look.
      rate: z.number(),
      move,
      flash: z.boolean().optional(),
    }),
  ),
  texts: z.array(
    z.object({
      text: z.string(),
      beat: z.number(),
      beats: z.number(),
      style: z.enum(["slam", "letters", "outline", "tag", "small"]),
    }),
  ),
  outroBeats: z.number(),
  outroTitle: z.string(),
  outroLine: z.string(),
});

export type BeatAdProps = z.infer<typeof beatAdSchema>;

// Beat index (fractions allowed) → frame. Past the detected beats, continue at the last spacing.
export const beatToFrame = (p: Pick<BeatAdProps, "beatTimesMs" | "bpm">, beat: number, fps: number) => {
  const t = p.beatTimesMs;
  const step = 60000 / p.bpm;
  let ms: number;
  if (t.length < 2) {
    ms = beat * step;
  } else {
    const i = Math.min(Math.floor(beat), t.length - 2);
    const local = t[i + 1] - t[i];
    ms = t[i] + (beat - i) * local;
  }
  return Math.round((ms / 1000) * fps);
};

export const beatAdDuration = (p: BeatAdProps, fps: number) => {
  const mainBeats = p.shots.reduce((s, x) => s + x.beats, 0);
  return beatToFrame(p, mainBeats + p.outroBeats, fps);
};

const FONT = `"Inter", sans-serif`;

const Shot: React.FC<{
  src: string;
  at: number;
  rate: number;
  move: z.infer<typeof move>;
  flash: boolean;
  beatFrames: number[];
}> = ({ src, at, rate, move, flash, beatFrames }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: d, width } = useVideoConfig();

  // Hit at the cut: quick zoom/blur settle, the "punch" of ad edits.
  const hit = spring({ frame, fps, config: { damping: 18, stiffness: 260, mass: 0.6 } });
  const lin = frame / Math.max(1, d - 1);

  let scale = 1.08;
  let x = 0;
  let rot = 0;
  if (move === "punch") scale = interpolate(hit, [0, 1], [1.45, 1.1]) + lin * 0.05;
  if (move === "push") scale = interpolate(lin, [0, 1], [1.05, 1.28]) + (1 - hit) * 0.25;
  if (move === "pull") scale = interpolate(lin, [0, 1], [1.3, 1.06], { easing: Easing.out(Easing.quad) });
  if (move === "slideL" || move === "slideR") {
    const dir = move === "slideL" ? 1 : -1;
    x = dir * (interpolate(hit, [0, 1], [width * 0.45, 0]) - lin * 60);
    scale = 1.15;
  }
  if (move === "spin") {
    rot = interpolate(hit, [0, 1], [-10, 0]);
    scale = interpolate(hit, [0, 1], [1.5, 1.12]) + lin * 0.05;
  }

  // Small pulse on every beat inside the shot so long shots still ride the music.
  for (const b of beatFrames) {
    if (b > 0 && frame >= b) scale += 0.04 * Math.exp(-(frame - b) / 3);
  }

  const blur = interpolate(frame, [0, 4], [move === "pull" ? 0 : 14, 0], { extrapolateRight: "clamp" });
  const flashOpacity = flash ? interpolate(frame, [0, 3], [0.9, 0], { extrapolateRight: "clamp" }) : 0;

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill
        style={{
          transform: `translateX(${x}px) scale(${scale}) rotate(${rot}deg)`,
          filter: `blur(${blur}px) contrast(1.08) saturate(1.05)`,
        }}
      >
        <OffthreadVideo
          src={staticFile(src)}
          muted
          trimBefore={Math.round(at * fps)}
          playbackRate={rate}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: flashOpacity }} />
    </AbsoluteFill>
  );
};

const Text: React.FC<{ text: string; style: BeatAdProps["texts"][number]["style"]; beatLen: number; accent: string }> = ({
  text,
  style,
  beatLen,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: d } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 14, stiffness: 300, mass: 0.5 } });
  const out = interpolate(frame, [d - 3, d], [1, 0], { extrapolateLeft: "clamp" });
  const shadow = "0 6px 30px rgba(0,0,0,0.45)";

  if (style === "letters") {
    // One letter every eighth of a beat.
    const shown = Math.min(text.length, Math.floor(frame / Math.max(1, beatLen / 8)) + 1);
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 128, letterSpacing: 10, color: "#fff", textShadow: shadow }}>
          {text.split("").map((c, i) => (
            <span key={i} style={{ opacity: i < shown ? 1 : 0 }}>
              {c}
            </span>
          ))}
        </div>
      </AbsoluteFill>
    );
  }
  if (style === "slam") {
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 210,
            letterSpacing: 6,
            color: "#fff",
            textShadow: shadow,
            transform: `scale(${interpolate(inn, [0, 1], [1.8, 1])})`,
          }}
        >
          {text}
        </div>
      </AbsoluteFill>
    );
  }
  if (style === "outline") {
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
        {text.split("\n").map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: i === 0 ? 136 : 84,
              letterSpacing: i === 0 ? 4 : 4,
              color: i === 0 ? "transparent" : "#fff",
              WebkitTextStroke: i === 0 ? "4px #fff" : undefined,
              textShadow: i === 0 ? undefined : shadow,
              transform: `translateY(${(1 - inn) * (i === 0 ? -80 : 80)}px)`,
              opacity: inn,
            }}
          >
            {line}
          </div>
        ))}
      </AbsoluteFill>
    );
  }
  if (style === "tag") {
    return (
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 380, opacity: out }}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 64,
            letterSpacing: 4,
            background: accent,
            color: "#000",
            padding: "14px 34px",
            clipPath: `inset(0 ${(1 - inn) * 100}% 0 0)`,
          }}
        >
          {text}
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 520, opacity: out * inn }}>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 62, letterSpacing: 14, color: "#fff", textShadow: shadow }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};

// Thin camera-style frame lines and a running shot counter: the "motion graphics" layer.
const Hud: React.FC<{ index: number; total: number }> = ({ index, total }) => {
  const c = "rgba(255,255,255,0.85)";
  const corner = (pos: React.CSSProperties, rot: number) => (
    <div style={{ position: "absolute", width: 70, height: 70, borderTop: `4px solid ${c}`, borderLeft: `4px solid ${c}`, transform: `rotate(${rot}deg)`, ...pos }} />
  );
  const label: React.CSSProperties = { position: "absolute", fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: c };
  return (
    <AbsoluteFill>
      {corner({ top: 150, left: 60 }, 0)}
      {corner({ top: 150, right: 60 }, 90)}
      {corner({ bottom: 300, right: 60 }, 180)}
      {corner({ bottom: 300, left: 60 }, 270)}
      <div style={{ ...label, top: 240, left: 90 }}>MONOGRAM</div>
      <div style={{ ...label, top: 240, right: 90 }}>
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ logo: string; title: string; line: string; beatLen: number; accent: string }> = ({ logo, title, line, beatLen, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (beat: number) => spring({ frame: frame - beat * beatLen, fps, config: { damping: 16, stiffness: 240 } });
  const a = at(0);
  const b = at(1);
  const c = at(2);
  return (
    <AbsoluteFill style={{ background: "#000", justifyContent: "center", alignItems: "center", gap: 60 }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 120, letterSpacing: 12, color: "#fff", opacity: a, transform: `scale(${interpolate(a, [0, 1], [1.4, 1])})` }}>
        {title}
      </div>
      <div style={{ width: interpolate(b, [0, 1], [0, 520]), height: 6, background: accent }} />
      <Img src={staticFile(logo)} style={{ width: 760, opacity: b, transform: `translateY(${(1 - b) * 40}px)` }} />
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 48, color: "#fff", textAlign: "center", whiteSpace: "pre-line", lineHeight: 1.4, opacity: c }}>
        {line}
      </div>
    </AbsoluteFill>
  );
};

export const BeatAd: React.FC<BeatAdProps> = (props) => {
  const { fps } = useVideoConfig();
  const brand = brands[props.brand];
  const f = (beat: number) => beatToFrame(props, beat, fps);
  const beatLen = Math.round((60 / props.bpm) * fps);

  let beat = 0;
  const shots = props.shots.map((s, i) => {
    const start = beat;
    beat += s.beats;
    const from = f(start);
    const beatFrames = Array.from({ length: Math.ceil(s.beats) }, (_, k) => f(start + k) - from);
    return (
      <Sequence key={i} from={from} durationInFrames={f(beat) - from}>
        <Shot src={s.src} at={s.at} rate={s.rate} move={s.move} flash={s.flash ?? false} beatFrames={beatFrames} />
        <Hud index={i} total={props.shots.length} />
      </Sequence>
    );
  });
  const mainBeats = beat;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shots}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)" }} />
      {props.texts.map((t, i) => (
        <Sequence key={i} from={f(t.beat)} durationInFrames={f(t.beat + t.beats) - f(t.beat)}>
          <Text text={t.text} style={t.style} beatLen={beatLen} accent={brand.colors.accent} />
        </Sequence>
      ))}
      <Sequence from={f(mainBeats)}>
        <Outro logo={brand.logo} title={props.outroTitle} line={props.outroLine} beatLen={beatLen} accent={brand.colors.accent} />
      </Sequence>
      {props.audio ? <Audio src={staticFile(props.audio)} trimBefore={Math.round(props.audioStartSec * fps)} /> : null}
    </AbsoluteFill>
  );
};
