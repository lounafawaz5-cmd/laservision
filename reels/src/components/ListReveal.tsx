import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand } from "../brands";
import { CaptionLine } from "./Captions";

// Items stack up one by one as they're said, in exactly the caption style (font, glow, word fade).
// Times are ms relative to the start of this sequence.
export type ListItem = { text: string; atMs: number };

export const ListReveal: React.FC<{ items: ListItem[]; brand: Brand; top: number }> = ({ items, brand, top }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const out = interpolate(frame, [durationInFrames - 7, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: top, opacity: out }}>
      {items.map((item) =>
        nowMs < item.atMs ? null : (
          <CaptionLine
            key={item.text}
            brand={brand}
            nowMs={nowMs}
            width={960}
            nowrap
            caption={{ text: item.text, startMs: item.atMs, endMs: item.atMs + 400 }}
          />
        ),
      )}
    </AbsoluteFill>
  );
};
