import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand, REEL_FONT, isArabic, textGlow } from "../brands";

// Same shape Whisper transcripts get converted to. `words` = each word's start (ms) for the
// word-by-word fade; without it the words are spread over the line.
export type Caption = { text: string; startMs: number; endMs: number; words?: number[] };

// House captions (brand/Video_Editing_Guide.pdf): Montserrat Arabic Bold, white, word-by-word fade,
// glow in the account colour. English terms in CAPS, a touch smaller next to the Arabic.
export const captionWordStyle = (brand: Brand, word: string): React.CSSProperties => ({
  fontFamily: `"${REEL_FONT}", sans-serif`,
  fontWeight: 700,
  fontSize: /^[\x00-\x7F]+$/.test(word) ? 54 : 64, // the guide sets no size; 64 px reads at chest height without crowding
  color: "#FFFFFF",
  textShadow: textGlow(brand),
});

export const wordStarts = (c: Caption) => {
  const n = c.text.split(" ").length;
  return c.words && c.words.length === n
    ? c.words
    : Array.from({ length: n }, (_, i) => c.startMs + (i * Math.min(c.endMs - c.startMs, 900)) / n);
};

// Split a line into units: consecutive English (ASCII) words form one group, every other word stands alone.
const ascii = (w: string) => /^[\x00-\x7F]+$/.test(w);
const groups = (ws: string[]) =>
  ws.reduce<{ w: string; i: number }[][]>((acc, w, i) => {
    const last = acc[acc.length - 1];
    if (last && ascii(w) && ascii(last[last.length - 1].w)) last.push({ w, i });
    else acc.push([{ w, i }]);
    return acc;
  }, []);

export const CaptionLine: React.FC<{ caption: Caption; brand: Brand; nowMs: number; width?: number; nowrap?: boolean }> = ({
  caption,
  brand,
  nowMs,
  width = 920,
  nowrap = false,
}) => {
  const starts = wordStarts(caption);
  return (
    <div
      dir={isArabic(caption.text) ? "rtl" : "ltr"}
      style={{ width, lineHeight: 1.3, textAlign: "center", display: "flex", flexWrap: nowrap ? "nowrap" : "wrap", justifyContent: "center", columnGap: 16 }}
    >
      {groups(caption.text.split(" ")).map((g, gi) => {
        const word = (w: string, i: number) => (
          <span key={i} style={{ ...captionWordStyle(brand, w), opacity: interpolate(nowMs - starts[i], [0, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            {/^[\x00-\x7F]+$/.test(w) && w !== "LaserVision" ? w.toUpperCase() : w}
          </span>
        );
        // A run of English words inside an Arabic line is one left-to-right unit; otherwise RTL flex
        // would reverse it ("LaserVision Tripoli" showing as "TRIPOLI LaserVision").
        return g.length > 1 ? (
          <span key={gi} dir="ltr" style={{ display: "inline-flex", columnGap: 16 }}>
            {g.map(({ w, i }) => word(w, i))}
          </span>
        ) : (
          word(g[0].w, g[0].i)
        );
      })}
    </div>
  );
};

export const Captions: React.FC<{ captions: Caption[]; brand: Brand }> = ({ captions, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const current = captions.find((c) => nowMs >= c.startMs && nowMs < c.endMs);
  if (!current) return null;
  // Chest height (~60% down), clear of the face (REEL_STYLE.md).
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 1110 }}>
      <CaptionLine caption={current} brand={brand} nowMs={nowMs} />
    </AbsoluteFill>
  );
};
