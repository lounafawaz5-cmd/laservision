import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand, fontFor, isArabic } from "../brands";

// Same shape Whisper transcripts get converted to.
export type Caption = { text: string; startMs: number; endMs: number };

// size: font size in px (0 = brand default). outline: thin dark edge so white words stay readable on light sets.
export const Captions: React.FC<{ captions: Caption[]; brand: Brand; size?: number; outline?: boolean }> = ({
  captions,
  brand,
  size = 0,
  outline = false,
}) => {
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
          textShadow: clean ? (outline ? "0 3px 14px rgba(0,48,63,0.6)" : "0 2px 12px rgba(0,0,0,0.55)") : "none",
          WebkitTextStroke: outline ? `${Math.round((size || 66) / 9)}px #00303F` : undefined,
          paintOrder: outline ? "stroke fill" : undefined,
          fontFamily: fontFor(brand, current.text),
          fontWeight: clean ? 800 : 700,
          fontSize: size || (clean ? 66 : 58),
          lineHeight: 1.25,
          textAlign: "center",
        }}
      >
        {current.text}
      </div>
    </AbsoluteFill>
  );
};
