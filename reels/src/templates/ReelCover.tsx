import { z } from "zod";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { REEL_FONT, brands, textGlow } from "../brands";
import { Sticker } from "../components/Stickers";

// Reel cover (1080×1920). Text stays inside the centre 1080×1440 so the 3:4 profile-grid crop keeps it.
// Same text look as the reel: Montserrat Arabic Bold, white, account glow (brand/Video_Editing_Guide.pdf).
export const reelCoverSchema = z.object({
  brand: z.enum(["laservision", "zvc"]),
  frame: z.string(),
  title: z.string(),
  subtitle: z.string(),
  stickers: z.array(z.object({ kind: z.enum(["oct", "angiography"]), x: z.number(), y: z.number(), size: z.number(), tilt: z.number() })),
});
export type ReelCoverProps = z.infer<typeof reelCoverSchema>;

export const ReelCover: React.FC<ReelCoverProps> = ({ brand: id, frame, title, subtitle, stickers }) => {
  const brand = brands[id];
  return (
    <AbsoluteFill>
      <Img src={staticFile(frame)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {/* Soft navy fade behind the text so it reads on the scrubs and backdrop */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,48,63,0) 50%, rgba(0,48,63,0.55) 72%, rgba(0,48,63,0.2) 90%)" }} />
      {stickers.map((s, i) => (
        // Sticker animates on its own clock; at frame 0 of a still, render it settled.
        <div key={i} style={{ position: "absolute", inset: 0 }}>
          <Sticker {...s} still />
        </div>
      ))}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 1150 }}>
        <div style={{ fontFamily: `"${REEL_FONT}", sans-serif`, fontWeight: 700, color: "#fff", textShadow: textGlow(brand), textAlign: "center" }}>
          <div style={{ fontSize: 100, lineHeight: 1.08, letterSpacing: 1 }}>{title.split("\n").map((l) => <div key={l}>{l}</div>)}</div>
          <div style={{ fontSize: 46, marginTop: 26 }}>{subtitle}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
