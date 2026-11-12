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
} from "remotion";
import { loadFont } from "@remotion/fonts";

loadFont({ family: "Outfit", url: staticFile("fonts/Outfit-Bold.ttf"), weight: "700" });
loadFont({ family: "Outfit", url: staticFile("fonts/Outfit-Medium.ttf"), weight: "500" });

const FONT = `"Outfit", "Inter", sans-serif`;

// "Battle" intro shot: one clip of two contestants, split down the middle by a slanted line.
// Left half graded in one team color, right half in the other, VS badge on the line,
// names slam in when the contestants hit their pose (impactSec).
export const battleSplitSchema = z.object({
  video: z.string(),
  volume: z.number(),
  // Moment the contestants land their pose: flash, punch-in, VS and names.
  impactSec: z.number(),
  title: z.string(),
  // Divider x position (0..1 of the width) at the top and bottom of the frame.
  dividerTop: z.number(),
  dividerBottom: z.number(),
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
      <AbsoluteFill style={{ background: color, mixBlendMode: "color", opacity: 0.28 * strength }} />
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
  const { fps, width, height } = useVideoConfig();
  const hit = Math.round(p.impactSec * fps);

  const top = p.dividerTop * 100;
  const bot = p.dividerBottom * 100;
  const leftClip = `polygon(0% 0%, ${top}% 0%, ${bot}% 100%, 0% 100%)`;
  const rightClip = `polygon(${top}% 0%, 100% 0%, 100% 100%, ${bot}% 100%)`;

  // Tint eases in from the start, then jumps to full strength on the hit.
  const tint =
    interpolate(frame, [0, 12], [0.4, 0.7], { extrapolateRight: "clamp" }) +
    interpolate(frame, [hit, hit + 3], [0, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Divider draws top to bottom in the first 12 frames.
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

  return (
    <AbsoluteFill style={{ background: "#000000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px) scale(${zoom})` }}>
        <OffthreadVideo src={staticFile(p.video)} volume={p.volume} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <Tint side="left" color={p.left.color} clip={leftClip} strength={tint} />
        <Tint side="right" color={p.right.color} clip={rightClip} strength={tint} />
      </AbsoluteFill>

      {/* Divider: white core with a glow, drawn top to bottom. */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        {[
          { w: 26, c: "#FFFFFF", o: 0.7, f: "url(#glow)" },
          { w: 9, c: "#FFFFFF", o: 1, f: undefined },
        ].map((l, i) => (
          <line
            key={i}
            x1={p.dividerTop * width}
            y1={0}
            x2={p.dividerTop * width + (p.dividerBottom - p.dividerTop) * width * draw}
            y2={height * draw}
            stroke={l.c}
            strokeWidth={l.w}
            opacity={l.o}
            filter={l.f}
          />
        ))}
      </svg>

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
