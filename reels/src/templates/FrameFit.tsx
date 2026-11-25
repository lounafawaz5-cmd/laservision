import { z } from "zod";
import { AbsoluteFill, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";

for (const [file, weight] of [["Medium", "500"], ["Bold", "700"]] as const) {
  loadFont({ family: "Outfit", url: staticFile(`fonts/Outfit-${file}.ttf`), weight });
}
const FONT = `"Outfit", sans-serif`;

// Right vs wrong comparison: two clips of the same gestures stacked full-bleed (wrong on top, right below),
// played in slow motion with a ❌ / ✅ badge on each, the section title on the seam and captions synced to the gestures.
const clip = z.object({
  src: z.string(),
  srcW: z.number(),
  srcH: z.number(),
  centerX: z.number(), // horizontal crop center in source px
});

export const frameFitSchema = z.object({
  wrong: clip,
  right: clip,
  rate: z.number(),
  clipSec: z.number(),
  sections: z.array(z.object({ title: z.string(), wrong: z.string(), right: z.string(), fromClipSec: z.number() })),
  outroSec: z.number(),
});
export type FrameFitProps = z.infer<typeof frameFitSchema>;

export const frameFitDuration = (p: FrameFitProps, fps: number) => Math.ceil((p.clipSec / p.rate + p.outroSec) * fps);

const W = 1080;
const PANEL_H = 960;
const PANELS = [
  { kind: "wrong" as const, top: 0 },
  { kind: "right" as const, top: PANEL_H },
];
const RED = "#E5322D";
const GREEN = "#2DB84B";

const Badge: React.FC<{ kind: "wrong" | "right"; top: number; delay: number }> = ({ kind, top, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 11, stiffness: 160 } });
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 44,
        width: 132,
        height: 132,
        borderRadius: 66,
        background: kind === "wrong" ? RED : GREEN,
        border: "6px solid #FFFFFF",
        boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${s})`,
      }}
    >
      <svg width="70" height="70" viewBox="0 0 24 24">
        {kind === "wrong" ? (
          <path d="M5 5 L19 19 M19 5 L5 19" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M4 12.5 L9.5 18 L20 6.5" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        )}
      </svg>
    </div>
  );
};

const Caption: React.FC<{ text: string; kind: "wrong" | "right"; top: number; inAt: number }> = ({ text, kind, top, inAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: frame - inAt, fps, config: { damping: 200 }, durationInFrames: 12 });
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 50,
        right: 50,
        display: "flex",
        justifyContent: "center",
        opacity: a,
        transform: `translateY(${(1 - a) * 24}px)`,
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.72)",
          borderLeft: `10px solid ${kind === "wrong" ? RED : GREEN}`,
          borderRadius: 16,
          padding: "18px 28px",
          color: "#FFFFFF",
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 44,
          lineHeight: 1.2,
          textAlign: "center",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const FrameFit: React.FC<FrameFitProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mainF = Math.round((p.clipSec / p.rate) * fps);
  const sectionStart = (s: { fromClipSec: number }) => Math.round((s.fromClipSec / p.rate) * fps);

  let idx = 0;
  p.sections.forEach((s, i) => {
    if (frame >= sectionStart(s)) idx = i;
  });
  const section = p.sections[idx];
  const key = sectionStart(section);
  const titleIn = spring({ frame: frame - key, fps, config: { damping: 200 }, durationInFrames: 12 });

  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      <Sequence durationInFrames={mainF} layout="none">
        {PANELS.map(({ kind, top }) => {
          const c = p[kind];
          const scale = PANEL_H / c.srcH;
          const vidW = c.srcW * scale;
          const left = Math.min(0, Math.max(W - vidW, W / 2 - c.centerX * scale));
          return (
            <div key={kind} style={{ position: "absolute", top, left: 0, width: W, height: PANEL_H, overflow: "hidden" }}>
              <OffthreadVideo
                src={staticFile(c.src)}
                playbackRate={p.rate}
                muted
                style={{ position: "absolute", left, top: 0, width: vidW, height: PANEL_H }}
              />
            </div>
          );
        })}

        {/* Seam between the two clips. */}
        <div style={{ position: "absolute", top: PANEL_H - 3, left: 0, width: W, height: 6, background: "#FFFFFF" }} />

        {/* Badges sit on the left, clear of Instagram's top bar and right-hand buttons. */}
        <Badge kind="wrong" top={230} delay={0} />
        <Badge kind="right" top={PANEL_H + 60} delay={6} />

        {/* Captions sit below the face (chest height), the bottom one above Instagram's caption area. */}
        <Caption key={`w${idx}`} text={section.wrong} kind="wrong" top={640} inAt={key} />
        <Caption key={`r${idx}`} text={section.right} kind="right" top={PANEL_H + 520} inAt={key} />

        {/* Section title on the seam, center of the screen. */}
        <div
          style={{
            position: "absolute",
            top: PANEL_H - 52,
            left: 0,
            width: W,
            display: "flex",
            justifyContent: "center",
            opacity: titleIn,
            transform: `scale(${0.9 + 0.1 * titleIn})`,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              color: "#000000",
              borderRadius: 52,
              padding: "16px 44px",
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 54,
              boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
            }}
          >
            {section.title}
          </div>
        </div>
      </Sequence>

      <Sequence from={mainF} durationInFrames={Math.round(p.outroSec * fps)}>
        {/* The standard ZVC end card (Luna's export), 2.5 s, 1080×1920. */}
        <OffthreadVideo src={staticFile("brand/zvc-outro.mp4")} muted />
      </Sequence>
    </AbsoluteFill>
  );
};
