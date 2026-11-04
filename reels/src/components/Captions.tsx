import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand, isArabic } from "../brands";

// Same shape Whisper transcripts get converted to.
export type Caption = { text: string; startMs: number; endMs: number };

// House caption style from references/VIDEO_EDITING_GUIDE.md (both accounts):
// Montserrat Arabic Bold, white, word-by-word fade, glow in the account color (CapCut intensity 30, range 58).
export const Captions: React.FC<{ captions: Caption[]; brand: Brand; size?: number }> = ({ captions, brand, size = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const current = captions.find((c) => nowMs >= c.startMs && nowMs < c.endMs);
  if (!current) return null;

  const words = current.text.split(" ");
  // Words appear one after another across the first ~70% of the line, each with a short fade.
  const step = ((current.endMs - current.startMs) * 0.7) / words.length;
  const g = brand.colors.glow;

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 1120 }}>
      <div
        dir={isArabic(current.text) ? "rtl" : "ltr"}
        style={{
          maxWidth: 900,
          color: "#FFFFFF",
          // CapCut "Glow" preset 2 at intensity 30 / range 58, approximated as layered soft shadows.
          textShadow: `0 0 6px ${g}, 0 0 16px ${g}, 0 0 28px ${g}cc, 0 0 44px ${g}88`,
          fontFamily: '"Montserrat Arabic", sans-serif',
          fontWeight: 700,
          fontSize: size || 56,
          lineHeight: 1.3,
          textAlign: "center",
        }}
      >
        {words.map((w, i) => (
          <span
            key={i}
            style={{
              opacity: interpolate(nowMs - current.startMs - i * step, [0, 140], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
