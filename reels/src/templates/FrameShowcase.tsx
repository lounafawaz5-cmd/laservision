import { z } from "zod";
import {
  AbsoluteFill,
  Img,
  interpolate,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Try-on video with a product shot of each frame (transparent PNG from scripts/product-cutout.py)
// popping in above the model whenever that frame goes on her face. Each one stays until the next.

export const frameShowcaseSchema = z.object({
  video: z.string(),
  volume: z.number(),
  mirror: z.boolean(),
  // Center of the product shot and its max size, in output pixels.
  x: z.number(),
  y: z.number(),
  maxWidth: z.number(),
  maxHeight: z.number(),
  items: z.array(z.object({ src: z.string(), atSec: z.number() })),
});

export type FrameShowcaseProps = z.infer<typeof frameShowcaseSchema>;

const OUT = 8; // frames to animate out before the next one arrives

const Product: React.FC<{ src: string; from: number; to: number; p: FrameShowcaseProps }> = ({ src, from, to, p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from || frame >= to) return null;
  const t = frame - from;
  const pop = spring({ frame: t, fps, config: { damping: 13, stiffness: 170 } });
  const out = interpolate(frame, [to - OUT, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = interpolate(pop, [0, 1], [0.55, 1]) * interpolate(out, [0, 1], [1, 0.85]);
  const opacity = Math.min(1, pop * 1.4) * (1 - out);
  const rotate = interpolate(pop, [0, 1], [-8, 0]) + Math.sin(t / 22) * 1.2;
  const float = Math.sin(t / 18) * 8;
  return (
    <div
      style={{
        position: "absolute",
        left: p.x - p.maxWidth / 2,
        top: p.y - p.maxHeight / 2,
        width: p.maxWidth,
        height: p.maxHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transform: `translateY(${float}px) scale(${scale}) rotate(${rotate}deg)`,
      }}
    >
      {/* Soft light behind the frame so it separates from the busy wall. */}
      <div
        style={{
          position: "absolute",
          inset: "-10% -6%",
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0) 72%)",
        }}
      />
      <Img
        src={staticFile(src)}
        style={{
          position: "relative",
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 18px 22px rgba(0,0,0,0.35)) drop-shadow(0 3px 4px rgba(0,0,0,0.25))",
        }}
      />
    </div>
  );
};

export const FrameShowcase: React.FC<FrameShowcaseProps> = (p) => {
  const { fps, durationInFrames } = useVideoConfig();
  const starts = p.items.map((it) => Math.round(it.atSec * fps));
  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      <OffthreadVideo
        src={staticFile(p.video)}
        volume={p.volume}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: p.mirror ? "scaleX(-1)" : undefined }}
      />
      {p.items.map((it, i) => (
        <Product key={i} src={it.src} from={starts[i]} to={i + 1 < starts.length ? starts[i + 1] : durationInFrames} p={p} />
      ))}
    </AbsoluteFill>
  );
};
