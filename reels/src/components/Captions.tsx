import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand, fontFor, isArabic } from "../brands";

// Same shape Whisper transcripts get converted to.
export type Caption = { text: string; startMs: number; endMs: number };

export const Captions: React.FC<{ captions: Caption[]; brand: Brand }> = ({ captions, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const current = captions.find((c) => nowMs >= c.startMs && nowMs < c.endMs);
  if (!current) return null;

  const clean = brand.captionStyle === "clean";
  const fadeIn = interpolate(nowMs - current.startMs, [0, 120], [0, 1], { extrapolateRight: "clamp" });

  return (
    // Clean captions sit at chest height (~60% down); boxed ones sit lower.
    <AbsoluteFill style={{ alignItems: "center", paddingTop: clean ? 1120 : 1380 }}>
      <div
        dir={isArabic(current.text) ? "rtl" : "ltr"}
        style={{
          opacity: clean ? fadeIn : 1,
          maxWidth: 900,
          padding: clean ? 0 : "18px 32px",
          borderRadius: 20,
          background: clean ? "transparent" : brand.colors.captionBg,
          color: brand.colors.captionText,
          textShadow: clean ? "0 2px 12px rgba(0,0,0,0.55)" : "none",
          fontFamily: fontFor(brand, current.text),
          fontWeight: clean ? 800 : 700,
          fontSize: clean ? 66 : 58,
          lineHeight: 1.25,
          textAlign: "center",
        }}
      >
        {current.text}
      </div>
    </AbsoluteFill>
  );
};
