import { z } from "zod";
import { AbsoluteFill, Html5Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { brands } from "../brands";
import { Captions } from "../components/Captions";
import { BrandOutro } from "./BrandOutro";

// Myth-or-fact talking head: questions off camera, doctor answers.
// A glowing border frames each answer: red for a myth, green for a fact.
export const mythFactSchema = z.object({
  brand: z.enum(["laservision", "zvc"]),
  // Paths inside public/. Audio is the cleaned track (questions lifted), video is muted.
  video: z.string(),
  audio: z.string(),
  mainSeconds: z.number(),
  // Ranges of the source to drop (e.g. a whole question). Times in captions/verdicts stay in source time.
  cuts: z.array(z.object({ startMs: z.number(), endMs: z.number() })).default([]),
  outroSeconds: z.number(),
  verdicts: z.array(z.object({ kind: z.enum(["myth", "fact"]), startMs: z.number(), endMs: z.number() })),
  captions: z.array(z.object({ text: z.string(), startMs: z.number(), endMs: z.number() })),
});

export type MythFactProps = z.input<typeof mythFactSchema>;

const sortedCuts = (cuts: { startMs: number; endMs: number }[] = []) => [...cuts].sort((a, b) => a.startMs - b.startMs);

// Source-time pieces that stay, in order.
export const keptSegments = (mainMs: number, cuts: { startMs: number; endMs: number }[] = []) => {
  const out: { startMs: number; endMs: number }[] = [];
  let t = 0;
  for (const c of sortedCuts(cuts)) {
    if (c.startMs > t) out.push({ startMs: t, endMs: c.startMs });
    t = Math.max(t, c.endMs);
  }
  if (t < mainMs) out.push({ startMs: t, endMs: mainMs });
  return out;
};

export const keptMs = (mainMs: number, cuts: { startMs: number; endMs: number }[] = []) =>
  keptSegments(mainMs, cuts).reduce((a, k) => a + k.endMs - k.startMs, 0);

// Move a source-time range onto the edited timeline; null if it falls inside a cut.
const remap = <T extends { startMs: number; endMs: number }>(item: T, cuts: { startMs: number; endMs: number }[]): T | null => {
  let shift = 0;
  for (const c of sortedCuts(cuts)) {
    if (item.startMs >= c.startMs && item.startMs < c.endMs) return null;
    if (item.startMs >= c.endMs) shift += c.endMs - c.startMs;
  }
  return { ...item, startMs: item.startMs - shift, endMs: item.endMs - shift };
};

const COLORS = { myth: "255, 45, 45", fact: "40, 225, 110" };

const GlowBorder: React.FC<{ kind: "myth" | "fact"; frames: number }> = ({ kind, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = Math.min(
    interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(frame, [frames - 6, frames], [1, 0], { extrapolateLeft: "clamp" }),
  );
  // Slow breathing glow, about one pulse every 1.6 s.
  const pulse = 0.75 + 0.25 * Math.sin((frame / fps) * Math.PI * 1.25);
  const c = COLORS[kind];
  return (
    <AbsoluteFill
      style={{
        opacity: fade,
        pointerEvents: "none",
        border: `12px solid rgba(${c}, 1)`,
        boxShadow: [
          `inset 0 0 ${40 * pulse}px rgba(${c}, 0.95)`,
          `inset 0 0 ${110 * pulse}px rgba(${c}, 0.55)`,
          `inset 0 0 ${220 * pulse}px rgba(${c}, 0.25)`,
        ].join(", "),
      }}
    />
  );
};

export const MythFact: React.FC<MythFactProps> = ({ brand: brandId, video, audio, mainSeconds, cuts = [], outroSeconds, verdicts: srcVerdicts, captions: srcCaptions }) => {
  const brand = brands[brandId];
  const { fps } = useVideoConfig();
  const ms = (t: number) => Math.round((t / 1000) * fps);
  const segments = keptSegments(mainSeconds * 1000, cuts);
  const mainFrames = ms(keptMs(mainSeconds * 1000, cuts));
  const captions = srcCaptions.map((c) => remap(c, cuts)).filter((c): c is NonNullable<typeof c> => c !== null);
  const verdicts = srcVerdicts.map((v) => remap(v, cuts)).filter((v): v is NonNullable<typeof v> => v !== null);
  let at = 0;
  const pieces = segments.map((seg) => {
    const from = at;
    const len = ms(seg.endMs) - ms(seg.startMs);
    at += len;
    return { from, len, startFrame: ms(seg.startMs) };
  });

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={mainFrames}>
        {pieces.map((p, i) => (
          <Sequence key={i} from={p.from} durationInFrames={p.len}>
            <OffthreadVideo src={staticFile(video)} muted trimBefore={p.startFrame} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <Html5Audio src={staticFile(audio)} trimBefore={p.startFrame} />
          </Sequence>
        ))}
        {verdicts.map((v, i) => (
          <Sequence key={i} from={ms(v.startMs)} durationInFrames={ms(v.endMs) - ms(v.startMs)}>
            <GlowBorder kind={v.kind} frames={ms(v.endMs) - ms(v.startMs)} />
          </Sequence>
        ))}
        <Captions captions={captions} brand={brand} />
      </Sequence>
      <Sequence from={mainFrames} durationInFrames={Math.round(outroSeconds * fps)}>
        <BrandOutro brand={brandId} />
      </Sequence>
    </AbsoluteFill>
  );
};
