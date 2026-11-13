import { z } from "zod";
import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useVideoConfig } from "remotion";
import { brands } from "../brands";
import { Captions } from "../components/Captions";
import { PopOverlays } from "../components/PopOverlay";

for (const [file, weight] of [["Bold", "700"], ["Medium", "500"]] as const) {
  loadFont({ family: "Outfit", url: staticFile(`fonts/Outfit-${file}.ttf`), weight });
}

// Talking head (already cut, audio included) + full-screen B-roll cut-ins + pop-up overlays + subtitles.
// LaserVision house style (references/laservision/REEL_STYLE.md): no hook card, no end card, no zooms.
export const brollReelSchema = z.object({
  brand: z.enum(["laservision", "zvc"]),
  video: z.string(),
  durationMs: z.number(),
  broll: z.array(
    z.object({
      src: z.string(),
      fromMs: z.number(),
      toMs: z.number(),
      // Where in the clip to start, seconds.
      startSec: z.number(),
      // Horizontal crop position for 16:9 clips in a 9:16 frame, 0–100.
      x: z.number(),
    }),
  ),
  overlays: z.array(z.any()),
  captions: z.array(z.object({ text: z.string(), startMs: z.number(), endMs: z.number() })),
});

export type BrollReelProps = z.infer<typeof brollReelSchema>;

export const BrollReel: React.FC<BrollReelProps> = ({ brand: brandId, video, broll, overlays, captions }) => {
  const brand = brands[brandId];
  const { fps } = useVideoConfig();
  const f = (ms: number) => Math.round((ms / 1000) * fps);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile(video)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {broll.map((b) => (
        <Sequence key={b.fromMs} from={f(b.fromMs)} durationInFrames={f(b.toMs) - f(b.fromMs)}>
          <OffthreadVideo
            src={staticFile(b.src)}
            muted
            startFrom={Math.round(b.startSec * fps)}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${b.x}% 50%` }}
          />
        </Sequence>
      ))}
      <PopOverlays overlays={overlays} />
      <Captions captions={captions} brand={brand} />
    </AbsoluteFill>
  );
};
