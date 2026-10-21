import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand, fontFor, isArabic } from "../brands";

// Same shape Whisper transcripts get converted to.
export type Caption = { text: string; startMs: number; endMs: number };

export const Captions: React.FC<{ captions: Caption[]; brand: Brand }> = ({ captions, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const current = captions.find((c) => nowMs >= c.startMs && nowMs < c.endMs);
  if (!current) return null;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 420 }}>
      <div
        dir={isArabic(current.text) ? "rtl" : "ltr"}
        style={{
          maxWidth: 900,
          padding: "18px 32px",
          borderRadius: 20,
          background: brand.colors.captionBg,
          color: brand.colors.captionText,
          fontFamily: fontFor(brand, current.text),
          fontWeight: 700,
          fontSize: 58,
          lineHeight: 1.25,
          textAlign: "center",
        }}
      >
        {current.text}
      </div>
    </AbsoluteFill>
  );
};
