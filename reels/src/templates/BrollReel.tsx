import { z } from "zod";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { brands } from "../brands";
import { Captions } from "../components/Captions";
import { PopOverlays } from "../components/PopOverlay";

// Talking head + a few full-screen B-roll cut-ins + pop-up overlays under the subtitles.
// LaserVision house style (references/laservision/REEL_STYLE.md) and brand/Video_Editing_Guide.pdf:
// no hook card, no end card, no zooms; "Mix" (soft crossfade) transitions, whoosh on transitions, pop on pop-ups.
export const brollReelSchema = z.object({
  brand: z.enum(["laservision", "zvc"]),
  // Uncut source (1080×1920 @30) and the kept ranges of it, in source seconds.
  video: z.string(),
  segs: z.array(z.tuple([z.number(), z.number()])),
  // The cut audio (the same ranges, joined with short fades).
  audio: z.string(),
  durationMs: z.number(),
  broll: z.array(
    z.object({
      src: z.string(),
      fromMs: z.number(),
      toMs: z.number(),
      // Where in the clip to start, seconds.
      startSec: z.number(),
      // Horizontal crop position for 16:9 clips in a 9:16 frame, 0–100.
      x: z.number(),
    }),
  ),
  overlays: z.array(z.any()),
  captions: z.array(z.object({ text: z.string(), startMs: z.number(), endMs: z.number() })),
});

export type BrollReelProps = z.infer<typeof brollReelSchema>;

const MIX = 8; // frames for a Mix crossfade
const WHOOSH = 0.18;

// One kept range of the speaker. Each range after the first starts MIX/2 frames early and fades in over the
// previous one, so the pause cuts read as a Mix instead of a jump.
const SpeakerSeg: React.FC<{ video: string; startSec: number; fadeIn: boolean }> = ({ video, startSec, fadeIn }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = fadeIn ? interpolate(frame, [0, MIX], [0, 1], { extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill style={{ opacity }}>
      <OffthreadVideo src={staticFile(video)} muted startFrom={Math.round(startSec * fps)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

// fadeOut=false when the next B-roll starts right where this one ends: the next shot mixes in on top.
const BrollShot: React.FC<{ src: string; startSec: number; x: number; len: number; fadeOut: boolean }> = ({ src, startSec, x, len, fadeOut }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = Math.min(
    interpolate(frame, [0, MIX], [0, 1], { extrapolateRight: "clamp" }),
    fadeOut ? interpolate(frame, [len - MIX, len], [1, 0], { extrapolateLeft: "clamp" }) : 1,
  );
  return (
    <AbsoluteFill style={{ opacity }}>
      <OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(startSec * fps)}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${x}% 50%` }} />
    </AbsoluteFill>
  );
};

export const BrollReel: React.FC<BrollReelProps> = ({ brand: brandId, video, segs, audio, broll, overlays, captions }) => {
  const brand = brands[brandId];
  const { fps, durationInFrames } = useVideoConfig();
  const f = (ms: number) => Math.round((ms / 1000) * fps);
  const half = MIX / 2;
  let acc = 0;
  const parts = segs.map(([s, e], i) => {
    const from = f(acc * 1000);
    acc += e - s;
    return { from, to: f(acc * 1000), s, i };
  });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {parts.map(({ from, to, s, i }) => {
        const lead = i === 0 ? 0 : half;
        const tail = i === parts.length - 1 ? 0 : half;
        return (
          <Sequence key={i} from={from - lead} durationInFrames={Math.min(to + tail, durationInFrames) - (from - lead)}>
            <SpeakerSeg video={video} startSec={s - lead / fps} fadeIn={i > 0} />
          </Sequence>
        );
      })}
      <Audio src={staticFile(audio)} />
      {broll.map((b) => {
        const joined = broll.some((n) => n.fromMs === b.toMs);
        const from = f(b.fromMs) - half;
        const len = f(b.toMs) - f(b.fromMs) + MIX;
        return (
          <Sequence key={b.fromMs} from={from} durationInFrames={len}>
            <BrollShot src={b.src} startSec={b.startSec} x={b.x} len={len} fadeOut={!joined} />
            <Audio src={staticFile("sfx/whoosh.mp3")} volume={WHOOSH} />
          </Sequence>
        );
      })}
      <Captions captions={captions} brand={brand} />
      <PopOverlays overlays={overlays} />
    </AbsoluteFill>
  );
};
