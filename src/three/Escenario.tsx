import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { clamp01, lerp, muestrearCamara, type ClaveCamara, type Vec3 } from "../lib/anim";
import { PISO } from "../demo/escena";
import { Casa, type TiemposCasa } from "./Casa";
import { Ciudad, type OpcionesCiudad } from "./Ciudad";
import type { Tinte } from "./Instancias";
import { RedAgua, type ConexionExtra, type PropsRed } from "./RedAgua";
import { Subsuelo } from "./Subsuelo";
import { texturaSuelo } from "./texturas";

/**
 * Escenario 3D reutilizable: la ciudad, la casa, el subsuelo y la red de agua,
 * con la cámara guiada por claves. Cada escena de una producción solo define
 * su recorrido de cámara y el estado del mundo (agua, luces, rayos X).
 */

const CIELO = new THREE.Color("#bfdcee");
const CIELO_NOCHE = new THREE.Color("#1b2536");
const TIERRA = new THREE.Color("#170f0a");

export interface EstadoEscenario {
  camara: ClaveCamara[];
  /** 0 = suelo opaco; 1 = suelo transparente que deja ver la red. */
  rayosX?: number;
  /** 0 = día; 1 = ciudad a oscuras. */
  oscuridad?: number;
  /** Brillo por edificio (para apagar o encender zonas). */
  brillo?: Tinte;
  /** Estado de la red; null para no dibujarla. */
  red?: Omit<PropsRed, "frame" | "opciones" | "extras" | "visible"> | null;
  casa?: TiemposCasa;
  manometro?: readonly [number, number];
  /** Ocultar la ciudad (por ejemplo, para escenas fuera de ella). */
  sinCiudad?: boolean;
}

export function calcularCamara(claves: ClaveCamara[], frame: number) {
  return muestrearCamara(claves, frame);
}

/** Opacidad del fundido a oscuro al atravesar el piso o la calle. */
export function fundidoSuelo(y: number) {
  return clamp01(1 - Math.abs(y - PISO / 2) / 0.55);
}

export function Escenario({
  frame,
  fps,
  estado,
  opciones,
  conexiones,
  children,
}: {
  frame: number;
  fps: number;
  estado: EstadoEscenario;
  opciones?: OpcionesCiudad;
  conexiones?: ConexionExtra[];
  children?: (info: { bajoTierra: boolean; camara: Vec3 }) => React.ReactNode;
}) {
  const { camera, scene, gl } = useThree();

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

  const rayosX = estado.rayosX ?? 0;
  const oscuridad = estado.oscuridad ?? 0;

  // --- Cámara ---
  const c = muestrearCamara(estado.camara, frame);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...c.pos);
  cam.fov = c.fov;
  const distancia = Math.hypot(c.pos[0] - c.target[0], c.pos[1] - c.target[1], c.pos[2] - c.target[2]);
  cam.near = Math.min(1.5, Math.max(0.02, distancia * 0.02));
  cam.far = 900;
  cam.lookAt(...c.target);
  cam.updateProjectionMatrix();

  const bajoTierra = c.pos[1] < 0 && rayosX < 0.5;

  // --- Cielo y niebla ---
  const cielo = CIELO.clone().lerp(CIELO_NOCHE, oscuridad * 0.85);
  if (!scene.fog) scene.fog = new THREE.Fog(CIELO, 90, 280);
  const fog = scene.fog as THREE.Fog;
  if (bajoTierra) {
    fog.color.copy(TIERRA);
    fog.near = 5;
    fog.far = 36;
    scene.background = TIERRA;
  } else {
    fog.color.copy(cielo);
    fog.near = 110;
    fog.far = 340;
    scene.background = cielo;
  }

  // --- Sol con sombras que se ajustan a la altura de la cámara ---
  const cercania = clamp01((70 - c.pos[1]) / 65);
  const radioSombra = lerp(95, 12, cercania);
  const centroSombra = new THREE.Vector3(c.target[0], 0, c.target[2]);
  const sol = useMemo(() => {
    const l = new THREE.DirectionalLight("#fff0d6", 2.6);
    l.castShadow = true;
    l.shadow.mapSize.set(2048, 2048);
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.03;
    return l;
  }, []);
  const dirSol = new THREE.Vector3(-30, 46, 24).normalize();
  sol.position.copy(centroSombra).addScaledVector(dirSol, 140);
  sol.target.position.copy(centroSombra);
  sol.target.updateMatrixWorld();
  const sc = sol.shadow.camera;
  sc.left = -radioSombra;
  sc.right = radioSombra;
  sc.top = radioSombra;
  sc.bottom = -radioSombra;
  sc.near = 1;
  sc.far = 320;
  sc.updateProjectionMatrix();
  sol.intensity = bajoTierra ? 0 : 2.6 * (1 - 0.75 * oscuridad);
  sol.color.set("#fff0d6").lerp(new THREE.Color("#9fb4ff"), oscuridad * 0.6);

  const suelo = useMemo(() => {
    const t = texturaSuelo();
    t.repeat.set(30, 30);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 1, color: "#8a6a50" });
  }, []);

  const red = estado.red;
  const verRed = !!red && (bajoTierra || rayosX > 0.02);

  return (
    <>
      <primitive object={sol} />
      <primitive object={sol.target} />
      <hemisphereLight
        args={["#d4ecff", "#c9a27e", bajoTierra ? 0.35 : (c.pos[1] < PISO + 3 ? 0.8 : 1.1) * (1 - 0.6 * oscuridad)]}
      />
      {!estado.sinCiudad ? (
        <>
          <Ciudad frame={frame} fps={fps} oculta={bajoTierra} opciones={opciones} brillo={estado.brillo} rayosX={rayosX} />
          <Casa frame={frame} oculta={bajoTierra} tiempos={estado.casa} />
          <Subsuelo frame={frame} oculto={!bajoTierra} sinRed={!!red} manometro={estado.manometro} />
          {/* Fondo de tierra bajo el suelo transparente */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.8, 0]} material={suelo} visible={!bajoTierra && rayosX > 0.02}>
            <planeGeometry args={[520, 520]} />
          </mesh>
        </>
      ) : null}
      {red ? <RedAgua frame={frame} {...red} visible={verRed} opciones={opciones} extras={conexiones} /> : null}
      {children?.({ bajoTierra, camara: c.pos })}
    </>
  );
}
