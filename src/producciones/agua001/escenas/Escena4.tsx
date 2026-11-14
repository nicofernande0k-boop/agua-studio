import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { muestrearCamara, progreso, type ClaveCamara } from "../../../lib/anim";
import { MapaArgentina, posCiudad } from "../../../three/MapaArgentina";
import { Fundido, TituloEscena } from "../../../ui/Superposiciones";
import { FPS, Lienzo, s } from "../comun";

/**
 * Escena 4 — Argentina, años 90 (18 s)
 * Mapa 3D del país: surgen ciudades, plantas y redes; una línea de tiempo
 * marca los años 90; caen contratos y aparecen símbolos de empresas sobre
 * parte de la infraestructura (experiencias diversas, no todas iguales).
 * La cámara recorre el país y vuelve a Buenos Aires.
 */

const BA = posCiudad("Buenos Aires");

export const CAMARA_E4: ClaveCamara[] = [
  { f: 0, pos: [0, 150, 62], target: [0, 0, 2], fov: 40 },
  { f: s(3.0), pos: [6, 126, 70], target: [4, 0, 6], fov: 40 },
  { f: s(5.0), pos: [24, 52, 52], target: [15, 0, 14], fov: 42 },
  { f: s(8.0), pos: [-6, 58, 34], target: [-2, 0, -12], fov: 42 },
  { f: s(10.3), pos: [-8, 30, -16], target: [-5, 0, -32], fov: 44 },
  { f: s(12.3), pos: [-17, 28, 0], target: [-13, 0, -14], fov: 44 },
  { f: s(14.3), pos: [-10, 32, 26], target: [-8, 0, 12], fov: 44 },
  { f: s(16.4), pos: [BA[0] - 4, 20, BA[2] + 16], target: [BA[0], 0, BA[2]], fov: 44 },
  { f: s(18.0), pos: [BA[0] + 0.1, 2.8, BA[2] + 0.9], target: [BA[0], 0, BA[2]], fov: 50 },
];

function MundoMapa({ frame }: { frame: number }) {
  const { camera, scene, gl } = useThree();
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.45;
    scene.background = new THREE.Color("#10263b");
    scene.fog = new THREE.Fog("#10263b", 140, 320);
    pmrem.dispose();
  }, [gl, scene]);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
  }, [gl]);
  const c = muestrearCamara(CAMARA_E4, frame);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...c.pos);
  cam.fov = c.fov;
  cam.near = 0.1;
  cam.far = 900;
  cam.lookAt(...c.target);
  cam.updateProjectionMatrix();

  const sol = useMemo(() => {
    const l = new THREE.DirectionalLight("#fff0d6", 2.4);
    l.castShadow = true;
    l.shadow.mapSize.set(2048, 2048);
    l.shadow.bias = -0.0005;
    const sc = l.shadow.camera;
    sc.left = -60;
    sc.right = 60;
    sc.top = 60;
    sc.bottom = -60;
    sc.near = 1;
    sc.far = 300;
    l.position.set(-60, 110, 50);
    return l;
  }, []);

  return (
    <>
      <primitive object={sol} />
      <hemisphereLight args={["#d4ecff", "#3a5f7a", 1.1]} />
      <MapaArgentina
        frame={frame}
        estado={{
          ciudades: progreso(frame, s(0.2), s(3.0)),
          lineaTiempo: progreso(frame, s(1.2), s(5.0)),
          contratos: progreso(frame, s(5.4), s(8.8)),
          empresas: progreso(frame, s(6.0), s(9.0)),
          tension: progreso(frame, s(10.0), s(11.5)),
        }}
      />
    </>
  );
}

export const Escena4: React.FC = () => {
  const frame = useCurrentFrame();
  const entrada = 1 - progreso(frame, 0, s(0.7));
  const salida = progreso(frame, s(17.2), s(18.0));
  return (
    <AbsoluteFill>
      <Lienzo>
        <MundoMapa frame={frame} />
      </Lienzo>
      <Fundido color="#eef5fa" opacidad={Math.max(entrada, salida)} />
      <TituloEscena frame={frame - s(0.5)} fps={FPS} numero={4} titulo="ARGENTINA, AÑOS 90" dura={2.8} />
    </AbsoluteFill>
  );
};
