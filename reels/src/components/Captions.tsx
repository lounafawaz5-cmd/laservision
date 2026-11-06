import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand, CAPTION_FONT, isArabic } from "../brands";

// Same shape Whisper transcripts get converted to.
export type Caption = { text: string; startMs: number; endMs: number };

// CapCut glow (intensity 30, range 58) recreated as stacked text shadows in the account's glow color.
const glow = (color: string) =>
  [`0 0 4px ${color}`, `0 0 10px ${color}`, `0 0 18px ${color}`, `0 0 28px ${color}b3`, `0 0 40px ${color}66`].join(", ");

// Video Editing Guide (brand/VIDEO_EDITING_GUIDE.md): Montserrat Arabic Bold, white,
// word-by-word fade, glow in the account color, no box.
export const Captions: React.FC<{ captions: Caption[]; brand: Brand }> = ({ captions, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const current = captions.find((c) => nowMs >= c.startMs && nowMs < c.endMs);
  if (!current) return null;

  const words = current.text.split(" ");
  // Spread the words over the first 80% of the caption so the last one lands while it's still being said.
  const step = ((current.endMs - current.startMs) * 0.8) / words.length;

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 1220 }}>
      <div
        dir={isArabic(current.text) ? "rtl" : "ltr"}
        style={{
          maxWidth: 940,
          color: brand.colors.captionText,
          textShadow: glow(brand.colors.captionGlow),
          fontFamily: `"${CAPTION_FONT}", sans-serif`,
          fontWeight: 700,
          fontSize: 70,
          lineHeight: 1.35,
          textAlign: "center",
        }}
      >
        {words.map((w, i) => {
          const t = nowMs - current.startMs - i * step;
          const opacity = interpolate(t, [0, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <span key={i} style={{ opacity }}>
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
