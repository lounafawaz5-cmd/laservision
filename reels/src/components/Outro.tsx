import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand, fontFor } from "../brands";

export const Outro: React.FC<{ brand: Brand }> = ({ brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill
      style={{
        background: brand.colors.background,
        justifyContent: "center",
        alignItems: "center",
        gap: 50,
      }}
    >
      <div style={{ opacity: enter, transform: `translateY(${(1 - enter) * 30}px)` }}>
        {brand.logo ? (
          <Img src={staticFile(brand.logo)} style={{ width: 760 }} />
        ) : (
          <div style={{ fontFamily: brand.fonts.latin, fontWeight: 800, fontSize: 110, color: brand.colors.text }}>
            {brand.name}
          </div>
        )}
      </div>
      <div
        style={{
          opacity: enter,
          fontFamily: fontFor(brand, brand.outroLine),
          fontSize: 50,
          textAlign: "center",
          whiteSpace: "pre-line",
          lineHeight: 1.4,
          fontWeight: 700,
          color: brand.logo ? brand.colors.primary : brand.colors.accent,
        }}
      >
        {brand.outroLine}
      </div>
    </AbsoluteFill>
  );
};
