import { Composition } from "remotion";
import { TalkingHead, talkingHeadSchema, TalkingHeadProps } from "./templates/TalkingHead";

const FPS = 30;

const sampleLv: TalkingHeadProps = {
  brand: "laservision",
  video: "",
  hook: "Your doctor said cataract. Here's what happens next.",
  hookSeconds: 3,
  outroSeconds: 2.5,
  captions: [
    { text: "حكيمك قلك إنو عندك ماء بيضاء؟", startMs: 3000, endMs: 5000 },
    { text: "First, you'll meet our team at reception.", startMs: 5000, endMs: 8000 },
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
  const lastCaption = Math.max(props.hookSeconds * 1000, ...props.captions.map((c) => c.endMs));
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
  </>
);
