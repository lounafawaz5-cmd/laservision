import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Makes a logo that is already burned into the footage glow. `maskDir` holds one PNG per frame
// (scripts/logo-mask.py), keyed from the footage itself, so the glow follows the original
// pop-in / wipe-out exactly. Layers: a soft halo, a lit core, and one light sweep across it.
export const LogoGlow: React.FC<{ maskDir: string; maskFrames: number; top: number; height: number }> = ({
  maskDir,
  maskFrames,
  top,
  height,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const i = Math.min(frame, maskFrames - 1);
  const src = staticFile(`${maskDir}/${String(i).padStart(4, "0")}.png`);
  const t = frame / fps;

  // Builds as the logo lands, pulses once while it holds.
  const glow = interpolate(t, [0, 0.5, 0.75, 1.0, 1.3], [0.3, 1, 0.75, 1, 0.85], { extrapolateRight: "clamp" });
  const sweepX = interpolate(t, [0.55, 1.15], [-0.35, 1.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const box: React.CSSProperties = { position: "absolute", left: 0, top, width, height };
  const mask = { WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" };

  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {/* Halo */}
      <Img
        src={src}
        style={{
          ...box,
          opacity: glow,
          filter: `drop-shadow(0 0 ${10 + 8 * glow}px #30A4BF) drop-shadow(0 0 ${34 + 20 * glow}px #30A4BF)`,
        }}
      />
      {/* Light sweep, clipped to the logo shape */}
      <div
        style={{
          ...box,
          ...mask,
          background: `linear-gradient(105deg, transparent ${sweepX * 100 - 12}%, rgba(255,255,255,0.95) ${sweepX * 100}%, transparent ${sweepX * 100 + 12}%)`,
        }}
      />
    </AbsoluteFill>
  );
};
