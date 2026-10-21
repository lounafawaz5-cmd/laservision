import { Composition } from "remotion";
import { TalkingHead, talkingHeadSchema, TalkingHeadProps } from "./templates/TalkingHead";

const FPS = 30;

const sampleEn: TalkingHeadProps = {
  brand: "laservision",
  video: "",
  hook: "3 myths about LASIK you still believe",
  hookSeconds: 3,
  outroSeconds: 2.5,
  captions: [
    { text: "Myth one: it hurts.", startMs: 3000, endMs: 5000 },
    { text: "The procedure takes minutes and you're awake the whole time.", startMs: 5000, endMs: 8000 },
  ],
};

const sampleAr: TalkingHeadProps = {
  brand: "zeiss",
  video: "",
  hook: "كيف تختار النظارة المناسبة لوجهك؟",
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
      defaultProps={sampleEn}
      calculateMetadata={calc}
      fps={FPS}
      width={1080}
      height={1920}
      durationInFrames={300}
    />
    <Composition
      id="TalkingHead-Zeiss"
      component={TalkingHead}
      schema={talkingHeadSchema}
      defaultProps={sampleAr}
      calculateMetadata={calc}
      fps={FPS}
      width={1080}
      height={1920}
      durationInFrames={300}
    />
  </>
);
