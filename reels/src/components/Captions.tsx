import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand, CAPTION_FONT, isArabic } from "../brands";

// Same shape Whisper transcripts get converted to.
export type Caption = { text: string; startMs: number; endMs: number };

// CapCut glow (intensity 30, range 58) recreated as stacked text shadows in the account's glow color.
const glow = (color: string) =>
  [`0 0 4px ${color}`, `0 0 10px ${color}`, `0 0 18px ${color}`, `0 0 28px ${color}b3`, `0 0 40px ${color}66`].join(", ");

const FONT_SIZE = 70;
const FADE_MS = 140;

let ctx: CanvasRenderingContext2D | null = null;
const measure = (text: string) => {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  ctx!.font = `700 ${FONT_SIZE}px "${CAPTION_FONT}"`;
  return ctx!.measureText(text).width;
};

// Video Editing Guide (brand/VIDEO_EDITING_GUIDE.md): Montserrat Arabic Bold, white,
// word-by-word fade, glow in the account color, no box.
//
// cover: a spot in the footage the subtitles must keep hidden (e.g. a wardrobe gap). One-off,
// only where Luna asks for it: the line is centered on that spot on a solid box in the account
// color, so the spot is hidden from each line's first frame while the words still fade in.
// Give it captions with no pauses between them.
export const Captions: React.FC<{ captions: Caption[]; brand: Brand; cover?: { x: number; y: number } }> = ({
  captions,
  brand,
  cover,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const current = captions.find((c) => nowMs >= c.startMs && nowMs < c.endMs);
  if (!current) return null;

  const words = current.text.split(" ");
  const rtl = isArabic(current.text);
  // Spread the words over the first 80% of the caption so the last one lands while it's still being said.
  const step = ((current.endMs - current.startMs) * 0.8) / words.length;

  const style: React.CSSProperties = {
    color: brand.colors.captionText,
    textShadow: glow(brand.colors.captionGlow),
    fontFamily: `"${CAPTION_FONT}", sans-serif`,
    fontWeight: 700,
    fontSize: FONT_SIZE,
    lineHeight: 1.35,
  };

  const opacityOf = (i: number) =>
    interpolate(nowMs - current.startMs - i * step, [0, FADE_MS], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const line = words.map((w, i) => (
    <span key={i} style={{ opacity: opacityOf(i) }}>
      {w}
      {i < words.length - 1 ? " " : ""}
    </span>
  ));

  if (cover) {
    const padX = 34;
    const boxW = measure(current.text) + padX * 2;
    // Centered on the spot, kept inside the frame.
    const left = Math.min(Math.max(cover.x - boxW / 2, 30), width - 30 - boxW);
    return (
      <AbsoluteFill>
        <div
          dir={rtl ? "rtl" : "ltr"}
          style={{
            ...style,
            position: "absolute",
            left,
            top: cover.y,
            width: boxW,
            transform: "translateY(-50%)",
            padding: `10px 0 14px`,
            textAlign: "center",
            whiteSpace: "nowrap",
            background: brand.colors.captionGlow,
            borderRadius: 24,
          }}
        >
          {line}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 1220 }}>
      <div dir={rtl ? "rtl" : "ltr"} style={{ ...style, maxWidth: 940, textAlign: "center" }}>
        {line}
      </div>
    </AbsoluteFill>
  );
};
