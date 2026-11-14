import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { muestrearCamara, type ClaveCamara } from "../../lib/anim";
import { MapaArgentina, type EstadoMapa } from "../../three/MapaArgentina";
import { Lienzo } from "../agua001/comun";

/** Mapa 3D de Argentina con cámara por claves y estado por fotograma. */
function MundoMapa({ frame, camara, estado }: { frame: number; camara: ClaveCamara[]; estado: EstadoMapa }) {
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
  const c = muestrearCamara(camara, frame);
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
      <MapaArgentina frame={frame} estado={estado} />
    </>
  );
}

export const VistaMapa: React.FC<{ camara: ClaveCamara[]; estado: (f: number) => EstadoMapa }> = ({ camara, estado }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Lienzo>
        <MundoMapa frame={frame} camara={camara} estado={estado(frame)} />
      </Lienzo>
    </AbsoluteFill>
  );
};
