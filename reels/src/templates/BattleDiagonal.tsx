import { z } from "zod";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";

loadFont({ family: "Outfit", url: staticFile("fonts/Outfit-Bold.ttf"), weight: "700" });
loadFont({ family: "Outfit", url: staticFile("fonts/Outfit-Medium.ttf"), weight: "500" });

const FONT = `"Outfit", "Inter", sans-serif`;

// "Battle" intro shot, diagonal layout: one clip of two contestants standing side by side becomes
// two panels split by a comic-style lightning bolt: the left contestant framed in the top-left
// panel, the right one in the bottom-right panel. Each panel has a light team-color tint behind
// the contestant (cut-out frames from scripts/cutout.py are laid back on top), gold VS on the bolt,
// names slam in when the contestants hit their pose (impactSec).

const framing = z.object({
  // Zoom of the 1080x1920 frame and where its top-left corner lands, in output pixels.
  scale: z.number(),
  x: z.number(),
  y: z.number(),
});

const side = z.object({
  name: z.string(),
  label: z.string(),
  color: z.string(),
  framing,
  // Name tag position in output pixels; anchor = which edge x is measured from.
  tag: z.object({ x: z.number(), y: z.number(), anchor: z.enum(["left", "right"]) }),
});

export const battleDiagonalSchema = z.object({
  video: z.string(),
  volume: z.number(),
  // Folder in public/ of RGBA cut-outs of the people, one per frame (000.webp…). Empty = none.
  cutout: z.string(),
  // Where the two people separate in the source, 0..1 of its width: each panel's cut-out only
  // keeps its own person.
  sourceSplit: z.number(),
  impactSec: z.number(),
  title: z.string(),
  // Bolt runs from the left edge at yLeft to the right edge at yRight (0..1 of the height).
  yLeft: z.number(),
  yRight: z.number(),
  boltWidth: z.number(),
  boltJog: z.number(),
  boltJogs: z.number(),
  // Team color strength, 0..1. Low keeps the store visible.
  tint: z.number(),
  left: side,
  right: side,
});

export type BattleDiagonalProps = z.infer<typeof battleDiagonalSchema>;

const Tint: React.FC<{ color: string; strength: number; outer: "top" | "bottom" }> = ({ color, strength, outer }) => {
  const dir = outer === "top" ? "to bottom" : "to top";
  return (
    <>
      <AbsoluteFill style={{ background: color, mixBlendMode: "color", opacity: 0.55 * strength }} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(${dir}, ${color} 0%, ${color}00 80%)`,
          mixBlendMode: "multiply",
          opacity: 0.5 * strength,
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.5) 0 32%, transparent 36%) 0 0 / 30px 30px",
          WebkitMaskImage: `linear-gradient(${dir}, #000 0%, transparent 60%)`,
          opacity: 0.3 * strength,
        }}
      />
    </>
  );
};

const NameTag: React.FC<{
  name: string;
  label: string;
  color: string;
  progress: number;
  tag: { x: number; y: number; anchor: "left" | "right" };
}> = ({ name, label, color, progress, tag }) => {
  const { width } = useVideoConfig();
  const dir = tag.anchor === "left" ? -1 : 1;
  const x = interpolate(progress, [0, 1], [dir * width * 0.7, 0]);
  return (
    <div
      style={{
        position: "absolute",
        top: tag.y,
        left: tag.anchor === "left" ? tag.x : undefined,
        right: tag.anchor === "right" ? tag.x : undefined,
        transform: `translateX(${x}px)`,
        display: "flex",
        flexDirection: "column",
        alignItems: tag.anchor === "left" ? "flex-start" : "flex-end",
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
          textShadow: "0 2px 12px rgba(0,0,0,0.7)",
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
          boxShadow: "0 10px 40px rgba(0,0,0,0.45), 0 0 0 5px #FFFFFF",
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

export const BattleDiagonal: React.FC<BattleDiagonalProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const hit = Math.round(p.impactSec * fps);

  // Bolt centerline, left to right: straight stretches broken by sharp jogs (perpendicular to the line).
  const pad = 80;
  const ax = -pad;
  const ay = p.yLeft * height;
  const bx = width + pad;
  const by = p.yRight * height;
  const len = Math.hypot(bx - ax, by - ay);
  const ux = (bx - ax) / len;
  const uy = (by - ay) / len;
  const nx = -uy; // normal pointing "up" from the line
  const ny = ux;
  const jogs = Math.max(0, Math.round(p.boltJogs));
  const jog = p.boltJog * width;
  // Each stretch runs from one side of the line to the other (-jog/2 → +jog/2), then a sharp jog
  // steps back across, like the classic comic bolt.
  const back = jog * 0.4;
  const bolt: [number, number][] = [[ax, ay]];
  for (let k = 1; k <= jogs; k++) {
    const d = (len * k) / (jogs + 1);
    bolt.push([ax + ux * (d + back / 2) + (nx * jog) / 2, ay + uy * (d + back / 2) + (ny * jog) / 2]);
    bolt.push([ax + ux * (d - back / 2) - (nx * jog) / 2, ay + uy * (d - back / 2) - (ny * jog) / 2]);
  }
  bolt.push([bx, by]);
  // Snap the last point onto B so both panels meet the frame edges exactly.
  bolt[bolt.length - 1] = [bx, by];

  const pct = (list: [number, number][]) => list.map(([x, y]) => `${(x / width) * 100}% ${(y / height) * 100}%`).join(", ");
  const topClip = `polygon(-10% -10%, 110% -10%, ${pct([...bolt].reverse())})`;
  const bottomClip = `polygon(${pct(bolt)}, 110% 110%, -10% 110%)`;
  const half = (p.boltWidth * width) / 2;
  const boltShape =
    [
      ...bolt.map(([x, y]) => [x + nx * half, y + ny * half]),
      ...[...bolt].reverse().map(([x, y]) => [x - nx * half, y - ny * half]),
    ]
      .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ") + " Z";

  // Tint builds at the start, a touch stronger on the hit.
  const tint =
    p.tint *
    (interpolate(frame, [0, 12], [0.6, 0.85], { extrapolateRight: "clamp" }) +
      interpolate(frame, [hit, hit + 3], [0, 0.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  // Bolt strikes left to right.
  const draw = interpolate(frame, [2, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Hit: punch-in that settles, short shake, white flash.
  const punch = spring({ frame: frame - hit, fps, config: { damping: 14, stiffness: 180 } });
  const zoom = frame < hit ? 1 : interpolate(punch, [0, 1], [1.1, 1.02]);
  const shakeAmt = interpolate(frame, [hit, hit + 8], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shakeX = frame >= hit ? Math.sin(frame * 2.7) * shakeAmt : 0;
  const shakeY = frame >= hit ? Math.cos(frame * 3.1) * shakeAmt * 0.6 : 0;
  const flash = interpolate(frame, [hit, hit + 1, hit + 5], [0, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const boltFlash = interpolate(frame, [hit, hit + 2, hit + 8], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const vs = spring({ frame: frame - hit, fps, config: { damping: 18, stiffness: 240 } });
  const vsScale = frame < hit ? 0 : Math.max(0.9, interpolate(vs, [0, 1], [2.6, 1]));
  const vsPulse = frame < hit + 10 ? 1 : 1 + Math.sin((frame - hit) / 4) * 0.03;
  const nameL = spring({ frame: frame - hit - 3, fps, config: { damping: 15, stiffness: 160 } });
  const nameR = spring({ frame: frame - hit - 6, fps, config: { damping: 15, stiffness: 160 } });
  const title = spring({ frame: frame - 4, fps, config: { damping: 16 } });

  const cutoutSrc = p.cutout ? staticFile(`${p.cutout}/${String(Math.min(frame, durationInFrames - 1)).padStart(3, "0")}.webp`) : "";

  const Panel: React.FC<{ s: z.infer<typeof side>; clip: string; which: "left" | "right" }> = ({ s, clip, which }) => {
    const place = {
      position: "absolute" as const,
      left: 0,
      top: 0,
      width,
      height,
      transformOrigin: "0 0",
      transform: `translate(${s.framing.x}px, ${s.framing.y}px) scale(${s.framing.scale})`,
    };
    const keep = which === "left" ? `inset(0 ${(1 - p.sourceSplit) * 100}% 0 0)` : `inset(0 0 0 ${p.sourceSplit * 100}%)`;
    return (
      <AbsoluteFill style={{ clipPath: clip }}>
        <div style={place}>
          <OffthreadVideo
            src={staticFile(p.video)}
            volume={which === "left" ? p.volume : 0}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <Tint color={s.color} strength={tint} outer={which === "left" ? "top" : "bottom"} />
        {cutoutSrc ? (
          <div style={place}>
            <Img src={cutoutSrc} style={{ width: "100%", height: "100%", objectFit: "cover", clipPath: keep }} />
          </div>
        ) : null}
      </AbsoluteFill>
    );
  };

  const mid = bolt[Math.floor(bolt.length / 2)];

  return (
    <AbsoluteFill style={{ background: "#000000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px) scale(${zoom})` }}>
        <Panel s={p.left} clip={topClip} which="left" />
        <Panel s={p.right} clip={bottomClip} which="right" />

        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <clipPath id="strike">
              <rect x={-pad} y={-pad} width={(width + pad * 2) * draw} height={height + pad * 2} />
            </clipPath>
            <filter id="boltGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="18" />
            </filter>
          </defs>
          <g clipPath="url(#strike)">
            <path d={boltShape} fill="#FFFFFF" opacity={0.4 + boltFlash * 0.4} filter="url(#boltGlow)" />
            <path d={boltShape} fill="none" stroke="#3A0F02" strokeWidth={30} strokeLinejoin="miter" strokeMiterlimit={20} />
            <path d={boltShape} fill="#FFFFFF" stroke="#F5891F" strokeWidth={14} strokeLinejoin="miter" strokeMiterlimit={20} />
          </g>
        </svg>
      </AbsoluteFill>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 150,
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

      {/* VS on the middle of the bolt */}
      <div
        style={{
          position: "absolute",
          left: mid[0] - 200,
          top: mid[1] - 130,
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
          { stroke: "18px #3A0F02", bg: undefined },
          { stroke: undefined, bg: "linear-gradient(180deg, #FFF59A 0%, #FFD23F 45%, #F5891F 100%)" },
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
              color: "transparent",
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

      <NameTag {...p.left} progress={nameL} />
      <NameTag {...p.right} progress={nameR} />

      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
