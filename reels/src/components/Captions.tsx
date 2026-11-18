import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand, CAPTION_LATIN, isArabic } from "../brands";

// Same shape Whisper transcripts get converted to.
export type Caption = { text: string; startMs: number; endMs: number };

// Editing guide (references/EDITING_GUIDE.md): Montserrat Arabic Bold, CapCut "word-by-word fade"
// template, white text with a glow in the account color (CapCut intensity 30, range 58).
const glow = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const rgb = `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  return [
    `0 0 4px rgba(${rgb}, 1)`,
    `0 0 10px rgba(${rgb}, 0.95)`,
    `0 0 20px rgba(${rgb}, 0.8)`,
    `0 0 34px rgba(${rgb}, 0.55)`,
  ].join(", ");
};

const WORD_FADE_MS = 160;

export const Captions: React.FC<{ captions: Caption[]; brand: Brand }> = ({ captions, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const current = captions.find((c) => nowMs >= c.startMs && nowMs < c.endMs);
  if (!current) return null;

  const arabic = isArabic(current.text);
  const words = current.text.split(/\s+/).filter(Boolean);
  // Words come in one after another across the first part of the caption, then hold.
  const span = Math.min(current.endMs - current.startMs, Math.max(250, (current.endMs - current.startMs) * 0.7));
  const step = words.length > 1 ? span / words.length : 0;

  return (
    // Chest height, about 58% down, clear of the face.
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 1120 }}>
      <div
        dir={arabic ? "rtl" : "ltr"}
        style={{
          maxWidth: 900,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: "0.28em",
          color: "#FFFFFF",
          textShadow: glow(brand.captionGlow),
          fontFamily: `"Montserrat Arabic", "${CAPTION_LATIN}", "${brand.fonts.arabic}", sans-serif`,
          fontWeight: 700,
          fontSize: 66,
          lineHeight: 1.3,
          textAlign: "center",
        }}
      >
        {words.map((w, i) => {
          const t = nowMs - (current.startMs + i * step);
          const o = interpolate(t, [0, WORD_FADE_MS], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <span key={i} style={{ opacity: o }}>
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
