import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import { WhatsAppIcon } from "../components/WhatsAppIcon";

// ZVC · Black Friday STORY (separate concept from the reel; review 25 Nov: "completely different announcement").
// Design only (review 25 Nov: no product photos): a white price tag drops in on a string and swings
// to rest on a plain black ZEISS background. Calm: no flashes, no beat pumping, no counters.
// Offer: 20% to 50% off sunglasses only, till Nov 30. ZEISS Indigo accent, black/white type.
// Bottom ~300 px kept clear of text for the Instagram reply bar; the space between the tag and the
// sign-off fits Instagram's countdown sticker if wanted.

for (const [weight, file] of [["300", "Light"], ["500", "Medium"], ["700", "Bold"]]) {
  loadFont({ family: "Outfit", url: staticFile(`fonts/Outfit-${file}.ttf`), weight });
}

export const STORY_FPS = 30;
export const STORY_SECONDS = 8;

const INDIGO = "#0F2DB3";
const SANS = `"Outfit", "Inter", sans-serif`;
const BOLD = `"Inter", sans-serif`;

// Tag is drawn at this scale around its pivot (top of the string).
const TAG_SCALE = 1.25;

const TAG_W = 600;
const TAG_H = 640;
const STRING = 300;

// The tag: drops on its string (pivot at the top edge of the frame) and swings to rest, damped.
const PriceTag: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const drop = spring({ frame: frame - 6, fps, config: { damping: 18, stiffness: 90, mass: 1 } });
  const y = interpolate(drop, [0, 1], [-(TAG_H + STRING + 60) * TAG_SCALE, 0]);
  const swingT = Math.max(0, t - 0.35);
  const angle = 8 * Math.exp(-swingT / 1.1) * Math.sin(swingT * 2 * Math.PI * 0.75);
  const line = (delay: number) => {
    const a = interpolate(t, [1.0 + delay, 1.5 + delay], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    return { opacity: a, transform: `translateY(${(1 - a) * 14}px)` };
  };
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 0, left: 540 - TAG_W / 2, width: TAG_W, transformOrigin: "50% 0", transform: `translateY(${y}px) rotate(${angle}deg) scale(${TAG_SCALE})` }}>
        {/* String, from above the frame to the tag's eyelet. */}
        <div style={{ position: "absolute", left: TAG_W / 2 - 1.5, top: -400, width: 3, height: 400 + STRING + 46, background: "#d9d9d6" }} />
        <svg width={TAG_W} height={TAG_H} viewBox={`0 0 ${TAG_W} ${TAG_H}`} style={{ position: "absolute", top: STRING, left: 0, filter: "drop-shadow(0 18px 40px rgba(255,255,255,0.08))" }}>
          {/* Classic tag outline: clipped top corners, eyelet near the top. */}
          <path d={`M ${TAG_W / 2 - 150} 0 L ${TAG_W / 2 + 150} 0 L ${TAG_W} 120 L ${TAG_W} ${TAG_H - 28} Q ${TAG_W} ${TAG_H} ${TAG_W - 28} ${TAG_H} L 28 ${TAG_H} Q 0 ${TAG_H} 0 ${TAG_H - 28} L 0 120 Z`} fill="#ffffff" />
          <circle cx={TAG_W / 2} cy={46} r={16} fill="#e6e6e3" stroke="#1a1a1a" strokeWidth={3} />
        </svg>
        <div style={{ position: "absolute", top: STRING + 118, left: 0, width: TAG_W, display: "flex", flexDirection: "column", alignItems: "center", color: "#000" }}>
          <div style={{ ...line(0), fontFamily: SANS, fontWeight: 500, fontSize: 38, letterSpacing: 10, marginRight: -10 }}>BLACK FRIDAY</div>
          <div style={{ ...line(0.15), fontFamily: BOLD, fontWeight: 800, fontSize: 132, lineHeight: 1, marginTop: 22, letterSpacing: -2 }}>20–50%</div>
          <div style={{ ...line(0.3), display: "flex", alignItems: "center", gap: 18, marginTop: 20 }}>
            <div style={{ fontFamily: BOLD, fontWeight: 800, fontSize: 52, letterSpacing: 4, background: INDIGO, color: "#fff", padding: "4px 22px" }}>OFF</div>
            <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 48, letterSpacing: 4 }}>SUNGLASSES</div>
          </div>
          <div style={{ ...line(0.45), width: 380, height: 2, background: "#000", marginTop: 40, marginBottom: 30 }} />
          <div style={{ ...line(0.45), fontFamily: SANS, fontWeight: 700, fontSize: 50, letterSpacing: 8, marginRight: -8 }}>TILL NOV 30</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Store sign-off at the bottom: wordmark, then the WhatsApp icon + number (never the word "WhatsApp").
const SignOff: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = interpolate(frame / fps, [1.9, 2.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 300, opacity: a }}>
      <Img src={staticFile("brand/zvc-wordmark-white.png")} style={{ width: 520 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 34 }}>
        <WhatsAppIcon size={56} />
        <div style={{ fontFamily: BOLD, fontWeight: 700, fontSize: 52, letterSpacing: 3, color: "#fff" }}>81 47 20 20</div>
      </div>
    </AbsoluteFill>
  );
};

export const BlackFridayStory: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <PriceTag />
    <SignOff />
  </AbsoluteFill>
);
