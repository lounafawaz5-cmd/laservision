import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { WhatsAppIcon } from "../components/WhatsAppIcon";
import { BeatAd, BeatAdProps } from "../templates/BeatAd";

// ZVC · Black Friday announcement (Nov 21–30, 20% to 50%).
// Review 20 Nov: "make the announcement more engaging and add frames of glasses."
// v2 keeps Luna's skit (WhatsApp export, 576×1024) up to the moment she starts typing the answer,
// then cuts on the beat to a try-on montage of frames with the offer typed, counted and tagged on screen,
// and ends on a Black Friday end card (offer, dates, wordmark, WhatsApp icon + number). The original song is a 137 BPM, 8-beat (3.5 s) loop, so the audio
// is the skit's own track extended by repeating its last loop (public/audio/bf-skit-extended.wav).
// Footage: public/footage/bf/skit.mp4 (the export) + Drive RIB_0145–0147 (try-on, 1920×1080, center-cropped).
// RIB_0143/0144 are over the Drive connector's 10 MB limit and are not used.

export const BF_FPS = 30;
const BEAT = 60 / 137.14; // 0.4375 s
// Cut on the beat at 10.24 s, just before the export's "Find us at…" text starts typing in.
export const BF_CUT_SEC = 10.24;

const c = (n: string) => `footage/bf/RIB_${n}.mp4`;

export const blackFridayMontage: BeatAdProps = {
  brand: "zvc",
  look: "energetic",
  audio: "",
  audioStartSec: 0,
  beatTimesMs: [],
  bpm: 137.14,
  // Seven frame changes, one every two beats; wood wall (grey frames) alternates with the store wall (dark square frames).
  shots: [
    { src: c("0147"), at: 0.2, beats: 2, rate: 1, move: "punch", flash: true },
    { src: c("0145"), at: 6.2, beats: 2, rate: 1, move: "slideL" },
    { src: c("0147"), at: 5.5, beats: 2, rate: 1, move: "push" },
    { src: c("0146"), at: 0.3, beats: 2, rate: 1, move: "punch", flash: true },
    { src: c("0147"), at: 8.6, beats: 2, rate: 1, move: "slideR" },
    { src: c("0145"), at: 9.0, beats: 2, rate: 1, move: "push" },
    { src: c("0147"), at: 1.6, beats: 2, rate: 1, move: "pull" },
  ],
  texts: [
    { text: "BLACK FRIDAY", beat: 0, beats: 4, style: "type" },
    { text: "20|50|OFF", beat: 4, beats: 4, style: "count" },
    { text: "NOV 21–30", beat: 8, beats: 4, style: "tag" },
    { text: "at ZEISS Vision Center", beat: 12, beats: 2, style: "cta" },
  ],
  hudLogo: "brand/zvc-wordmark-white.png",
  // End card is drawn below (BlackFridayCard), not by BeatAd.
  outroBeats: 0,
  outroLogo: "",
  outroLine: "BLACK FRIDAY · NOV 21–30",
  whatsapp: "81 47 20 20",
};

const MONTAGE_BEATS = blackFridayMontage.shots.reduce((s, x) => s + x.beats, 0);
const CARD_BEATS = 8;
const montageBeats = MONTAGE_BEATS + CARD_BEATS;
export const blackFridayDuration = Math.round((BF_CUT_SEC + montageBeats * BEAT) * BF_FPS);


const LIME = "#D9E906";
const FONT = `"Inter", sans-serif`;

// End card: offer first (what, how much, when), then where and how to reach the store. One line per beat.
const BlackFridayCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = BEAT * fps;
  const at = (beat: number) => spring({ frame: frame - beat * b, fps, config: { damping: 14, stiffness: 260, mass: 0.6 } });
  const [t, o, d, w, n] = [at(0), at(1), at(2), at(3), at(4)];
  return (
    <AbsoluteFill style={{ background: "#000", justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 132, letterSpacing: 2, color: "#fff", lineHeight: 1, opacity: t, transform: `scale(${interpolate(t, [0, 1], [1.4, 1])})` }}>
        BLACK FRIDAY
      </div>
      <div style={{ marginTop: 48, display: "flex", alignItems: "center", gap: 24, opacity: o, transform: `translateY(${(1 - o) * 40}px)` }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 116, color: "#fff", lineHeight: 1 }}>20%–50%</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 6, background: LIME, color: "#000", padding: "6px 22px" }}>OFF</div>
      </div>
      <div style={{ marginTop: 40, fontFamily: FONT, fontWeight: 700, fontSize: 64, letterSpacing: 14, color: "#fff", opacity: d, clipPath: `inset(0 ${(1 - d) * 100}% 0 0)` }}>
        NOV 21–30
      </div>
      <div style={{ width: interpolate(w, [0, 1], [0, 480]), height: 5, background: LIME, marginTop: 90, marginBottom: 70 }} />
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
        <OffthreadVideo src={staticFile("footage/bf/skit.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
