import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { muestrearCamara, type ClaveCamara, type Vec3 } from "../lib/anim";

/**
 * PATRIA EN DISPUTA — escenario cinematográfico.
 * Vacío negro, piso brillante, luces duras con conos volumétricos, niebla,
 * cámara por claves con un leve movimiento de cámara en mano.
 */

export const NEGRO = "#070707";
export const ROJO = "#d4162c";
export const CREMA = "#efe6d4";

export interface Luz {
  pos: Vec3;
  apunta: Vec3;
  color?: string;
  intensidad?: number;
  angulo?: number;
  penumbra?: number;
  sombra?: boolean;
  /** Cono de luz visible (polvo en el aire). 0 = invisible. */
  cono?: number;
}

export interface Ambiente {
  fondo?: string;
  niebla?: [number, number];
  /** Luz de relleno general (0..1). */
  relleno?: number;
  /** Color del relleno (frío al principio, cálido después). */
  colorRelleno?: string;
  piso?: string;
  /** Intensidad de reflejos del entorno. */
  entorno?: number;
  /** Sin piso general (cuando la toma trae su propio suelo). */
  sinPiso?: boolean;
}

function texturaCono() {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "rgba(255,255,255,0.0)");
  grad.addColorStop(0.15, "rgba(255,255,255,0.9)");
  grad.addColorStop(1, "rgba(255,255,255,0.15)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  return new THREE.CanvasTexture(c);
}

function LuzCine({ l, tex }: { l: Luz; tex: THREE.Texture }) {
  const r = useMemo(() => {
    const s = new THREE.SpotLight(l.color ?? "#ffffff", 1, 0, 0.4, 0.5, 1.4);
    s.castShadow = l.sombra ?? true;
    s.shadow.mapSize.set(1024, 1024);
    s.shadow.bias = -0.0006;
    s.shadow.normalBias = 0.02;
    const cono = new THREE.Mesh(
      new THREE.ConeGeometry(1, 1, 40, 1, true),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }),
    );
    return { s, cono };
  }, [tex, l.sombra]);
  const { s, cono } = r;
  s.color.set(l.color ?? "#ffffff");
  s.intensity = l.intensidad ?? 60;
  s.angle = l.angulo ?? 0.35;
  s.penumbra = l.penumbra ?? 0.6;
  s.position.set(...l.pos);
  s.target.position.set(...l.apunta);
  s.target.updateMatrixWorld();
  // Cono visible alineado con la luz.
  const a = new THREE.Vector3(...l.pos);
  const b = new THREE.Vector3(...l.apunta);
  const largo = a.distanceTo(b);
  const radio = Math.tan(s.angle) * largo;
  cono.position.copy(a.clone().add(b).multiplyScalar(0.5));
  cono.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), b.clone().sub(a).normalize());
  cono.scale.set(radio, largo, radio);
  (cono.material as THREE.MeshBasicMaterial).color.set(l.color ?? "#ffffff");
  (cono.material as THREE.MeshBasicMaterial).opacity = l.cono ?? 0;
  cono.visible = (l.cono ?? 0) > 0.001;
  return (
    <>
      <primitive object={s} />
      <primitive object={s.target} />
      <primitive object={cono} />
    </>
  );
}

function Mundo({
  frame,
  camara,
  luces,
  ambiente,
  temblor,
  children,
}: {
  frame: number;
  camara: ClaveCamara[];
  luces: Luz[];
  ambiente: Ambiente;
  temblor: number;
  children?: React.ReactNode;
}) {
  const { camera, scene, gl } = useThree();
  const tex = useMemo(texturaCono, []);
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }, [gl, scene]);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.18;
    gl.shadowMap.type = THREE.PCFShadowMap;
  }, [gl]);
  scene.environmentIntensity = ambiente.entorno ?? 0.12;
  const fondo = new THREE.Color(ambiente.fondo ?? NEGRO);
  scene.background = fondo;
  const [n0, n1] = ambiente.niebla ?? [18, 60];
  if (!scene.fog) scene.fog = new THREE.Fog(fondo, n0, n1);
  const fog = scene.fog as THREE.Fog;
  fog.color.copy(fondo);
  fog.near = n0;
  fog.far = n1;

  const c = muestrearCamara(camara, frame);
  // Cámara en mano muy sutil: ruido suave y determinista.
  const tt = frame / 30;
  const ruido = (k: number) => Math.sin(tt * 0.9 + k) * 0.6 + Math.sin(tt * 2.1 + k * 3.7) * 0.3;
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(c.pos[0] + ruido(1) * 0.03 * temblor, c.pos[1] + ruido(2) * 0.02 * temblor, c.pos[2] + ruido(3) * 0.03 * temblor);
  cam.fov = c.fov;
  cam.near = 0.05;
  cam.far = 400;
  cam.lookAt(c.target[0] + ruido(4) * 0.02 * temblor, c.target[1] + ruido(5) * 0.02 * temblor, c.target[2]);
  cam.updateProjectionMatrix();

  return (
    <>
      <hemisphereLight args={[ambiente.colorRelleno ?? "#9fb3c8", "#1a1210", ambiente.relleno ?? 0.25]} />
      {luces.map((l, i) => (
        <LuzCine key={i} l={l} tex={tex} />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow visible={!ambiente.sinPiso}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color={ambiente.piso ?? "#0c0c0d"} roughness={0.32} metalness={0.25} />
      </mesh>
      {children}
    </>
  );
}

/** Una toma: lienzo 3D vertical con su cámara, luces y ambiente. */
export const Toma3D: React.FC<{
  camara: ClaveCamara[];
  luces: (f: number) => Luz[];
  ambiente?: (f: number) => Ambiente;
  temblor?: number;
  children: (f: number) => React.ReactNode;
}> = ({ camara, luces, ambiente, temblor = 1, children }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ fov: 35, position: [0, 2, 8] }}>
        <Mundo frame={frame} camara={camara} luces={luces(frame)} ambiente={ambiente?.(frame) ?? {}} temblor={temblor}>
          {children(frame)}
        </Mundo>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

/** Hilo rojo entre puntos, que crece de 0 a 1. */
export function HiloRojo({ puntos, crece = 1, grosor = 0.018, brillo = 1 }: { puntos: Vec3[]; crece?: number; grosor?: number; brillo?: number }) {
  const r = useMemo(() => {
    const curva = new THREE.CatmullRomCurve3(puntos.map((p) => new THREE.Vector3(...p)));
    const g = new THREE.TubeGeometry(curva, Math.max(16, puntos.length * 16), grosor, 8, false);
    const halo = new THREE.TubeGeometry(curva, Math.max(16, puntos.length * 16), grosor * 3.2, 8, false);
    return {
      g,
      halo,
      mat: new THREE.MeshBasicMaterial({ color: ROJO, toneMapped: false }),
      matHalo: new THREE.MeshBasicMaterial({ color: ROJO, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    };
  }, [JSON.stringify(puntos), grosor]);
  for (const g of [r.g, r.halo]) {
    const total = g.index ? g.index.count : 0;
    g.setDrawRange(0, Math.floor((total * Math.max(0, Math.min(1, crece))) / 48) * 48);
  }
  r.matHalo.opacity = 0.22 * brillo;
  return (
    <group>
      <mesh geometry={r.g} material={r.mat} />
      <mesh geometry={r.halo} material={r.matHalo} />
    </group>
  );
}
