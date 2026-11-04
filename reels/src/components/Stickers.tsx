import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand } from "../brands";
import { WhatsAppIcon } from "./WhatsAppIcon";

// Overlays placed on top of a talking-head reel. Each one starts at frame 0 of its own Sequence.
// x/y = centre of the sticker in the 1080×1920 frame.

const useOut = (fadeFrames = 6) => {
  const frame = useCurrentFrame();
  return { frame, outFade: (len: number) => interpolate(frame, [len - fadeFrames, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) };
};

// Comic "noise" marks: three jagged strokes radiating from the side of the head, drawn on, then jittering.
export const ZigzagSticker: React.FC<{ x: number; y: number; len: number; brand: Brand; flip?: boolean }> = ({ x, y, len, brand, flip }) => {
  const { frame, outFade } = useOut();
  const { fps } = useVideoConfig();
  const strokes = [
    { d: "M0 0 L28 -22 L44 8 L72 -18 L90 12 L118 -14", rot: -32 },
    { d: "M0 0 L26 -20 L44 10 L70 -20 L88 10 L116 -18 L132 6", rot: 0 },
    { d: "M0 0 L28 -22 L44 8 L72 -18 L90 12 L118 -14", rot: 32 },
  ];
  // Hard 4-frame jitter reads as buzzing, not as smooth motion.
  const tick = Math.floor(frame / 3);
  return (
    <AbsoluteFill style={{ opacity: outFade(len) }}>
      <svg
        width={360}
        height={360}
        viewBox="-40 -180 360 360"
        style={{ position: "absolute", left: x - 180, top: y - 180, transform: `${flip ? "scaleX(-1) " : ""}scale(1.6)`, overflow: "visible" }}
      >
        {strokes.map((s, i) => {
          const draw = spring({ frame: frame - i * 3, fps, config: { damping: 14, stiffness: 180 } });
          const jx = ((tick + i) % 2 === 0 ? 1 : -1) * 4;
          const jy = ((tick + i * 2) % 3) - 1;
          return (
            <g key={i} transform={`rotate(${s.rot}) translate(${18 + jx} ${jy * 4}) scale(${0.6 + 0.4 * draw})`} opacity={Math.min(1, draw * 1.5)}>
              {/* White sticker border, then the brand stroke on top. */}
              <path d={s.d} fill="none" stroke="#FFFFFF" strokeWidth={30} strokeLinejoin="round" strokeLinecap="round" />
              <path
                d={s.d}
                fill="none"
                stroke={brand.colors.primary}
                strokeWidth={14}
                strokeLinejoin="round"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - Math.min(1, draw)}
              />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// Brand logo on a white card that springs in with an overshoot, plus a quick burst ring.
export const LogoPop: React.FC<{ x: number; y: number; len: number; brand: Brand; width?: number }> = ({ x, y, len, brand, width = 560 }) => {
  const { frame, outFade } = useOut(8);
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 9, stiffness: 160, mass: 0.7 } });
  const ring = interpolate(frame, [2, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bob = Math.sin(frame / 9) * 4;
  const cardW = width + 80;
  const cardH = (width * 670) / 3230 + 56;
  return (
    <AbsoluteFill style={{ opacity: outFade(len) }}>
      <div
        style={{
          position: "absolute",
          left: x - cardW / 2,
          top: y - cardH / 2,
          width: cardW,
          height: cardH,
          borderRadius: cardH / 2,
          border: `6px solid ${brand.colors.accent}`,
          transform: `scale(${1 + ring * 0.45})`,
          opacity: (1 - ring) * 0.8,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - cardW / 2,
          top: y - cardH / 2 + bob,
          width: cardW,
          height: cardH,
          borderRadius: cardH / 2,
          background: "#FFFFFF",
          boxShadow: "0 18px 50px rgba(0,48,63,0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${pop})`,
        }}
      >
        <Img src={staticFile(brand.logo)} style={{ width }} />
      </div>
    </AbsoluteFill>
  );
};

// TV-style volume read-out climbing to max, to sell "loud".
export const VolumeBar: React.FC<{ x: number; y: number; len: number }> = ({ x, y, len }) => {
  const { frame, outFade } = useOut();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const segments = 16;
  const level = interpolate(frame, [4, Math.min(len - 10, 30)], [5, segments], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake = level >= segments ? Math.sin(frame * 2.3) * 3 : 0;
  return (
    <AbsoluteFill style={{ opacity: outFade(len) * enter }}>
      <div
        style={{
          position: "absolute",
          left: x - 330 + shake,
          top: y - 55,
          width: 660,
          height: 110,
          borderRadius: 55,
          background: "rgba(0,48,63,0.82)",
          display: "flex",
          alignItems: "center",
          gap: 26,
          padding: "0 40px",
          boxSizing: "border-box",
        }}
      >
        <svg width={64} height={64} viewBox="0 0 24 24">
          <path fill="#FFFFFF" d="M3 9v6h4l5 5V4L7 9H3z" />
          <path fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 56 }}>
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 20,
                height: 20 + i * 2.3,
                borderRadius: 4,
                background: i < Math.floor(level) ? (i >= segments - 4 ? "#B6DFE5" : "#30A4BF") : "rgba(255,255,255,0.22)",
              }}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Call to action: WhatsApp icon + number on a brand pill (never the word "WhatsApp").
export const WhatsAppCta: React.FC<{ x: number; y: number; len: number; brand: Brand }> = ({ x, y, len, brand }) => {
  const { frame, outFade } = useOut();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 170 } });
  const pulse = 1 + Math.max(0, Math.sin((frame - 12) / 7)) * 0.03;
  return (
    <AbsoluteFill style={{ opacity: outFade(len) }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(-50%, -50%) scale(${pop * pulse})`,
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "26px 48px",
          borderRadius: 999,
          background: brand.colors.primary,
          boxShadow: "0 16px 44px rgba(0,48,63,0.35)",
          color: "#FFFFFF",
          fontFamily: `"${brand.fonts.latin}", sans-serif`,
          fontWeight: 700,
          fontSize: 56,
          letterSpacing: 1,
          whiteSpace: "nowrap",
        }}
      >
        <WhatsAppIcon size={64} />
        <span dir="ltr">{brand.whatsapp}</span>
      </div>
    </AbsoluteFill>
  );
};
