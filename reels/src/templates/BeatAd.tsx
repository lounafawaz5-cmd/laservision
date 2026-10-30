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
import { loadFont } from "@remotion/fonts";
import { brands } from "../brands";
import { WhatsAppIcon } from "../components/WhatsAppIcon";

// Outfit (thin, geometric) for brand-led edits where heavy type would fight a fine logo.
for (const [weight, file] of [["300", "Light"], ["500", "Medium"]]) {
  loadFont({ family: "Outfit", url: staticFile(`fonts/Outfit-${file}.ttf`), weight });
}

// Fast, ad-style product montage cut to the beat of a song.
// Every cut and text hit is placed in beats, so a new song only needs new beat times.

const move = z.enum(["punch", "push", "pull", "slideL", "slideR", "spin"]);

export const beatAdSchema = z.object({
  brand: z.enum(["laservision", "zvc"]),
  // "energetic": hard cuts with zoom hits, flashes, beat pulses and the frame-line overlay.
  // "calm": dissolves, slow drifts, quiet text fades, no overlay. Moves map to their gentle versions.
  look: z.enum(["energetic", "calm"]),
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
      // "logo": text is an image path in public/, revealed with a wipe.
      // "word": thin, wide-tracked key word. "cta": sentence-case line with an accent underline.
      style: z.enum(["slam", "letters", "outline", "tag", "small", "logo", "word", "cta"]),
    }),
  ),
  // Small logo in the corner overlay; empty = no logo.
  hudLogo: z.string(),
  outroBeats: z.number(),
  // Partner/product logo above the store wordmark on the end card.
  outroLogo: z.string(),
  outroLine: z.string(),
  // Shown after the WhatsApp icon; empty = no WhatsApp row.
  whatsapp: z.string(),
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
const THIN = `"Outfit", "Inter", sans-serif`;

const Shot: React.FC<{
  src: string;
  at: number;
  rate: number;
  move: z.infer<typeof move>;
  flash: boolean;
  beatFrames: number[];
  calm: boolean;
  fadeIn: number;
}> = ({ src, at, rate, move, flash, beatFrames, calm, fadeIn }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: d, width } = useVideoConfig();

  if (calm) {
    // Slow, even camera moves; the shot dissolves in over the previous one.
    const t = frame / Math.max(1, d - 1);
    const drift = move === "slideL" ? -1 : move === "slideR" ? 1 : 0;
    const scale = move === "pull" ? interpolate(t, [0, 1], [1.14, 1.04]) : drift ? 1.1 : interpolate(t, [0, 1], [1.04, 1.14]);
    const x = drift * interpolate(t, [0, 1], [-45, 45]);
    const opacity = fadeIn ? interpolate(frame, [0, fadeIn], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }) : 1;
    return (
      <AbsoluteFill style={{ overflow: "hidden", opacity }}>
        <AbsoluteFill style={{ transform: `translateX(${x}px) scale(${scale})`, filter: "contrast(1.04)" }}>
          <OffthreadVideo
            src={staticFile(src)}
            muted
            trimBefore={Math.round(at * fps)}
            playbackRate={rate}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

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

// Soft black falloff behind thin type so it stays readable over the white boxes and shelves.
const Scrim: React.FC<{ y: string; opacity: number }> = ({ y, opacity }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 16% at 50% ${y}, rgba(0,0,0,0.55), transparent)`, opacity }} />
);

const Text: React.FC<{ text: string; style: BeatAdProps["texts"][number]["style"]; beatLen: number; accent: string; calm: boolean }> = ({
  text,
  style,
  beatLen,
  accent,
  calm,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: d } = useVideoConfig();
  const inn = calm
    ? interpolate(frame, [0, Math.round(0.8 * fps)], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) })
    : spring({ frame, fps, config: { damping: 14, stiffness: 300, mass: 0.5 } });
  const outLen = calm ? Math.round(0.5 * fps) : 3;
  const out = interpolate(frame, [d - outLen, d], [1, 0], { extrapolateLeft: "clamp" });
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
  if (style === "logo") {
    // Wipe the logo on left to right over the first beat, then let it breathe.
    const wipe = interpolate(frame, [0, calm ? Math.round(1.2 * fps) : beatLen], [0, 100], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
        <Scrim y="50%" opacity={interpolate(frame, [0, beatLen], [0, 1], { extrapolateRight: "clamp" })} />
        <Img
          src={staticFile(text)}
          style={{
            width: 820,
            clipPath: `inset(0 ${100 - wipe}% 0 0)`,
            transform: `scale(${interpolate(frame, [0, d], [1, 1.06])})`,
            filter: "drop-shadow(0 6px 24px rgba(0,0,0,0.5))",
          }}
        />
      </AbsoluteFill>
    );
  }
  if (style === "word") {
    // Tracking opens up as the word fades in: quiet, not punchy.
    const spread = interpolate(inn, [0, 1], [0.05, 0.32]);
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
        <Scrim y="50%" opacity={inn} />
        <div
          style={{
            fontFamily: THIN,
            fontWeight: 300,
            // Long words shrink so the fully opened tracking still fits inside the frame lines.
            fontSize: Math.min(96, 860 / (text.length * 0.9)),
            letterSpacing: `${spread}em`,
            marginRight: `-${spread}em`,
            color: "#fff",
            opacity: inn,
            filter: `blur(${(1 - inn) * 8}px)`,
            textShadow: "0 4px 30px rgba(0,0,0,0.55)",
          }}
        >
          {text}
        </div>
        <div style={{ width: interpolate(inn, [0, 1], [0, 160]), height: 2, background: "#fff", marginTop: 34, opacity: 0.9 }} />
      </AbsoluteFill>
    );
  }
  if (style === "cta") {
    return (
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 400, opacity: out }}>
        <Scrim y="76%" opacity={inn} />
        <div
          style={{
            fontFamily: THIN,
            fontWeight: 500,
            fontSize: 64,
            letterSpacing: 2,
            color: "#fff",
            opacity: inn,
            transform: `translateY(${(1 - inn) * 30}px)`,
            textShadow: "0 4px 30px rgba(0,0,0,0.6)",
          }}
        >
          {text}
        </div>
        <div style={{ width: interpolate(inn, [0, 1], [0, 420]), height: 5, background: accent, marginTop: 22 }} />
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
const Hud: React.FC<{ index: number; total: number; logo: string }> = ({ index, total, logo }) => {
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
      {logo ? <Img src={staticFile(logo)} style={{ position: "absolute", top: 232, left: 90, width: 200, opacity: 0.9 }} /> : null}
      <div style={{ ...label, top: 240, right: 90 }}>
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ logo: string; storeLogo: string; line: string; whatsapp: string; beatLen: number; accent: string }> = ({
  logo,
  storeLogo,
  line,
  whatsapp,
  beatLen,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (beat: number) => spring({ frame: frame - beat * beatLen, fps, config: { damping: 200 } });
  const a = at(0);
  const b = at(1);
  const c = at(2);
  return (
    <AbsoluteFill style={{ background: "#000", justifyContent: "center", alignItems: "center", gap: 56 }}>
      {logo ? (
        <Img src={staticFile(logo)} style={{ width: 760, opacity: a, transform: `scale(${interpolate(a, [0, 1], [1.08, 1])})` }} />
      ) : null}
      <div style={{ width: interpolate(b, [0, 1], [0, 420]), height: 5, background: accent }} />
      <Img src={staticFile(storeLogo)} style={{ width: 620, opacity: b, transform: `translateY(${(1 - b) * 30}px)` }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: c }}>
        {whatsapp ? (
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <WhatsAppIcon size={64} />
            <div style={{ fontFamily: THIN, fontWeight: 500, fontSize: 56, letterSpacing: 3, color: "#fff" }}>{whatsapp}</div>
          </div>
        ) : null}
        {line ? <div style={{ fontFamily: THIN, fontWeight: 300, fontSize: 40, letterSpacing: 8, color: "#fff" }}>{line}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

export const BeatAd: React.FC<BeatAdProps> = (props) => {
  const { fps, durationInFrames } = useVideoConfig();
  const brand = brands[props.brand];
  const f = (beat: number) => beatToFrame(props, beat, fps);
  const beatLen = Math.round((60 / props.bpm) * fps);
  const calm = props.look === "calm";
  const dissolve = Math.round(0.7 * fps);

  let beat = 0;
  const shots = props.shots.map((s, i) => {
    const start = beat;
    beat += s.beats;
    const from = f(start);
    const beatFrames = Array.from({ length: Math.ceil(s.beats) }, (_, k) => f(start + k) - from);
    // Calm: each shot starts its dissolve half a dissolve early and runs past its cut, so the
    // midpoint of every dissolve sits on the beat.
    const pre = calm && i > 0 ? Math.round(dissolve / 2) : 0;
    const post = calm ? Math.round(dissolve / 2) : 0;
    return (
      <Sequence key={i} from={from - pre} durationInFrames={f(beat) - from + pre + post}>
        <Shot
          src={s.src}
          at={Math.max(0, s.at - (pre / fps) * s.rate)}
          rate={s.rate}
          move={s.move}
          flash={s.flash ?? false}
          beatFrames={beatFrames}
          calm={calm}
          fadeIn={pre * 2}
        />
        {calm ? null : <Hud index={i} total={props.shots.length} logo={props.hudLogo} />}
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
          <Text text={t.text} style={t.style} beatLen={beatLen} accent={brand.colors.accent} calm={calm} />
        </Sequence>
      ))}
      <Sequence from={f(mainBeats)}>
        <Outro
          logo={props.outroLogo}
          storeLogo={brand.logo}
          line={props.outroLine}
          whatsapp={props.whatsapp}
          beatLen={beatLen}
          accent={brand.colors.accent}
        />
      </Sequence>
      {props.audio ? (
        <Audio
          src={staticFile(props.audio)}
          trimBefore={Math.round(props.audioStartSec * fps)}
          // Song is cut mid-track, so fade the last beat and a half out instead of stopping dead.
          volume={(fr) => interpolate(fr, [durationInFrames - beatLen * 1.5, durationInFrames - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      ) : null}
    </AbsoluteFill>
  );
};
