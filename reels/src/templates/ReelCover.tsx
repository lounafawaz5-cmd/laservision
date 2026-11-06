import { z } from "zod";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { brands, REEL_FONT, textGlow } from "../brands";
import { FieldEye } from "../components/Overlays";

// Reel cover (rendered as a still). LaserVision formula:
// - A clean frame of the speaker looking at camera, full 1080×1920.
// - Everything that matters sits inside the 4:5 grid crop (y 285–1635) so it survives the profile grid.
// - Navy scrim at the bottom; headline in Montserrat Arabic Bold, white, #005D83 glow (brand/Video_Editing_Guide.pdf):
//   the English term large in CAPS, its Arabic name underneath. Optional illustrated motif from the reel above it.
// - White LaserVision logo, small, at the bottom of the safe area. No WhatsApp on the cover (the caption carries it).
export const reelCoverSchema = z.object({
  brand: z.enum(["laservision", "zvc"]),
  image: z.string(),
  title: z.string(),
  subtitle: z.string(),
  motif: z.enum(["none", "fieldEye"]),
  logo: z.string(),
});

export type ReelCoverProps = z.infer<typeof reelCoverSchema>;

export const ReelCover: React.FC<ReelCoverProps> = ({ brand: brandId, image, title, subtitle, motif, logo }) => {
  const brand = brands[brandId];
  const text: React.CSSProperties = { fontFamily: `"${REEL_FONT}", sans-serif`, fontWeight: 700, color: "#FFFFFF", textShadow: textGlow(brand), textAlign: "center" };
  return (
    <AbsoluteFill>
      <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {/* Scrim: clear over the face, deep navy under the headline */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,48,63,0) 45%, rgba(0,48,63,0.78) 64%, rgba(0,48,63,0.94) 100%)" }} />
      {motif === "fieldEye" ? <FieldEye y={1140} spreadAtMs={0} eyeWidth={230} /> : null}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 1250 }}>
        <div style={{ ...text, fontSize: 86, lineHeight: 1.05, letterSpacing: 1, whiteSpace: "nowrap" }}>{title}</div>
        <div dir="rtl" style={{ ...text, fontSize: 66, marginTop: 26 }}>
          {subtitle}
        </div>
        <Img src={staticFile(logo)} style={{ width: 300, marginTop: 64 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
