import { z } from "zod";
import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { brands } from "../brands";
import { Captions } from "../components/Captions";
import { FieldEye } from "../components/Overlays";

// Patch a finished export (e.g. Luna's CapCut edit) without re-cutting it: full-frame cover cards over
// moments to hide (a laugh, a slip), each a LaserVision-colour background with an illustrated overlay on it.
// The export's audio plays untouched. Its burned-in subtitles are hidden under a card, so the captions
// for each card's span are redrawn on top. All times are in the export's own timeline (ms).
export const exportPatchSchema = z.object({
  brand: z.enum(["laservision", "zvc"]),
  video: z.string(),
  durationSec: z.number(),
  // Mix in/out on each card, in frames (the guide's default transition).
  mixFrames: z.number(),
  cards: z.array(
    z.object({
      fromMs: z.number(),
      toMs: z.number(),
      overlay: z.object({ kind: z.literal("fieldEye"), y: z.number(), eyeWidth: z.number(), spreadAtMs: z.number() }),
    }),
  ),
  captions: z.array(z.object({ text: z.string(), startMs: z.number(), endMs: z.number(), words: z.array(z.number()).optional() })),
});

export type ExportPatchProps = z.infer<typeof exportPatchSchema>;

export const ExportPatch: React.FC<ExportPatchProps> = (p) => {
  const brand = brands[p.brand];
  const { fps } = useVideoConfig();
  const f = (ms: number) => Math.round((ms / 1000) * fps);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile(p.video)} style={{ width: "100%", height: "100%" }} />
      {p.cards.map((c, i) => (
        <Sequence key={i} from={f(c.fromMs)} durationInFrames={f(c.toMs) - f(c.fromMs)}>
          <Card mixFrames={p.mixFrames}>
            <FieldEye y={c.overlay.y} spreadAtMs={c.overlay.spreadAtMs} eyeWidth={c.overlay.eyeWidth} />
          </Card>
          {/* Shift captions into the card's local time so only this span's lines show */}
          <Captions
            brand={brand}
            captions={p.captions
              .filter((cap) => cap.endMs > c.fromMs && cap.startMs < c.toMs)
              .map((cap) => ({
                text: cap.text,
                startMs: Math.max(cap.startMs, c.fromMs) - c.fromMs,
                endMs: Math.min(cap.endMs, c.toMs) - c.fromMs,
                words: cap.words?.map((w) => w - c.fromMs),
              }))}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// LaserVision primaries: deep navy to brand blue, with a soft teal light behind the overlay.
const Card: React.FC<{ mixFrames: number; children: React.ReactNode }> = ({ mixFrames, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(frame, [0, mixFrames, durationInFrames - mixFrames, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill style={{ background: "linear-gradient(170deg, #00303F 0%, #005D83 100%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, rgba(48,164,191,0.35) 0%, rgba(48,164,191,0) 55%)" }} />
      {children}
    </AbsoluteFill>
  );
};
