import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { clamp01, lerp, muestrearCamara } from "../lib/anim";
import { CAMARA, PISO } from "../demo/escena";
import { Casa } from "./Casa";
import { Ciudad } from "./Ciudad";
import { Subsuelo } from "./Subsuelo";

const CIELO = new THREE.Color("#bfdcee");
const TIERRA = new THREE.Color("#170f0a");

/**
 * Arma la escena completa y ubica la cámara según el fotograma.
 * Arriba del piso se muestra la ciudad; debajo, solo el subsuelo (lo que no
 * se ve no se dibuja, así el render por software es más rápido).
 */
export function Mundo({ frame, fps }: { frame: number; fps: number }) {
  const { camera, scene, gl } = useThree();

  // Entorno procedural para reflejos (cromo, vidrio, espejo). Sin internet.
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.45;
    pmrem.dispose();
  }, [gl, scene]);

  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
  }, [gl]);

  // --- Cámara ---
  const c = muestrearCamara(CAMARA, frame);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...c.pos);
  cam.fov = c.fov;
  const distancia = Math.hypot(c.pos[0] - c.target[0], c.pos[1] - c.target[1], c.pos[2] - c.target[2]);
  cam.near = Math.min(1.5, Math.max(0.02, distancia * 0.02));
  cam.far = 700;
  cam.lookAt(...c.target);
  cam.updateProjectionMatrix();

  const bajoTierra = c.pos[1] < 0;
  const adentro = !bajoTierra && c.pos[1] < PISO + 3;

  // --- Niebla y fondo ---
  if (!scene.fog) scene.fog = new THREE.Fog(CIELO, 90, 280);
  const fog = scene.fog as THREE.Fog;
  if (bajoTierra) {
    fog.color.copy(TIERRA);
    fog.near = 5;
    fog.far = 32;
    scene.background = TIERRA;
  } else {
    fog.color.copy(CIELO);
    fog.near = 90;
    fog.far = 280;
    scene.background = CIELO;
  }

  // --- Sol: el área de sombras se achica al acercarnos para ganar nitidez ---
  const cercania = clamp01((60 - c.pos[1]) / 55);
  const radioSombra = lerp(80, 9, cercania);
  const centroSombra = new THREE.Vector3(lerp(0, 2, cercania), 0, lerp(-4, -3, cercania));
  const sol = useMemo(() => {
    const l = new THREE.DirectionalLight("#fff0d6", 2.6);
    l.castShadow = true;
    l.shadow.mapSize.set(2048, 2048);
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.03;
    return l;
  }, []);
  const dirSol = new THREE.Vector3(-30, 46, 24).normalize();
  sol.position.copy(centroSombra).addScaledVector(dirSol, 120);
  sol.target.position.copy(centroSombra);
  sol.target.updateMatrixWorld();
  const sc = sol.shadow.camera;
  sc.left = -radioSombra;
  sc.right = radioSombra;
  sc.top = radioSombra;
  sc.bottom = -radioSombra;
  sc.near = 1;
  sc.far = 260;
  sc.updateProjectionMatrix();
  sol.intensity = bajoTierra ? 0 : 2.6;

  return (
    <>
      <primitive object={sol} />
      <primitive object={sol.target} />
      <hemisphereLight args={["#d4ecff", "#c9a27e", bajoTierra ? 0.35 : adentro ? 0.8 : 1.1]} />
      <Ciudad frame={frame} fps={fps} oculta={bajoTierra} />
      <Casa frame={frame} oculta={bajoTierra} />
      <Subsuelo frame={frame} oculto={!bajoTierra} />
    </>
  );
}
