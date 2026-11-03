import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Glow AROUND a logo that is already burned into the footage. `dir` holds one halo PNG per frame
// (scripts/logo-halo.py): the halo has the logo cut out of it, so nothing is drawn on the logo
// itself and it stays as sharp as the original. Keyed per frame, so it follows CapCut's animation.
export const LogoGlow: React.FC<{ dir: string; frames: number; top: number; height: number }> = ({ dir, frames, top, height }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const i = Math.min(frame, frames - 1);
  const t = frame / fps;
  // Builds as the logo lands, one gentle pulse while it holds.
  const glow = interpolate(t, [0, 0.5, 0.8, 1.1], [0.5, 1, 0.8, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <Img
        src={staticFile(`${dir}/${String(i).padStart(4, "0")}.png`)}
        style={{ position: "absolute", left: 0, top, width, height, opacity: glow }}
      />
    </AbsoluteFill>
  );
};
