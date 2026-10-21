import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand, fontFor } from "../brands";

export const Outro: React.FC<{ brand: Brand }> = ({ brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        background: brand.colors.primary,
        justifyContent: "center",
        alignItems: "center",
        gap: 30,
        color: brand.colors.text,
      }}
    >
      {/* Swap for the logo file once the brand kit is in public/brand/ */}
      <div style={{ transform: `scale(${scale})`, fontFamily: brand.fonts.latin, fontWeight: 800, fontSize: 110 }}>
        {brand.name}
      </div>
      <div style={{ fontFamily: fontFor(brand, brand.outroLine), fontSize: 52, color: brand.colors.accent }}>
        {brand.outroLine}
      </div>
    </AbsoluteFill>
  );
};
