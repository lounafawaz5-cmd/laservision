import { z } from "zod";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";
import { BrandOutro } from "./BrandOutro";

for (const [file, weight] of [["Medium", "500"], ["Bold", "700"]] as const) {
  loadFont({ family: "Outfit", url: staticFile(`fonts/Outfit-${file}.ttf`), weight });
}
const FONT = `"Outfit", sans-serif`;

// Right vs wrong comparison: two clips of the same gestures stacked (wrong on top, right below).
// Opens on a frozen first frame with a spotlight on the glasses + "ding ding", then plays both in slow motion
// with a ❌ / ✅ badge on each and the section captions synced to the gestures.
const clip = z.object({
  src: z.string(),
  still: z.string(), // first frame, used for the frozen intro
  srcW: z.number(),
  srcH: z.number(),
  centerX: z.number(), // horizontal crop center in source px
  glasses: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }), // center + size in source px, frame 0
});

export const frameFitSchema = z.object({
  title: z.string(),
  wrong: clip,
  right: clip,
  introSec: z.number(),
  rate: z.number(),
  clipSec: z.number(),
  ding: z.string(),
  dingsSec: z.array(z.number()),
  sections: z.array(z.object({ title: z.string(), wrong: z.string(), right: z.string(), fromClipSec: z.number() })),
  outroSec: z.number(),
});
export type FrameFitProps = z.infer<typeof frameFitSchema>;

export const frameFitDuration = (p: FrameFitProps, fps: number) =>
  Math.ceil((p.introSec + p.clipSec / p.rate + p.outroSec) * fps);

const W = 1080;
const HEADER = 300;
const PANEL_H = 700;
const GAP = 12;
const PANELS = [
  { kind: "wrong" as const, top: HEADER },
  { kind: "right" as const, top: HEADER + PANEL_H + GAP },
];
const RED = "#E5322D";
const GREEN = "#2DB84B";

const Badge: React.FC<{ kind: "wrong" | "right"; delay: number }> = ({ kind, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 11, stiffness: 160 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 28,
        right: 28,
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

const Panel: React.FC<{ p: FrameFitProps; kind: "wrong" | "right"; top: number; caption: string; captionKey: number }> = ({
  p,
  kind,
  top,
  caption,
  captionKey,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = p[kind];
  const scale = PANEL_H / c.srcH;
  const vidW = c.srcW * scale;
  const left = Math.min(0, Math.max(W - vidW, W / 2 - c.centerX * scale));
  const introF = Math.round(p.introSec * fps);

  // Spotlight on the glasses during the intro.
  const gx = left + c.glasses.x * scale;
  const gy = c.glasses.y * scale;
  const rx = (c.glasses.w * scale) / 2 + 34;
  const ry = (c.glasses.h * scale) / 2 + 30;
  const spotIn = spring({ frame: frame - 3, fps, config: { damping: 200 } });
  const spotOut = interpolate(frame, [introF - 10, introF], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spot = spotIn * spotOut;
  const pulse = 1 + 0.06 * Math.max(0, ...p.dingsSec.map((d) => Math.exp(-(frame - d * fps) / 5) * (frame >= d * fps ? 1 : 0)));

  const capIn = spring({ frame: frame - captionKey, fps, config: { damping: 200 }, durationInFrames: 12 });
  const accent = kind === "wrong" ? RED : GREEN;

  return (
    <div style={{ position: "absolute", top, left: 0, width: W, height: PANEL_H, overflow: "hidden", background: "#000" }}>
      {frame < introF ? (
        <Img src={staticFile(c.still)} style={{ position: "absolute", left, top: 0, width: vidW, height: PANEL_H }} />
      ) : null}
      <Sequence from={introF} layout="none">
        <OffthreadVideo
          src={staticFile(c.src)}
          playbackRate={p.rate}
          muted
          style={{ position: "absolute", left, top: 0, width: vidW, height: PANEL_H }}
        />
      </Sequence>

      {spot > 0.001 ? (
        <svg width={W} height={PANEL_H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <mask id={`m-${kind}`}>
              <rect width={W} height={PANEL_H} fill="white" />
              <ellipse cx={gx} cy={gy} rx={rx * pulse} ry={ry * pulse} fill="black" />
            </mask>
          </defs>
          <rect width={W} height={PANEL_H} fill="black" opacity={0.62 * spot} mask={`url(#m-${kind})`} />
          <ellipse
            cx={gx}
            cy={gy}
            rx={rx * pulse}
            ry={ry * pulse}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={6}
            opacity={spot}
            style={{ filter: "drop-shadow(0 0 14px rgba(255,255,255,0.9))" }}
          />
        </svg>
      ) : null}

      {frame >= introF - 4 ? <Badge kind={kind} delay={introF - 4 + (kind === "right" ? 6 : 0)} /> : null}

      {caption && frame >= introF ? (
        <div
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            bottom: 70,
            display: "flex",
            justifyContent: "center",
            opacity: capIn,
            transform: `translateY(${(1 - capIn) * 24}px)`,
          }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.72)",
              borderLeft: `10px solid ${accent}`,
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
            {caption}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const FrameFit: React.FC<FrameFitProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const introF = Math.round(p.introSec * fps);
  const mainF = introF + Math.round((p.clipSec / p.rate) * fps);
  const sectionStart = (s: { fromClipSec: number }) => introF + Math.round((s.fromClipSec / p.rate) * fps);

  let idx = -1;
  p.sections.forEach((s, i) => {
    if (frame >= sectionStart(s)) idx = i;
  });
  const section = idx >= 0 ? p.sections[idx] : null;
  const key = section ? sectionStart(section) : 0;
  const titleIn = spring({ frame: frame - key, fps, config: { damping: 200 }, durationInFrames: 12 });
  const headline = section ? section.title : p.title;

  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      {p.dingsSec.map((d, i) => (
        <Sequence key={i} from={Math.round(d * fps)} durationInFrames={Math.round(1.2 * fps)} layout="none">
          <Audio src={staticFile(p.ding)} />
        </Sequence>
      ))}

      <Sequence durationInFrames={mainF} layout="none">
        <div
          style={{
            position: "absolute",
            top: 150,
            left: 60,
            right: 60,
            height: HEADER - 150,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 62,
            textAlign: "center",
            opacity: section ? titleIn : spring({ frame, fps, config: { damping: 200 } }),
            transform: `translateY(${(1 - (section ? titleIn : 1)) * 20}px)`,
          }}
        >
          {headline}
        </div>
        {PANELS.map(({ kind, top }) => (
          <Panel key={kind} p={p} kind={kind} top={top} caption={section ? section[kind] : ""} captionKey={key} />
        ))}
      </Sequence>

      <Sequence from={mainF} durationInFrames={Math.round(p.outroSec * fps)}>
        <BrandOutro brand="zvc" />
      </Sequence>
    </AbsoluteFill>
  );
};
