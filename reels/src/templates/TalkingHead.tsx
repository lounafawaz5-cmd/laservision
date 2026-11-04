import { z } from "zod";
import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { brands, Brand } from "../brands";
import { Captions } from "../components/Captions";
import { Hook } from "../components/Hook";
import { Outro } from "../components/Outro";
import { LogoPop, VolumeBar, WhatsAppCta, ZigzagSticker } from "../components/Stickers";
import { BrandOutro } from "./BrandOutro";

// All times below are seconds on the output timeline (after trimStartSec is cut off the main clip).
const broll = z.object({
  src: z.string(),
  from: z.number(),
  to: z.number(),
  // Seconds into the b-roll clip.
  at: z.number(),
  // Horizontal crop focus for landscape clips filled into the vertical frame, 0–100.
  focusX: z.number(),
});

const overlay = z.object({
  type: z.enum(["zigzag", "logo", "volume", "whatsapp"]),
  from: z.number(),
  to: z.number(),
  // Centre of the overlay in the 1080×1920 frame.
  x: z.number(),
  y: z.number(),
});

export const talkingHeadSchema = z.object({
  brand: z.enum(["laservision", "zvc"]),
  // Path inside public/, e.g. "footage/2026-11-03 lasik-myths/main.mp4". Empty = placeholder.
  video: z.string(),
  // Cut this much off the start of the main clip (false starts, slate).
  trimStartSec: z.number().optional(),
  // Length of the main part. 0/absent = until the last caption.
  mainSec: z.number().optional(),
  // Empty hook = no hook card (LaserVision house style opens straight on the speaker).
  hook: z.string(),
  hookSeconds: z.number(),
  // 0 = no end card.
  outroSeconds: z.number(),
  // "brand": the standard brand end card (BrandOutro). Default "simple".
  outroStyle: z.enum(["simple", "brand"]).optional(),
  captions: z.array(z.object({ text: z.string(), startMs: z.number(), endMs: z.number() })),
  // Caption font size in px (0/absent = brand default) and an optional dark edge for light sets.
  captionSize: z.number().optional(),
  captionOutline: z.boolean().optional(),
  broll: z.array(broll).optional(),
  overlays: z.array(overlay).optional(),
});

export type TalkingHeadProps = z.infer<typeof talkingHeadSchema>;

// B-roll fills the frame with a slow push-in; the main clip's audio keeps playing underneath.
const Broll: React.FC<{ src: string; at: number; focusX: number; len: number }> = ({ src, at, focusX, len }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = interpolate(frame, [0, len], [1.0, 1.08]);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(src)}
        muted
        trimBefore={Math.round(at * fps)}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${focusX}% 50%`, transform: `scale(${scale})` }}
      />
    </AbsoluteFill>
  );
};

const Overlay: React.FC<{ o: z.infer<typeof overlay>; brand: Brand; len: number }> = ({ o, brand, len }) => {
  switch (o.type) {
    case "zigzag":
      return <ZigzagSticker x={o.x} y={o.y} len={len} brand={brand} />;
    case "logo":
      return <LogoPop x={o.x} y={o.y} len={len} brand={brand} />;
    case "volume":
      return <VolumeBar x={o.x} y={o.y} len={len} />;
    case "whatsapp":
      return <WhatsAppCta x={o.x} y={o.y} len={len} brand={brand} />;
  }
};

export const TalkingHead: React.FC<TalkingHeadProps> = ({
  brand: brandId,
  video,
  trimStartSec = 0,
  hook,
  hookSeconds,
  outroSeconds,
  outroStyle = "simple",
  captions,
  captionSize = 0,
  captionOutline = false,
  broll = [],
  overlays = [],
}) => {
  const brand = brands[brandId];
  const { fps, durationInFrames } = useVideoConfig();
  const outroFrames = Math.round(outroSeconds * fps);
  const mainFrames = durationInFrames - outroFrames;
  const f = (s: number) => Math.round(s * fps);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={mainFrames}>
        {video ? (
          <OffthreadVideo
            src={staticFile(video)}
            trimBefore={f(trimStartSec)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <AbsoluteFill style={{ background: `linear-gradient(160deg, #333, ${brand.colors.primary})` }} />
        )}
        {broll.map((b, i) => (
          <Sequence key={`b${i}`} from={f(b.from)} durationInFrames={f(b.to) - f(b.from)}>
            <Broll src={b.src} at={b.at} focusX={b.focusX} len={f(b.to) - f(b.from)} />
          </Sequence>
        ))}
        {overlays.map((o, i) => (
          <Sequence key={`o${i}`} from={f(o.from)} durationInFrames={f(o.to) - f(o.from)}>
            <Overlay o={o} brand={brand} len={f(o.to) - f(o.from)} />
          </Sequence>
        ))}
        <Captions captions={captions} brand={brand} size={captionSize} outline={captionOutline} />
        {hook ? (
          <Sequence durationInFrames={Math.round(hookSeconds * fps)}>
            <Hook text={hook} brand={brand} />
          </Sequence>
        ) : null}
      </Sequence>
      {outroFrames > 0 ? (
        <Sequence from={mainFrames}>{outroStyle === "brand" ? <BrandOutro brand={brandId} /> : <Outro brand={brand} />}</Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
