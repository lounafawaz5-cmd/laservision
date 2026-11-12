import { z } from "zod";
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  Img,
  random,
} from "remotion";
import { loadFont } from "@remotion/fonts";

loadFont({ family: "Outfit", url: staticFile("fonts/Outfit-Bold.ttf"), weight: "700" });
loadFont({ family: "Outfit", url: staticFile("fonts/Outfit-Medium.ttf"), weight: "500" });

const FONT = `"Outfit", "Inter", sans-serif`;

// "Battle" intro shot: one clip of two contestants, split down the middle by a lightning bolt.
// The background behind the left contestant is graded in one team color, the right in the other;
// the contestants stay in front of the color (cut-out frames from scripts/cutout.py laid over it).
// VS badge on the bolt, names slam in when the contestants hit their pose (impactSec).
export const battleSplitSchema = z.object({
  video: z.string(),
  // Folder in public/ of RGBA cut-outs of the people, one per frame: 000.webp, 001.webp…
  // Empty = no cut-out (color goes over everything).
  cutout: z.string(),
  volume: z.number(),
  // Moment the contestants land their pose: flash, punch-in, VS and names.
  impactSec: z.number(),
  title: z.string(),
  // Divider x position (0..1 of the width) at the top and bottom of the frame; the bolt zigzags around it.
  dividerTop: z.number(),
  dividerBottom: z.number(),
  // Zigzag size (0..1 of the width) and number of zigzags.
  boltWidth: z.number(),
  boltSegments: z.number(),
  // Height of the VS badge and the name tags (0..1 of the height).
  vsY: z.number(),
  namesY: z.number(),
  left: z.object({ name: z.string(), label: z.string(), color: z.string() }),
  right: z.object({ name: z.string(), label: z.string(), color: z.string() }),
});

export type BattleSplitProps = z.infer<typeof battleSplitSchema>;

export const battleSplitDuration = (fps: number, seconds: number) => Math.round(seconds * fps);

const Tint: React.FC<{ side: "left" | "right"; color: string; clip: string; strength: number }> = ({
  side,
  color,
  clip,
  strength,
}) => {
  const edge = side === "left" ? "to right" : "to left";
  return (
    <AbsoluteFill style={{ clipPath: clip }}>
      {/* Hue wash over the whole half: keeps the footage's light, swaps its color. */}
      <AbsoluteFill style={{ background: color, mixBlendMode: "color", opacity: 0.6 * strength }} />
      {/* Deeper color toward the outer edge, fading toward the divider. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(${edge}, ${color} 0%, ${color}AA 18%, ${color}00 55%)`,
          mixBlendMode: "multiply",
          opacity: 0.85 * strength,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${side === "left" ? "0%" : "100%"} 50%, ${color}00 40%, #000000 120%)`,
          opacity: 0.55 * strength,
        }}
      />
    </AbsoluteFill>
  );
};

const NameTag: React.FC<{
  side: "left" | "right";
  name: string;
  label: string;
  color: string;
  progress: number;
  y: number;
}> = ({ side, name, label, color, progress, y }) => {
  const { width, height } = useVideoConfig();
  const dir = side === "left" ? -1 : 1;
  const x = interpolate(progress, [0, 1], [dir * width * 0.6, 0]);
  const align = side === "left" ? "flex-start" : "flex-end";
  return (
    <div
      style={{
        position: "absolute",
        top: y * height,
        left: side === "left" ? 56 : undefined,
        right: side === "right" ? 150 : undefined,
        transform: `translateX(${x}px)`,
        display: "flex",
        flexDirection: "column",
        alignItems: align,
        gap: 10,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 30,
          letterSpacing: 8,
          color: "#FFFFFF",
          textTransform: "uppercase",
          textShadow: "0 2px 12px rgba(0,0,0,0.6)",
          padding: "0 14px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          background: color,
          transform: "skewX(-12deg)",
          padding: "6px 34px 10px",
          boxShadow: `0 10px 40px rgba(0,0,0,0.45), 0 0 0 5px #FFFFFF`,
        }}
      >
        <div
          style={{
            transform: "skewX(12deg)",
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 104,
            lineHeight: 1.05,
            color: "#FFFFFF",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {name}
        </div>
      </div>
    </div>
  );
};

export const BattleSplit: React.FC<BattleSplitProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const hit = Math.round(p.impactSec * fps);

  // Lightning bolt: a fixed zigzag around the divider line, with a small crackle every 2 frames.
  const crackle = Math.floor(frame / 2);
  const bolt: [number, number][] = [];
  for (let i = 0; i <= p.boltSegments; i++) {
    const t = i / p.boltSegments;
    const base = p.dividerTop + (p.dividerBottom - p.dividerTop) * t;
    const zig = i === 0 || i === p.boltSegments ? 0 : (i % 2 ? 1 : -1) * p.boltWidth * (0.6 + 0.4 * random(`z${i}`));
    const jitter = (random(`j${i}-${crackle}`) - 0.5) * p.boltWidth * 0.35;
    const yJit = i === 0 || i === p.boltSegments ? 0 : (random(`y${i}`) - 0.5) * 0.3;
    bolt.push([(base + zig + jitter) * width, (t + yJit / p.boltSegments) * height]);
  }
  const pts = (list: [number, number][]) => list.map(([x, y]) => `${(x / width) * 100}% ${(y / height) * 100}%`).join(", ");
  const leftClip = `polygon(0% 0%, ${pts(bolt)}, 0% 100%)`;
  const rightClip = `polygon(100% 0%, ${pts(bolt)}, 100% 100%)`;
  const boltPath = bolt.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  // Small side forks off a few of the corners.
  const forks = [3, 7, 10]
    .filter((i) => i < p.boltSegments)
    .map((i) => {
      const [x, y] = bolt[i];
      const dir = i % 2 ? 1 : -1;
      const len = p.boltWidth * width * 1.4;
      return `M${x},${y} L${x + dir * len * 0.5},${y + len * 0.35} L${x + dir * len * 0.35},${y + len * 0.6} L${x + dir * len},${y + len}`;
    });

  // Tint eases in from the start, then jumps to full strength on the hit.
  const tint =
    interpolate(frame, [0, 12], [0.4, 0.7], { extrapolateRight: "clamp" }) +
    interpolate(frame, [hit, hit + 3], [0, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Bolt strikes top to bottom in the first frames.
  const draw = interpolate(frame, [2, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Hit: punch-in that settles, short shake, white flash.
  const punch = spring({ frame: frame - hit, fps, config: { damping: 14, stiffness: 180 } });
  const zoom = frame < hit ? 1 : interpolate(punch, [0, 1], [1.12, 1.03]);
  const shakeAmt = interpolate(frame, [hit, hit + 8], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shakeX = frame >= hit ? Math.sin(frame * 2.7) * shakeAmt : 0;
  const shakeY = frame >= hit ? Math.cos(frame * 3.1) * shakeAmt * 0.6 : 0;
  const flash = interpolate(frame, [hit, hit + 1, hit + 5], [0, 0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const vs = spring({ frame: frame - hit, fps, config: { damping: 18, stiffness: 240 } });
  const vsScale = frame < hit ? 0 : Math.max(0.9, interpolate(vs, [0, 1], [2.6, 1]));
  const vsPulse = frame < hit + 10 ? 1 : 1 + Math.sin((frame - hit) / 4) * 0.03;
  const nameL = spring({ frame: frame - hit - 3, fps, config: { damping: 15, stiffness: 160 } });
  const nameR = spring({ frame: frame - hit - 6, fps, config: { damping: 15, stiffness: 160 } });

  const title = spring({ frame: frame - 4, fps, config: { damping: 16 } });

  const vsX = ((p.dividerTop + (p.dividerBottom - p.dividerTop) * p.vsY) * width) | 0;
  const angle = (Math.atan2((p.dividerBottom - p.dividerTop) * width, height) * 180) / Math.PI;
  const boltFlicker = frame >= hit && frame < hit + 6 ? (frame % 2 ? 1 : 0.55) : 0.85 + 0.15 * random(`f${crackle}`);
  const boltLen = 4000;

  return (
    <AbsoluteFill style={{ background: "#000000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px) scale(${zoom})` }}>
        <OffthreadVideo src={staticFile(p.video)} volume={p.volume} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <Tint side="left" color={p.left.color} clip={leftClip} strength={tint} />
        <Tint side="right" color={p.right.color} clip={rightClip} strength={tint} />

        {/* Lightning bolt between the two halves, behind the contestants. */}
        <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: boltFlicker }}>
          <defs>
            <filter id="boltGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
          </defs>
          {[
            { w: 46, c: "#B9D4FF", o: 0.9, f: "url(#boltGlow)" },
            { w: 16, c: "#FFFFFF", o: 0.95, f: "url(#boltGlow)" },
            { w: 9, c: "#FFFFFF", o: 1, f: undefined },
          ].map((l, i) => (
            <g key={i} filter={l.f} opacity={l.o}>
              <path
                d={boltPath}
                fill="none"
                stroke={l.c}
                strokeWidth={l.w}
                strokeLinejoin="miter"
                strokeLinecap="round"
                strokeDasharray={boltLen}
                strokeDashoffset={boltLen * (1 - draw)}
              />
              {draw >= 1 &&
                forks.map((d, j) => (
                  <path key={j} d={d} fill="none" stroke={l.c} strokeWidth={l.w * 0.45} strokeLinejoin="miter" />
                ))}
            </g>
          ))}
        </svg>

        {p.cutout ? (
          <Img
            src={staticFile(`${p.cutout}/${String(Math.min(frame, durationInFrames - 1)).padStart(3, "0")}.webp`)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
      </AbsoluteFill>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 210,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          opacity: title,
          transform: `translateY(${interpolate(title, [0, 1], [-40, 0])}px)`,
        }}
      >
        <div
          style={{
            background: "#000000",
            color: "#FFFFFF",
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 50,
            letterSpacing: 12,
            padding: "16px 34px 18px 46px",
            textTransform: "uppercase",
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
          }}
        >
          {p.title}
        </div>
      </div>

      {/* VS badge on the divider */}
      <div
        style={{
          position: "absolute",
          left: vsX - 120,
          top: p.vsY * height - 120,
          width: 240,
          height: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${vsScale * vsPulse}) rotate(${angle}deg)`,
          opacity: frame < hit ? 0 : 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `linear-gradient(90deg, ${p.left.color} 50%, ${p.right.color} 50%)`,
            border: "8px solid #FFFFFF",
            boxShadow: "0 0 60px rgba(255,255,255,0.6), 0 16px 40px rgba(0,0,0,0.5)",
          }}
        />
        <div
          style={{
            position: "relative",
            transform: `rotate(${-angle}deg) skewX(-8deg)`,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 118,
            color: "#FFFFFF",
            letterSpacing: -2,
            textShadow: "0 6px 0 rgba(0,0,0,0.35)",
          }}
        >
          VS
        </div>
      </div>

      <NameTag side="left" {...p.left} progress={nameL} y={p.namesY} />
      <NameTag side="right" {...p.right} progress={nameR} y={p.namesY + 0.075} />

      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
