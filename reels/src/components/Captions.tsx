import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand, CAPTION_FONT, isArabic } from "../brands";

// Same shape Whisper transcripts get converted to.
export type Caption = { text: string; startMs: number; endMs: number };

// CapCut glow (intensity 30, range 58) recreated as stacked text shadows in the account's glow color.
const glow = (color: string) =>
  [`0 0 4px ${color}`, `0 0 10px ${color}`, `0 0 18px ${color}`, `0 0 28px ${color}b3`, `0 0 40px ${color}66`].join(", ");

const FONT_SIZE = 70;
const FADE_MS = 140;
const MIN_COVER_WIDTH = 120;

let ctx: CanvasRenderingContext2D | null = null;
const measure = (text: string) => {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  ctx!.font = `700 ${FONT_SIZE}px "${CAPTION_FONT}"`;
  return ctx!.measureText(text).width;
};

// Left-to-right screen order of the words. In an Arabic line the words run right to left,
// but a run of English words inside it (e.g. "CONTACT LENS") still reads left to right.
const visualOrder = (words: string[], rtl: boolean) => {
  if (!rtl) return words.map((_, i) => i);
  const runs: number[][] = [];
  words.forEach((w, i) => {
    const latin = !isArabic(w);
    const last = runs[runs.length - 1];
    if (last && latin && !isArabic(words[last[last.length - 1]])) last.push(i);
    else runs.push([i]);
  });
  return runs.reverse().flat();
};

// Video Editing Guide (brand/VIDEO_EDITING_GUIDE.md): Montserrat Arabic Bold, white,
// word-by-word fade, glow in the account color, no box.
//
// cover: a spot in the footage the subtitles must keep hidden (e.g. a wardrobe gap). The line is
// slid sideways so its first wide word sits on that spot, and that word (with any words before it)
// shows from the line's first frame; the other words still fade in one by one. Give it captions with no pauses between them.
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

  const opacityOf = (i: number, pinned: number) =>
    // Words up to the pinned one show at once, so the reveal never runs out of reading order.
    i <= pinned
      ? 1
      : interpolate(nowMs - current.startMs - i * step, [0, FADE_MS], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  if (cover) {
    // Lay the words out ourselves on one line so we know where each one lands.
    const space = measure(" ");
    const order = visualOrder(words, rtl);
    const widths = words.map(measure);
    const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
    const xs: number[] = [];
    let x = 0;
    for (const i of order) {
      xs[i] = x;
      x += widths[i] + space;
    }
    const margin = 40;
    // Anchor on the first word wide enough to hide the spot (a short word like "في" lets it show
    // between its letters); any short words before it appear together with it.
    let anchor = words.findIndex((_, i) => widths[i] >= MIN_COVER_WIDTH);
    if (anchor < 0) anchor = widths.indexOf(Math.max(...widths));
    // Put that word's center on the spot, but keep the line inside the frame.
    const wanted = cover.x - (xs[anchor] + widths[anchor] / 2);
    const left = Math.min(Math.max(wanted, margin), width - margin - total);
    // Whichever word ends up over the spot (normally the anchor) is shown straight away.
    const over = words.reduce(
      (best, _, i) => (Math.abs(left + xs[i] + widths[i] / 2 - cover.x) < Math.abs(left + xs[best] + widths[best] / 2 - cover.x) ? i : best),
      0,
    );
    const pinned = Math.max(anchor, over);
    return (
      <AbsoluteFill>
        {words.map((w, i) => (
          <span
            key={i}
            style={{ ...style, position: "absolute", top: cover.y, left: left + xs[i], transform: "translateY(-50%)", whiteSpace: "pre", opacity: opacityOf(i, pinned) }}
          >
            {w}
          </span>
        ))}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 1220 }}>
      <div dir={rtl ? "rtl" : "ltr"} style={{ ...style, maxWidth: 940, textAlign: "center" }}>
        {words.map((w, i) => (
          <span key={i} style={{ opacity: opacityOf(i, -1) }}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
