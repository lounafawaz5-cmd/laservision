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
  outroSeconds: z.number(),
  verdicts: z.array(z.object({ kind: z.enum(["myth", "fact"]), startMs: z.number(), endMs: z.number() })),
  captions: z.array(z.object({ text: z.string(), startMs: z.number(), endMs: z.number() })),
});

export type MythFactProps = z.infer<typeof mythFactSchema>;

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

export const MythFact: React.FC<MythFactProps> = ({ brand: brandId, video, audio, mainSeconds, outroSeconds, verdicts, captions }) => {
  const brand = brands[brandId];
  const { fps } = useVideoConfig();
  const mainFrames = Math.round(mainSeconds * fps);
  const ms = (t: number) => Math.round((t / 1000) * fps);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={mainFrames}>
        <OffthreadVideo src={staticFile(video)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <Html5Audio src={staticFile(audio)} />
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
