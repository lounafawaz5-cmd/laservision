import { AbsoluteFill, Img, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand } from "../brands";
import { WhatsAppIcon } from "./WhatsAppIcon";

export const Outro: React.FC<{ brand: Brand }> = ({ brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });

  if (brand.outroVideo) {
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <OffthreadVideo src={staticFile(brand.outroVideo)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        background: brand.colors.background,
        justifyContent: "center",
        alignItems: "center",
        gap: 50,
      }}
    >
      <div style={{ opacity: enter, transform: `translateY(${(1 - enter) * 30}px)` }}>
        {brand.logo ? (
          <Img src={staticFile(brand.logo)} style={{ width: 760 }} />
        ) : (
          <div style={{ fontFamily: brand.fonts.latin, fontWeight: 800, fontSize: 110, color: brand.colors.text }}>
            {brand.name}
          </div>
        )}
      </div>
      <div
        style={{
          opacity: enter,
          display: "flex",
          alignItems: "center",
          gap: 20,
          fontFamily: `"${brand.fonts.latin}", sans-serif`,
          fontSize: 52,
          fontWeight: 700,
          color: brand.colors.background === "#FFFFFF" ? brand.colors.primary : brand.colors.text,
        }}
      >
        <WhatsAppIcon size={56} color={brand.colors.background === "#FFFFFF" ? brand.colors.primary : brand.colors.text} />
        {brand.whatsapp}
      </div>
    </AbsoluteFill>
  );
};
