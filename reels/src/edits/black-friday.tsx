import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { WhatsAppIcon } from "../components/WhatsAppIcon";
import { BeatAd, BeatAdProps } from "../templates/BeatAd";

// ZVC · Black Friday announcement (till Dec 30, extended from Nov 30; on-screen shows the end date only, 20% to 50% off sunglasses only).
// Review 20 Nov: "make the announcement more engaging and add frames of glasses."
// v2 keeps Luna's skit (WhatsApp export, 576×1024) up to the moment she starts typing the answer,
// then cuts on the beat to sunglasses drawers opening and closing, with the offer typed, counted and tagged on screen,
// and ends on a Black Friday end card (offer, dates, wordmark, WhatsApp icon + number). The original song is a 137 BPM, 8-beat (3.5 s) loop, so the audio
// is the skit's own track extended by repeating its last loop (public/audio/bf-skit-extended.wav).
// Footage: public/footage/bf/skit_hd.mp4 (the WhatsApp export, denoised + lanczos-upscaled to 1080×1920) + drawer_1583/1586/1587.mp4.

// ZEISS Indigo (brand/zeiss/GUIDELINES.md), with white text on it.
const INDIGO = "#0F2DB3";

export const BF_FPS = 30;
const BEAT = 60 / 137.14; // 0.4375 s
// Cut on the beat at 10.24 s, just before the export's "Find us at…" text starts typing in.
export const BF_CUT_SEC = 10.24;

const d = (n: string) => `footage/bf/drawer_${n}.mp4`;

export const blackFridayMontage: BeatAdProps = {
  brand: "zvc",
  look: "energetic",
  audio: "",
  audioStartSec: 0,
  beatTimesMs: [],
  bpm: 137.14,
  // Drawers concept (review 20 Nov): each drawer of sunglasses slides open on the beat, holds, and closes,
  // then the next one opens. Footage: Luna's IMG_1583/1586/1587 (4K HEVC, transcoded to 1080×1920 drawer_*.mp4).
  // Opens run at 1.25×, closes at 1.5× so each drawer is shut on the cut; the last one shuts into the end card.
  shots: [
    // Drawer 1 opens (hand in at ~2.2 s, fully open by ~3.3 s).
    { src: d("1583"), at: 2.2, beats: 4, rate: 1.25, move: "hold" },
    // Drawer 2 opens and holds…
    { src: d("1586"), at: 0.4, beats: 4, rate: 1.25, move: "hold" },
    // …and closes.
    { src: d("1586"), at: 3.3, beats: 2, rate: 1.5, move: "hold" },
    // Drawer 3 opens and holds…
    { src: d("1587"), at: 1.1, beats: 4, rate: 1.25, move: "hold" },
    // …and shuts into the end card.
    { src: d("1587"), at: 4.1, beats: 2, rate: 1.1, move: "hold" },
  ],
  texts: [
    { text: "BLACK FRIDAY", beat: 0, beats: 4, style: "type" },
    { text: "20|50|OFF SUNGLASSES", beat: 4, beats: 4, style: "count" },
    { text: "TILL DEC 30", beat: 10, beats: 4, style: "tag" },
    { text: "at ZEISS Vision Center", beat: 14, beats: 2, style: "cta" },
  ],
  // Review 20 Nov: no flashing, no beat pumping, no corner lines / logo / shot counter; ZEISS Indigo accent.
  hudLogo: "",
  hud: false,
  beatPulse: false,
  accent: INDIGO,
  accentText: "#FFFFFF",
  // End card is drawn below (BlackFridayCard), not by BeatAd.
  outroBeats: 0,
  outroLogo: "",
  outroLine: "BLACK FRIDAY · TILL DEC 30",
  whatsapp: "81 47 20 20",
};

const MONTAGE_BEATS = blackFridayMontage.shots.reduce((s, x) => s + x.beats, 0);
const CARD_BEATS = 8;
const montageBeats = MONTAGE_BEATS + CARD_BEATS;
export const blackFridayDuration = Math.round((BF_CUT_SEC + montageBeats * BEAT) * BF_FPS);


const FONT = `"Inter", sans-serif`;

// End card: offer first (what, how much, when), then where and how to reach the store. One line per beat.
const BlackFridayCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = BEAT * fps;
  const at = (beat: number) => spring({ frame: frame - beat * b, fps, config: { damping: 200 } });
  const [t, o, d, w, n] = [at(0), at(1), at(2), at(3), at(4)];
  return (
    <AbsoluteFill style={{ background: "#000", justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 132, letterSpacing: 2, color: "#fff", lineHeight: 1, opacity: t }}>
        BLACK FRIDAY
      </div>
      <div style={{ marginTop: 48, display: "flex", alignItems: "center", gap: 24, opacity: o, transform: `translateY(${(1 - o) * 40}px)` }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 116, color: "#fff", lineHeight: 1 }}>20%–50%</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 6, background: INDIGO, color: "#fff", padding: "6px 22px" }}>OFF</div>
      </div>
      <div style={{ marginTop: 24, fontFamily: FONT, fontWeight: 700, fontSize: 52, letterSpacing: 10, color: "#fff", opacity: o }}>ON SUNGLASSES</div>
      <div style={{ marginTop: 40, fontFamily: FONT, fontWeight: 700, fontSize: 64, letterSpacing: 14, color: "#fff", opacity: d, clipPath: `inset(0 ${(1 - d) * 100}% 0 0)` }}>
        TILL DEC 30
      </div>
      <div style={{ width: interpolate(w, [0, 1], [0, 480]), height: 3, background: "#fff", marginTop: 90, marginBottom: 70 }} />
      <Img src={staticFile("brand/zvc-wordmark-white.png")} style={{ width: 620, opacity: w, transform: `translateY(${(1 - w) * 30}px)` }} />
      <div style={{ marginTop: 56, display: "flex", alignItems: "center", gap: 22, opacity: n }}>
        <WhatsAppIcon size={68} />
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 60, letterSpacing: 3, color: "#fff" }}>81 47 20 20</div>
      </div>
    </AbsoluteFill>
  );
};

export const BlackFridayZvc: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const cut = Math.round(BF_CUT_SEC * fps);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={cut}>
        <OffthreadVideo src={staticFile("footage/bf/skit_hd.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Sequence>
      <Sequence from={cut} durationInFrames={Math.round(MONTAGE_BEATS * BEAT * fps)}>
        <BeatAd {...blackFridayMontage} />
      </Sequence>
      <Sequence from={cut + Math.round(MONTAGE_BEATS * BEAT * fps)}>
        <BlackFridayCard />
      </Sequence>
      <Audio
        src={staticFile("audio/bf-skit-extended.wav")}
        volume={(f) => interpolate(f, [durationInFrames - Math.round(BEAT * 2 * fps), durationInFrames - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    </AbsoluteFill>
  );
};
