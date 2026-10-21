import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand, fontFor, isArabic } from "../brands";

export const Hook: React.FC<{ text: string; brand: Brand }> = ({ text, brand }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 260 }}>
      <div
        dir={isArabic(text) ? "rtl" : "ltr"}
        style={{
          opacity: enter * exit,
          transform: `translateY(${(1 - enter) * 40}px)`,
          maxWidth: 940,
          padding: "24px 40px",
          background: brand.colors.primary,
          color: brand.colors.text,
          fontFamily: fontFor(brand, text),
          fontWeight: 800,
          fontSize: 76,
          lineHeight: 1.15,
          textAlign: "center",
          borderBottom: `10px solid ${brand.colors.accent}`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
