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
} from "remotion";
import { loadFont } from "@remotion/fonts";

loadFont({ family: "Outfit", url: staticFile("fonts/Outfit-Bold.ttf"), weight: "700" });
loadFont({ family: "Outfit", url: staticFile("fonts/Outfit-Medium.ttf"), weight: "500" });

const FONT = `"Outfit", "Inter", sans-serif`;

// "Battle" intro shot: one clip of two contestants, split down the middle by a comic-style lightning bolt.
// The background behind the left contestant is graded in one team color, the right in the other;
// the contestants stay in front of the color (cut-out frames from scripts/cutout.py laid over it).
// Halftone dots on each color, gold VS on the bolt, names slam in when the contestants hit their pose (impactSec).
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
  // Bolt thickness and jog size (0..1 of the width), number of jogs.
  boltWidth: z.number(),
  boltJog: z.number(),
  boltSegments: z.number(),
  // Height of the VS badge and the name tags (0..1 of the height).
  vsY: z.number(),
  namesY: z.number(),
  left: z.object({ name: z.string(), label: z.string(), color: z.string() }),
  right: z.object({ name: z.string(), label: z.string(), color: z.string() }),
});

export type BattleSplitProps = z.infer<typeof battleSplitSchema>;

export const battleSplitDuration = (fps: number, seconds: number) => Math.round(seconds * fps);

const Tint: React.FC<{ side: "left" | "right"; color: string; clip: string; strength: number; glowY: number }> = ({
  side,
  color,
  clip,
  strength,
  glowY,
}) => {
  const edge = side === "left" ? "to right" : "to left";
  const inner = side === "left" ? "100%" : "0%";
  const dots = (size: number, alpha: number) => `radial-gradient(circle, rgba(255,255,255,${alpha}) 0 34%, transparent 37%) 0 0 / ${size}px ${size}px`;
  return (
    <AbsoluteFill style={{ clipPath: clip }}>
      {/* Hue wash over the whole half: keeps the footage's light, swaps its color. */}
      <AbsoluteFill style={{ background: color, mixBlendMode: "color", opacity: 0.8 * strength }} />
      {/* Deeper color toward the outer edge. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(${edge}, ${color} 0%, ${color}DD 35%, ${color}66 100%)`,
          mixBlendMode: "multiply",
          opacity: 0.9 * strength,
        }}
      />
      {/* Halftone dots: big at the outer edge, shrinking toward the bolt. */}
      <AbsoluteFill
        style={{
          background: dots(46, 0.2),
          WebkitMaskImage: `linear-gradient(${edge}, #000 0%, transparent 55%)`,
          opacity: strength,
        }}
      />
      <AbsoluteFill
        style={{
          background: dots(26, 0.16),
          WebkitMaskImage: `linear-gradient(${edge}, transparent 25%, #000 60%, transparent 100%)`,
          opacity: strength,
        }}
      />
      {/* Light glow by the bolt, dark vignette at the outer edge. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 45% at ${inner} ${glowY * 100}%, rgba(255,255,255,0.35), transparent 70%)`,
          mixBlendMode: "screen",
          opacity: strength,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(${edge}, rgba(0,0,0,0.35) 0%, transparent 40%)`,
          opacity: strength,
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

  // Lightning bolt like a comic "VS" screen: straight diagonals broken by a few sharp jogs.
  // boltWidth = thickness, boltJog = jog size (both 0..1 of the width), boltSegments = number of jogs.
  const jogs = Math.max(0, Math.round(p.boltSegments));
  const pad = 80;
  const jogDy = height * 0.03;
  const diagDy = (height + pad * 2 - jogs * jogDy) / (jogs + 1);
  const diagDx = ((p.dividerBottom - p.dividerTop) * width - jogs * p.boltJog * width) / (jogs + 1);
  const bolt: [number, number][] = [[p.dividerTop * width, -pad]];
  for (let k = 0; k <= jogs; k++) {
    const [x, y] = bolt[bolt.length - 1];
    bolt.push([x + diagDx, y + diagDy]);
    if (k < jogs) bolt.push([x + diagDx + p.boltJog * width, y + diagDy + jogDy]);
  }
  const pts = (list: [number, number][]) => list.map(([x, y]) => `${(x / width) * 100}% ${(y / height) * 100}%`).join(", ");
  const leftClip = `polygon(0% 0%, ${pts(bolt)}, 0% 100%)`;
  const rightClip = `polygon(100% 0%, ${pts(bolt)}, 100% 100%)`;
  const half = (p.boltWidth * width) / 2;
  const boltShape =
    [...bolt.map(([x, y]) => [x - half, y]), ...[...bolt].reverse().map(([x, y]) => [x + half, y])]
      .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ") + " Z";

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

  const vsX = bolt.reduce((best, pt) => (Math.abs(pt[1] - p.vsY * height) < Math.abs(best[1] - p.vsY * height) ? pt : best))[0];
  const boltFlash = interpolate(frame, [hit, hit + 2, hit + 8], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#000000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px) scale(${zoom})` }}>
        <OffthreadVideo src={staticFile(p.video)} volume={p.volume} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <Tint side="left" color={p.left.color} clip={leftClip} strength={tint} glowY={p.vsY} />
        <Tint side="right" color={p.right.color} clip={rightClip} strength={tint} glowY={p.vsY} />

        {/* Lightning bolt between the two halves, behind the contestants. Strikes top to bottom. */}
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <clipPath id="strike">
              <rect x={0} y={-pad} width={width} height={(height + pad * 2) * draw} />
            </clipPath>
            <filter id="boltGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="18" />
            </filter>
          </defs>
          <g clipPath="url(#strike)">
            <path d={boltShape} fill="#FFFFFF" opacity={0.45 + boltFlash * 0.4} filter="url(#boltGlow)" />
            <path d={boltShape} fill="none" stroke="#3A0F02" strokeWidth={30} strokeLinejoin="miter" strokeMiterlimit={20} />
            <path d={boltShape} fill="#FFFFFF" stroke="#F5891F" strokeWidth={14} strokeLinejoin="miter" strokeMiterlimit={20} />
          </g>
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

      {/* VS: gold letters with a dark outline, slammed onto the bolt. */}
      <div
        style={{
          position: "absolute",
          left: vsX - 200,
          top: p.vsY * height - 130,
          width: 400,
          height: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${vsScale * vsPulse})`,
          opacity: frame < hit ? 0 : 1,
          filter: "drop-shadow(0 10px 0 rgba(40,8,0,0.55)) drop-shadow(0 0 40px rgba(255,190,60,0.55))",
        }}
      >
        {[
          { color: "transparent", stroke: "18px #3A0F02", bg: undefined },
          {
            color: "transparent",
            stroke: undefined,
            bg: "linear-gradient(180deg, #FFF59A 0%, #FFD23F 45%, #F5891F 100%)",
          },
        ].map((l, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              transform: "skewX(-10deg)",
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 200,
              letterSpacing: -6,
              lineHeight: 1,
              color: l.color,
              WebkitTextStroke: l.stroke,
              background: l.bg,
              WebkitBackgroundClip: l.bg ? "text" : undefined,
              backgroundClip: l.bg ? "text" : undefined,
            }}
          >
            VS
          </div>
        ))}
      </div>

      <NameTag side="left" {...p.left} progress={nameL} y={p.namesY} />
      <NameTag side="right" {...p.right} progress={nameR} y={p.namesY + 0.075} />

      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
