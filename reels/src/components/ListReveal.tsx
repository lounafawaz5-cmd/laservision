import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand, fontFor, isArabic } from "../brands";

// Items stack up one by one as they're said, in the same look as the clean subtitles.
// Times are ms relative to the start of this sequence.
export type ListItem = { text: string; atMs: number };

export const ListReveal: React.FC<{ items: ListItem[]; brand: Brand; top: number }> = ({ items, brand, top }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = interpolate(frame, [durationInFrames - 7, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: top, opacity: out }}>
      {items.map((item) => {
        const local = frame - Math.round((item.atMs / 1000) * fps);
        if (local < 0) return null;
        const pop = spring({ frame: local, fps, config: { damping: 11, stiffness: 180, mass: 0.6 } });
        return (
          <div
            key={item.text}
            dir={isArabic(item.text) ? "rtl" : "ltr"}
            style={{
              opacity: Math.min(1, local / 3),
              transform: `translateY(${(1 - pop) * 26}px) scale(${0.85 + 0.15 * pop})`,
              color: brand.colors.captionText,
              textShadow: "0 2px 12px rgba(0,0,0,0.55)",
              fontFamily: fontFor(brand, item.text),
              fontWeight: 800,
              fontSize: 66,
              lineHeight: 1.45,
              textAlign: "center",
            }}
          >
            {item.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
