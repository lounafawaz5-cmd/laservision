import { z } from "zod";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useVideoConfig } from "remotion";
import { brands } from "../brands";
import { Captions } from "../components/Captions";
import { ListReveal } from "../components/ListReveal";
import { LogoGlow } from "../components/LogoGlow";
import { Sticker } from "../components/Stickers";

// Finishing pass on a video already cut in CapCut: drop sections, add subtitles, overlays and SFX.
// Every time in the props is in the ORIGINAL export's timeline (what you see in CapCut), so notes
// like "at 0:36 add X" can be typed in directly; the removed sections are accounted for here.
const sec = z.number();
export const capcutFinishSchema = z.object({
  brand: z.enum(["laservision", "zvc"]),
  video: z.string(),
  // Parts of the export to keep, in order. `zoom` > 1 punches in to hide a jump cut.
  keep: z.array(z.object({ from: sec, to: sec, zoom: z.number().optional() })),
  captions: z.array(z.object({ text: z.string(), startMs: z.number(), endMs: z.number(), words: z.array(z.number()).optional() })),
  lists: z.array(
    z.object({
      items: z.array(z.object({ text: z.string(), atMs: z.number() })),
      endMs: z.number(),
      top: z.number(),
      sfx: z.string(),
      sfxVolume: z.number(),
    }),
  ),
  stickers: z.array(
    z.object({
      kind: z.enum(["oct", "angiography"]),
      startMs: z.number(),
      endMs: z.number(),
      x: z.number(),
      y: z.number(),
      size: z.number(),
      tilt: z.number(),
    }),
  ),
  logoGlow: z
    .object({ startMs: z.number(), dir: z.string(), frames: z.number(), top: z.number(), height: z.number() })
    .nullable(),
});

export type CapcutFinishProps = z.infer<typeof capcutFinishSchema>;
type Keep = CapcutFinishProps["keep"];

export const capcutFinishDuration = (p: CapcutFinishProps, fps: number) =>
  Math.round(p.keep.reduce((s, k) => s + (k.to - k.from), 0) * fps);

// Original-timeline ms → output-timeline ms. Times inside a removed section snap to the next kept part.
const toOut = (keep: Keep, ms: number) => {
  let offset = 0;
  for (const k of keep) {
    if (ms < k.from * 1000) return offset;
    if (ms < k.to * 1000) return offset + ms - k.from * 1000;
    offset += (k.to - k.from) * 1000;
  }
  return offset;
};

export const CapcutFinish: React.FC<CapcutFinishProps> = (p) => {
  const brand = brands[p.brand];
  const { fps } = useVideoConfig();
  const f = (ms: number) => Math.round((toOut(p.keep, ms) / 1000) * fps);

  let at = 0;
  const parts = p.keep.map((k) => {
    const len = Math.round((k.to - k.from) * fps);
    const part = { ...k, at, len };
    at += len;
    return part;
  });

  const captions = p.captions
    .map((c) => ({
      text: c.text,
      startMs: toOut(p.keep, c.startMs),
      endMs: toOut(p.keep, c.endMs),
      words: c.words?.map((w) => toOut(p.keep, w)),
    }))
    .filter((c) => c.endMs > c.startMs);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {parts.map((k, i) => (
        <Sequence key={i} from={k.at} durationInFrames={k.len}>
          <OffthreadVideo
            src={staticFile(p.video)}
            startFrom={Math.round(k.from * fps)}
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${k.zoom ?? 1})`, transformOrigin: "50% 35%" }}
          />
        </Sequence>
      ))}

      {p.logoGlow ? (
        <Sequence from={f(p.logoGlow.startMs)} durationInFrames={p.logoGlow.frames}>
          <LogoGlow {...p.logoGlow} />
        </Sequence>
      ) : null}

      {p.stickers.map((s, i) => (
        <Sequence key={i} from={f(s.startMs)} durationInFrames={f(s.endMs) - f(s.startMs)}>
          <Sticker {...s} />
        </Sequence>
      ))}

      <Captions captions={captions} brand={brand} />

      {p.lists.map((l, i) => {
        const start = l.items[0].atMs;
        return (
          <Sequence key={i} from={f(start)} durationInFrames={f(l.endMs) - f(start)}>
            <ListReveal brand={brand} top={l.top} items={l.items.map((it) => ({ text: it.text, atMs: it.atMs - start }))} />
            {l.items.map((it) => (
              <Sequence key={it.text} from={f(it.atMs) - f(start)}>
                <Audio src={staticFile(l.sfx)} volume={l.sfxVolume} />
              </Sequence>
            ))}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
