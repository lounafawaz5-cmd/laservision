import { z } from "zod";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { brands } from "../brands";

// Standalone end card, appended to finished edits (e.g. CapCut exports) with scripts/append-outro.sh.
export const brandOutroSchema = z.object({
  brand: z.enum(["laservision", "zvc"]),
});

const LV_BRANCHES = ["Hazmieh", "Saida", "Tripoli", "Hôtel-Dieu"];

export const BrandOutro: React.FC<z.infer<typeof brandOutroSchema>> = ({ brand: brandId }) => {
  const brand = brands[brandId];
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const logoIn = spring({ frame, fps, config: { damping: 200 } });
  const textIn = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  const fadeOut = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const isLv = brandId === "laservision";

  return (
    <AbsoluteFill
      style={{
        background: isLv ? "#00303F" : brand.colors.background,
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
        fontFamily: `"${brand.fonts.latin}", sans-serif`,
        color: "#FFFFFF",
      }}
    >
      <Img
        src={staticFile(isLv ? "brand/laservision-logo-white.png" : brand.logo)}
        style={{ width: 780, opacity: logoIn, transform: `translateY(${(1 - logoIn) * 30}px)` }}
      />
      <div
        style={{
          marginTop: 90,
          opacity: textIn,
          transform: `translateY(${(1 - textIn) * 20}px)`,
          textAlign: "center",
        }}
      >
        {isLv ? (
          <div style={{ fontSize: 40, fontWeight: 400, letterSpacing: 2, opacity: 0.85 }}>
            {LV_BRANCHES.join("  ·  ")}
          </div>
        ) : null}
        <div style={{ marginTop: 34, fontSize: 56, fontWeight: 700, whiteSpace: "pre-line", lineHeight: 1.35 }}>
          {isLv ? "WhatsApp +961 81 54 20 20" : brand.outroLine}
        </div>
      </div>
    </AbsoluteFill>
  );
};
