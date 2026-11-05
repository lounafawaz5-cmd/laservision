import { z } from "zod";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { brands, REEL_FONT } from "../brands";
import { Captions } from "../components/Captions";
import { FieldEye, LogoPop, RockingBrain, SquintEyes } from "../components/Overlays";

// Talking head assembled from several takes of the same set-up: pick the best delivery of each line,
// join them with a short Mix (the guide's default transition), cut in B-roll, add overlays and subtitles.
// Segment times are in each source file's own timeline; everything else is in the OUTPUT timeline (ms).
export const multiTakeSchema = z.object({
  brand: z.enum(["laservision", "zvc"]),
  // Mix crossfade on each join between segments, in frames (0 = hard cut).
  mixFrames: z.number(),
  segments: z.array(z.object({ src: z.string(), from: z.number(), to: z.number(), note: z.string().optional() })),
  // B-roll over the speaker (her audio keeps playing). Empty src = a labelled placeholder until the clip exists.
  broll: z.array(z.object({ src: z.string(), from: z.number(), atMs: z.number(), durMs: z.number(), label: z.string() })),
  overlays: z.array(
    z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("fieldEye"), atMs: z.number(), durMs: z.number(), y: z.number(), spreadAtMs: z.number() }),
      z.object({ kind: z.literal("brain"), atMs: z.number(), durMs: z.number(), x: z.number(), y: z.number(), size: z.number() }),
      z.object({ kind: z.literal("squintEyes"), atMs: z.number(), durMs: z.number(), y: z.number(), eyeWidth: z.number() }),
      z.object({ kind: z.literal("logo"), atMs: z.number(), durMs: z.number(), y: z.number(), width: z.number(), src: z.string() }),
    ]),
  ),
  // Pop on each overlay entrance (guide: "Pop (lower) telop sound"; sfx/pop.wav stands in until the CapCut file is dropped in).
  popSfx: z.string(),
  popVolume: z.number(),
  captions: z.array(z.object({ text: z.string(), startMs: z.number(), endMs: z.number(), words: z.array(z.number()).optional() })),
});

export type MultiTakeProps = z.infer<typeof multiTakeSchema>;

export const multiTakeDuration = (p: MultiTakeProps, fps: number) =>
  p.segments.reduce((s, g) => s + Math.round((g.to - g.from) * fps), 0);

export const MultiTake: React.FC<MultiTakeProps> = (p) => {
  const brand = brands[p.brand];
  const { fps } = useVideoConfig();
  const f = (ms: number) => Math.round((ms / 1000) * fps);

  let at = 0;
  const parts = p.segments.map((g) => {
    const len = Math.round((g.to - g.from) * fps);
    const part = { ...g, at, len };
    at += len;
    return part;
  });

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {parts.map((g, i) => {
        // Each segment runs `mixFrames` past its end (muted) so the next one can fade in over it.
        const tail = i < parts.length - 1 ? p.mixFrames : 0;
        return (
          <Sequence key={i} from={g.at} durationInFrames={g.len + tail}>
            <Segment src={g.src} startFrom={Math.round(g.from * fps)} len={g.len} fadeIn={i > 0 ? p.mixFrames : 0} />
          </Sequence>
        );
      })}

      {p.broll.map((b, i) => (
        <Sequence key={`b${i}`} from={f(b.atMs)} durationInFrames={f(b.durMs)}>
          <Broll {...b} />
        </Sequence>
      ))}

      {p.overlays.map((o, i) => (
        <Sequence key={`o${i}`} from={f(o.atMs)} durationInFrames={f(o.durMs)}>
          {o.kind === "fieldEye" ? <FieldEye y={o.y} spreadAtMs={o.spreadAtMs} /> : null}
          {o.kind === "brain" ? <RockingBrain x={o.x} y={o.y} size={o.size} /> : null}
          {o.kind === "squintEyes" ? <SquintEyes y={o.y} eyeWidth={o.eyeWidth} /> : null}
          {o.kind === "logo" ? <LogoPop y={o.y} width={o.width} src={o.src} /> : null}
          <Audio src={staticFile(p.popSfx)} volume={p.popVolume} />
        </Sequence>
      ))}

      <Captions captions={p.captions} brand={brand} />
    </AbsoluteFill>
  );
};

const Segment: React.FC<{ src: string; startFrom: number; len: number; fadeIn: number }> = ({ src, startFrom, len, fadeIn }) => {
  const frame = useCurrentFrame();
  const opacity = fadeIn ? interpolate(frame, [0, fadeIn], [0, 1], { extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill style={{ opacity }}>
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={startFrom}
        // Audio only inside the segment's own length (the tail under the next fade is silent), with a
        // 2-frame ramp at each end so the joins don't click.
        volume={(fr) => interpolate(fr, [0, 2, len - 2, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};

// B-roll cut-in with a quick Mix in and out. No clip yet → a clearly labelled placeholder so the slot is visible in review.
const Broll: React.FC<{ src: string; from: number; durMs: number; label: string }> = ({ src, from, durMs, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const len = Math.round((durMs / 1000) * fps);
  const opacity = interpolate(frame, [0, 5, len - 5, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity }}>
      {src ? (
        <OffthreadVideo src={staticFile(src)} startFrom={Math.round(from * fps)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <AbsoluteFill style={{ background: "linear-gradient(170deg, #00303F, #005D83)", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: `"${REEL_FONT}", sans-serif`, fontWeight: 700, fontSize: 52, color: "#B6DFE5", textAlign: "center", padding: 80, border: "4px dashed #30A4BF", borderRadius: 30, width: 760, whiteSpace: "pre-line" }}>
            {label}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
