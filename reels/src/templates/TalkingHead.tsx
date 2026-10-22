import { z } from "zod";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useVideoConfig } from "remotion";
import { brands } from "../brands";
import { Captions } from "../components/Captions";
import { Hook } from "../components/Hook";
import { Outro } from "../components/Outro";

export const talkingHeadSchema = z.object({
  brand: z.enum(["laservision", "zvc"]),
  // Path inside public/, e.g. "footage/2026-11-03 lasik-myths/main.mp4". Empty = placeholder.
  video: z.string(),
  // Empty hook = no hook card (LaserVision house style opens straight on the speaker).
  hook: z.string(),
  hookSeconds: z.number(),
  // 0 = no end card.
  outroSeconds: z.number(),
  captions: z.array(z.object({ text: z.string(), startMs: z.number(), endMs: z.number() })),
});

export type TalkingHeadProps = z.infer<typeof talkingHeadSchema>;

export const TalkingHead: React.FC<TalkingHeadProps> = ({ brand: brandId, video, hook, hookSeconds, outroSeconds, captions }) => {
  const brand = brands[brandId];
  const { fps, durationInFrames } = useVideoConfig();
  const outroFrames = Math.round(outroSeconds * fps);
  const mainFrames = durationInFrames - outroFrames;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={mainFrames}>
        {video ? (
          <OffthreadVideo src={staticFile(video)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <AbsoluteFill style={{ background: `linear-gradient(160deg, #333, ${brand.colors.primary})` }} />
        )}
        <Captions captions={captions} brand={brand} />
        {hook ? (
          <Sequence durationInFrames={Math.round(hookSeconds * fps)}>
            <Hook text={hook} brand={brand} />
          </Sequence>
        ) : null}
      </Sequence>
      {outroFrames > 0 ? (
        <Sequence from={mainFrames}>
          <Outro brand={brand} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
