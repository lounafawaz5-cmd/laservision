import { Composition } from "remotion";
import { TalkingHead, talkingHeadSchema, TalkingHeadProps } from "./templates/TalkingHead";
import { BeatAd, beatAdSchema, BeatAdProps, beatAdDuration } from "./templates/BeatAd";
import { monogram } from "./edits/monogram";
import { monogramCalm } from "./edits/monogram-calm";

const FPS = 30;

// LaserVision house style: no hook card, no end card, word-by-word Arabic subtitles.
const sampleLv: TalkingHeadProps = {
  brand: "laservision",
  video: "",
  hook: "",
  hookSeconds: 0,
  outroSeconds: 0,
  captions: [
    { text: "إذا عيونك", startMs: 0, endMs: 700 },
    { text: "عم تنشف", startMs: 700, endMs: 1400 },
    { text: "بسرعة", startMs: 1400, endMs: 2000 },
    { text: "منعمل TEST", startMs: 2000, endMs: 2800 },
    { text: "بالـ MEIBOMIAN GLANDS", startMs: 2800, endMs: 3800 },
    { text: "وجلسات الـ IPL", startMs: 3800, endMs: 4800 },
  ],
};

const sampleZvc: TalkingHeadProps = {
  brand: "zvc",
  video: "",
  hook: "I have a round face and I've been lied to for years",
  hookSeconds: 3,
  outroSeconds: 2.5,
  captions: [
    { text: "الوجه الدائري يحتاج إطاراً مربعاً", startMs: 3000, endMs: 5500 },
    { text: "والوجه المربع يناسبه الإطار الدائري", startMs: 5500, endMs: 8000 },
  ],
};

// Duration follows the props, so each reel's length comes from its footage plan.
const calc = ({ props }: { props: TalkingHeadProps }) => {
  const lastCaption = Math.max(props.hook ? props.hookSeconds * 1000 : 0, ...props.captions.map((c) => c.endMs));
  return { durationInFrames: Math.ceil((lastCaption / 1000 + props.outroSeconds) * FPS) };
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="TalkingHead-LaserVision"
      component={TalkingHead}
      schema={talkingHeadSchema}
      defaultProps={sampleLv}
      calculateMetadata={calc}
      fps={FPS}
      width={1080}
      height={1920}
      durationInFrames={300}
    />
    <Composition
      id="TalkingHead-ZVC"
      component={TalkingHead}
      schema={talkingHeadSchema}
      defaultProps={sampleZvc}
      calculateMetadata={calc}
      fps={FPS}
      width={1080}
      height={1920}
      durationInFrames={300}
    />
    <Composition
      id="Monogram-ZVC"
      component={BeatAd}
      schema={beatAdSchema}
      defaultProps={monogram}
      calculateMetadata={({ props }: { props: BeatAdProps }) => ({ durationInFrames: beatAdDuration(props, FPS) })}
      fps={FPS}
      width={1080}
      height={1920}
      durationInFrames={600}
    />
    <Composition
      id="MonogramCalm-ZVC"
      component={BeatAd}
      schema={beatAdSchema}
      defaultProps={monogramCalm}
      calculateMetadata={({ props }: { props: BeatAdProps }) => ({ durationInFrames: beatAdDuration(props, FPS) })}
      fps={FPS}
      width={1080}
      height={1920}
      durationInFrames={900}
    />
  </>
);
