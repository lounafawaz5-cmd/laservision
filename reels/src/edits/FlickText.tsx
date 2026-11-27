import { useMemo } from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Glyph, useGlyphs, useOpenTypeFont } from "../components/Text3D";

/*
 * ZVC "flick text" reel (footage: Drive "joyce").
 * 3D text stands on the counter; the optometrist flicks it away, puts glasses down,
 * and new 3D text drops onto the counter.
 *
 * The 3D camera is matched to the footage (tripod shot, 1080x1920):
 * - Focal length: iPhone 1x lens, ~69 deg vertical field of view in portrait.
 * - Counter edges measured from the frame: back edge y = 923 + 0.24x, front edge y = 1056 + 0.325x.
 *   They meet at a vanishing point (-1565, 548), which gives the counter's direction.
 * - No camera roll (the display box's sides are vertical), so "up" is the direction
 *   perpendicular to that, which puts the camera ~33 cm above the counter, pitched ~16 deg down.
 * - Scale from the sunglasses (~14 cm wide, 200 px). Scene units are centimetres.
 */

const W = 1080;
const H = 1920;
const F = 1398; // focal length in px
const VP: [number, number] = [-1565, 548];
const CAM_HEIGHT = 33; // cm above the counter top

// Timing (frames at 30 fps), read from the footage.
const FLICK = 75; // finger flicks at 2.5 s
const DROP = 160; // glasses are down at ~5.3 s
const FOOTAGE_FRAMES = 229;

export const FLICK_TEXT_DURATION = FOOTAGE_FRAMES + 36; // hold the last frame 1.2 s to read the text

// ---------- camera geometry (OpenCV convention: x right, y down, z forward) ----------
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const ray = (px: number, py: number) => v3((px - W / 2) / F, (py - H / 2) / F, 1);
const along = ray(VP[0], VP[1]).normalize();
const up = (() => {
  const u = v3(0, -1, -0.295); // roll 0; pitch solved so that up is perpendicular to the counter
  u.sub(along.clone().multiplyScalar(u.dot(along))).normalize();
  return u;
})();
const hitCv = (px: number, py: number) => {
  const r = ray(px, py);
  return r.multiplyScalar(-CAM_HEIGHT / up.dot(r));
};
// OpenCV camera -> three.js camera (y up, looking down -z).
const toThree = (v: THREE.Vector3) => v3(v.x, -v.y, -v.z);
const backEdge = (x: number) => 923 + 0.24 * x;
const frontEdge = (x: number) => 1056 + 0.325 * x;

type CounterFrame = {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  zBack: number; // local z of the counter's back edge
  zFront: number; // local z of the counter's front edge
  // Same spot, turned on the counter to face the camera more (for the text itself).
  textQuaternion: THREE.Quaternion;
};

/** A frame lying on the counter at a pixel: x along the counter (reading direction), y up, z toward the front edge. */
const counterFrame = (px: number, depth: number, faceCamera: number): CounterFrame => {
  const py = backEdge(px) + depth * (frontEdge(px) - backEdge(px));
  const position = toThree(hitCv(px, py));
  const ex = toThree(along).negate().normalize();
  const ey = toThree(up).normalize();
  const ez = new THREE.Vector3().crossVectors(ex, ey).normalize();
  const m = new THREE.Matrix4().makeBasis(ex, ey, ez);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(m);
  const zOf = (y: number) => toThree(hitCv(px, y)).sub(position).dot(ez);
  // Turn about "up" toward the camera: faceCamera 0 = parallel to the counter edge, 1 = square to the lens.
  const toCam = position.clone().negate();
  toCam.sub(ey.clone().multiplyScalar(toCam.dot(ey)));
  const yaw = Math.atan2(toCam.dot(ex), toCam.dot(ez)) * faceCamera;
  const textQuaternion = quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(v3(0, 1, 0), yaw));
  return { position, quaternion, textQuaternion, zBack: zOf(backEdge(px)), zFront: zOf(frontEdge(px)) };
};

// ---------- materials ----------
const BLACK = "#161616";
const INDIGO = "#0F2DB3";
const SIDE = "#c9ccd3";
const makeMaterials = (color: string) => {
  const c = new THREE.Color(color);
  return [
    // Matte faces (no glare) in the solid color; light grey sides so every letter has a
    // crisp edge against the next one and against the white counter.
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, metalness: 0.0 }),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(SIDE), roughness: 0.85, metalness: 0.0 }),
  ];
};

const Lights: React.FC<{ frame: CounterFrame }> = ({ frame }) => {
  // Lights are placed in the counter's frame: soft ceiling light above and slightly behind,
  // so shadows fall forward onto the counter like the sunglasses' shadow in the footage.
  const target = useMemo(() => new THREE.Object3D(), []);
  return (
    <group position={frame.position} quaternion={frame.quaternion}>
      <primitive object={target} position={[0, 0, 4]} />
      <ambientLight intensity={0.9} />
      <hemisphereLight args={["#ffffff", "#d8d8d8", 1.1]} />
      <directionalLight
        position={[-25, 140, -70]}
        intensity={2.2}
        target={target}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={6}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={1}
        shadow-camera-far={400}
      />
      {/* Near-overhead light: darkens the contact line where letters meet the counter. */}
      <directionalLight
        position={[5, 160, 10]}
        intensity={0.6}
        target={target}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={1}
        shadow-camera-far={400}
      />
      {/* Fill from the camera side keeps the letter faces readable. */}
      <directionalLight position={[40, 50, 160]} intensity={1.1} />
    </group>
  );
};

/** Invisible plane on the counter top that only shows shadows. */
const ShadowCatcher: React.FC<{ frame: CounterFrame; opacity: number }> = ({ frame, opacity }) => {
  const depth = frame.zFront - frame.zBack;
  return (
    <group position={frame.position} quaternion={frame.quaternion}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, (frame.zBack + frame.zFront) / 2]} receiveShadow>
        <planeGeometry args={[260, depth]} />
        <shadowMaterial opacity={opacity} transparent />
      </mesh>
    </group>
  );
};

const Letter: React.FC<{
  g: Glyph;
  materials: THREE.Material[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  shadow?: boolean;
}> = ({ g, materials, position, rotation, scale, shadow = true }) => (
  <mesh
    geometry={g.geometry}
    material={materials}
    position={position ?? [g.x, g.y, 0]}
    rotation={rotation ?? [0, 0, 0]}
    scale={scale ?? [1, 1, 1]}
    castShadow={shadow}
  />
);

// ---------- text 1: flicked away ----------
const LINES_1 = ["I NEED TO", "SAVE MONEY"];
const LINES_2 = ["NEW GLASSES", "ARE WHAT", "YOU NEED"];
const EXTRUDE = { depth: 1.1, bevel: 0.18 };

const FlickedText: React.FC<{ frame: CounterFrame; font: ReturnType<typeof useOpenTypeFont> }> = ({ frame, font }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const glyphs = useGlyphs(font, LINES_1, 3.6, 1.3, EXTRUDE, 0.45);
  const materials = useMemo(() => makeMaterials(BLACK), []);
  const t = (f - FLICK) / fps;
  if (t > 0.9) return null;

  // Before the flick it sits still. On the flick: launched toward the camera, up and left,
  // tumbling forward (the finger hits it from behind), with gravity.
  let pos: [number, number, number] = [0, 0, 0];
  let rot: [number, number, number] = [0, 0, 0];
  if (t > 0) {
    const g = 260;
    pos = [-45 * t, 95 * t - 0.5 * g * t * t, 55 * t];
    rot = [6 * t, -1.8 * t, 2.4 * t];
  } else if (t > -3 / fps) {
    // Tiny lean back as the finger loads up.
    rot = [-0.04 * (1 + t * fps / 3), 0, 0];
  }
  // Tumble about the block's middle, not its base.
  const pivotY = 4.5;
  return (
    <group position={frame.position} quaternion={frame.textQuaternion}>
      <group position={[pos[0], pos[1] + pivotY, pos[2]]} rotation={rot}>
        <group position={[0, -pivotY, 0]}>
          {glyphs.map((g, i) => (
            <Letter key={i} g={g} materials={materials} />
          ))}
        </group>
      </group>
    </group>
  );
};

// ---------- text 2: letters drop onto the counter ----------
const DroppedText: React.FC<{ frame: CounterFrame; font: ReturnType<typeof useOpenTypeFont> }> = ({ frame, font }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const glyphs = useGlyphs(font, LINES_2, 2.7, 1.0, EXTRUDE, 0.32);
  const indigo = useMemo(() => makeMaterials(INDIGO), []);
  const black = useMemo(() => makeMaterials(BLACK), []);
  const capLine = 2.7 + 1.0;

  // Bottom line lands first so the lines above stack onto it.
  const ordered = useMemo(() => {
    const byLine = [...glyphs].sort((a, b) => a.y - b.y || a.x - b.x);
    return new Map(byLine.map((g, i) => [g, i]));
  }, [glyphs]);

  const drop = 24; // cm above its resting place
  const grav = 980;
  const tFall = Math.sqrt((2 * drop) / grav);
  return (
    <group position={frame.position} quaternion={frame.textQuaternion}>
      {glyphs.map((g, i) => {
        const order = ordered.get(g) ?? 0;
        const t = (f - DROP - order * 0.9) / fps;
        if (t < 0) return null;
        const seed = Math.sin(i * 12.9898) * 43758.5453;
        const rnd = seed - Math.floor(seed);
        let y: number;
        let sx = 1;
        let sy = 1;
        let tilt = 0;
        if (t < tFall) {
          y = drop - 0.5 * grav * t * t;
          sy = 1.06;
          sx = 0.97;
          tilt = (rnd - 0.5) * 0.5 * (1 - t / tFall);
        } else {
          const s = t - tFall;
          y = 2.2 * Math.abs(Math.sin((Math.PI * s) / 0.16)) * Math.exp(-9 * s);
          const squash = 0.22 * Math.exp(-22 * s) * Math.cos((Math.PI * s) / 0.12);
          sy = 1 - squash;
          sx = 1 + squash * 0.6;
          tilt = 0;
        }
        const grow = Math.min(1, t * fps / 4);
        const isTop = Math.round(g.y / capLine) === LINES_2.length - 1;
        return (
          <Letter
            key={i}
            g={g}
            materials={isTop ? indigo : black}
            position={[g.x, g.y + y, 0]}
            rotation={[0, 0, tilt]}
            // Grows in over the first frames instead of popping; only casts a shadow once
            // it's close to the counter (a soft ceiling light wouldn't throw a sharp one from high up).
            scale={[sx * grow, sy * grow, sx * grow]}
            shadow={y < 9}
          />
        );
      })}
    </group>
  );
};

export const FlickText: React.FC = () => {
  const frame = useCurrentFrame();
  const font = useOpenTypeFont("fonts/Outfit-Bold.ttf");
  const { width, height } = useVideoConfig();
  // Text 1 stands just in front of where her fingertips rest (~x 390); text 2 to the right of the sunglasses.
  const spot1 = useMemo(() => counterFrame(370, 0.55, 0.85), []);
  const spot2 = useMemo(() => counterFrame(545, 0.62, 0.85), []);
  const vfov = (2 * Math.atan(H / 2 / F) * 180) / Math.PI;

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff" }}>
      <Freeze frame={FOOTAGE_FRAMES - 1} active={frame >= FOOTAGE_FRAMES - 1}>
        <OffthreadVideo src={staticFile("footage/joyce.mp4")} />
      </Freeze>
      <ThreeCanvas
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
        shadows="soft"
        linear={false}
        camera={{ fov: vfov, near: 1, far: 3000, position: [0, 0, 0], rotation: [0, 0, 0] }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      >
        <Lights frame={frame < DROP ? spot1 : spot2} />
        <ShadowCatcher frame={spot1} opacity={0.32} />
        {font && frame < DROP && <FlickedText frame={spot1} font={font} />}
        {font && <DroppedText frame={spot2} font={font} />}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
