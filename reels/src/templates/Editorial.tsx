import { z } from "zod";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";
import { WhatsAppIcon } from "../components/WhatsAppIcon";

for (const [weight, file] of [["300", "Light"], ["500", "Medium"]]) {
  loadFont({ family: "Outfit", url: staticFile(`fonts/Outfit-${file}.ttf`), weight });
}

// Fashion-editorial edit: hard cuts, real slow motion, a split screen, magazine type, white end card.
// No beat pulses, flashes or overlays. Timing is in seconds, so it works with or without music.

const clip = z.object({
  src: z.string(),
  // Seconds into the source clip.
  at: z.number(),
  // Footage speed. Sources are 50 fps, so 0.6 is true slow motion at 30 fps output.
  rate: z.number(),
});

export const editorialSchema = z.object({
  audio: z.string(),
  audioStartSec: z.number(),
  shots: z.array(
    z.object({
      ...clip.shape,
      sec: z.number(),
      // Second clip shown side by side with the first.
      split: clip.optional(),
      labels: z.tuple([z.string(), z.string()]).optional(),
    }),
  ),
  // Large thin title at the bottom of the frame; at/sec in seconds of the edit.
  titles: z.array(z.object({ text: z.string(), sub: z.string(), at: z.number(), sec: z.number() })),
  // Small running label top-left / top-right on every shot.
  cornerLeft: z.string(),
  cornerRight: z.string(),
  endSec: z.number(),
  endLine: z.string(),
  whatsapp: z.string(),
});

export type EditorialProps = z.infer<typeof editorialSchema>;

export const editorialDuration = (p: EditorialProps, fps: number) =>
  Math.round((p.shots.reduce((s, x) => s + x.sec, 0) + p.endSec) * fps);

const THIN = `"Outfit", sans-serif`;
// Type is black: this footage is bright (white wall, white dress, grey table), so ink reads like a magazine page.
const INK = "#000";

const Footage: React.FC<{ src: string; at: number; rate: number }> = ({ src, at, rate }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: d } = useVideoConfig();
  // One slow, even push-in per shot; nothing on the cut.
  const scale = interpolate(frame, [0, d], [1.0, 1.05]);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(src)}
        muted
        trimBefore={Math.round(at * fps)}
        playbackRate={rate}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          // Soft, slightly warm editorial grade.
          filter: "contrast(1.06) saturate(0.92) brightness(1.02)",
        }}
      />
    </AbsoluteFill>
  );
};

const Label: React.FC<{ text: string; style: React.CSSProperties }> = ({ text, style }) => (
  <div
    style={{
      position: "absolute",
      fontFamily: THIN,
      fontWeight: 500,
      fontSize: 28,
      letterSpacing: "0.35em",
      color: INK,
      ...style,
    }}
  >
    {text}
  </div>
);

const Split: React.FC<{ a: z.infer<typeof clip>; b: z.infer<typeof clip>; labels?: [string, string] }> = ({ a, b, labels }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // The divider draws down from the top, then the panels settle.
  const line = interpolate(frame, [0, Math.round(0.4 * fps)], [0, 100], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const half = (c: z.infer<typeof clip>, left: boolean, label?: string) => (
    <div style={{ position: "absolute", top: 0, bottom: 0, width: "50%", left: left ? 0 : "50%", overflow: "hidden" }}>
      <AbsoluteFill>
        <Footage {...c} />
      </AbsoluteFill>
      {label ? (
        <Label text={label} style={{ bottom: 360, width: "100%", textAlign: "center", fontSize: 34, marginRight: "-0.35em" }} />
      ) : null}
    </div>
  );
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      {half(a, true, labels?.[0])}
      {half(b, false, labels?.[1])}
      <div style={{ position: "absolute", left: "50%", top: 0, width: 6, marginLeft: -3, height: `${line}%`, background: "#fff" }} />
    </AbsoluteFill>
  );
};

const Title: React.FC<{ text: string; sub: string }> = ({ text, sub }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: d } = useVideoConfig();
  const inn = interpolate(frame, [0, Math.round(0.6 * fps)], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const out = interpolate(frame, [d - Math.round(0.3 * fps), d], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 80px 340px", opacity: out }}>
      <div style={{ overflow: "hidden" }}>
        <div
          style={{
            fontFamily: THIN,
            fontWeight: 300,
            fontSize: 112,
            lineHeight: 1.02,
            letterSpacing: "0.02em",
            color: INK,
            whiteSpace: "pre-line",
            transform: `translateY(${(1 - inn) * 110}%)`,
          }}
        >
          {text}
        </div>
      </div>
      {sub ? (
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 30, opacity: inn }}>
          <div style={{ width: interpolate(inn, [0, 1], [0, 90]), height: 2, background: INK }} />
          <div style={{ fontFamily: THIN, fontWeight: 500, fontSize: 30, letterSpacing: "0.35em", color: INK }}>{sub}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// White end card: dark wordmark, green WhatsApp icon + number. Never the word "WhatsApp".
const EndCard: React.FC<{ line: string; whatsapp: string }> = ({ line, whatsapp }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const step = (s: number) =>
    interpolate(frame, [s * fps, (s + 0.6) * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const a = step(0.1);
  const b = step(0.5);
  return (
    <AbsoluteFill style={{ background: "#fff", justifyContent: "center", alignItems: "center", gap: 60 }}>
      <Img src={staticFile("brand/zvc-wordmark-dark.png")} style={{ width: 640, opacity: a, transform: `translateY(${(1 - a) * 20}px)` }} />
      <div style={{ width: interpolate(b, [0, 1], [0, 120]), height: 2, background: "#000" }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: b }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <WhatsAppIcon size={56} color="#25D366" />
          <div style={{ fontFamily: THIN, fontWeight: 500, fontSize: 52, letterSpacing: "0.08em", color: "#000" }}>{whatsapp}</div>
        </div>
        <div style={{ fontFamily: THIN, fontWeight: 300, fontSize: 34, letterSpacing: "0.4em", marginRight: "-0.4em", color: "#000" }}>{line}</div>
      </div>
    </AbsoluteFill>
  );
};

export const Editorial: React.FC<EditorialProps> = (p) => {
  const { fps, durationInFrames } = useVideoConfig();
  const s2f = (s: number) => Math.round(s * fps);
  let t = 0;
  const shots = p.shots.map((s, i) => {
    const from = t;
    t += s.sec;
    return (
      <Sequence key={i} from={s2f(from)} durationInFrames={s2f(t) - s2f(from)}>
        {s.split ? <Split a={s} b={s.split} labels={s.labels} /> : <Footage src={s.src} at={s.at} rate={s.rate} />}
      </Sequence>
    );
  });
  const mainEnd = t;
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      {shots}
      <Sequence durationInFrames={s2f(mainEnd)}>
        <Label text={p.cornerLeft} style={{ top: 150, left: 80 }} />
        <Label text={p.cornerRight} style={{ top: 150, right: 80, marginRight: "-0.35em" }} />
      </Sequence>
      {p.titles.map((x, i) => (
        <Sequence key={i} from={s2f(x.at)} durationInFrames={s2f(x.sec)}>
          <Title text={x.text} sub={x.sub} />
        </Sequence>
      ))}
      <Sequence from={s2f(mainEnd)}>
        <EndCard line={p.endLine} whatsapp={p.whatsapp} />
      </Sequence>
      {p.audio ? (
        <Audio
          src={staticFile(p.audio)}
          trimBefore={s2f(p.audioStartSec)}
          volume={(fr) => interpolate(fr, [durationInFrames - s2f(1.5), durationInFrames - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      ) : null}
    </AbsoluteFill>
  );
};
