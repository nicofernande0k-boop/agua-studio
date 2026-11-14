import { useMemo } from "react";
import * as THREE from "three";
import type { Vec3 } from "../lib/anim";

/**
 * Trabajador sanitarista en el mismo estilo de la ciudad: volúmenes simples,
 * overol azul, chaleco naranja con bandas reflectivas, casco y botas.
 * Las poses se arman con ángulos de articulaciones (en radianes).
 */

export interface Pose {
  /** Rotación de cada hombro hacia adelante (x) y hacia afuera (z). */
  hombroD?: [number, number];
  hombroI?: [number, number];
  codoD?: number;
  codoI?: number;
  /** Cadera hacia adelante y rodilla (para agacharse o caminar). */
  caderaD?: number;
  caderaI?: number;
  rodillaD?: number;
  rodillaI?: number;
  /** Inclinación del torso hacia adelante. */
  torso?: number;
  /** Giro de la cabeza (y) e inclinación (x). */
  cabeza?: [number, number];
  /** Bajada del cuerpo entero (al agacharse). */
  bajar?: number;
}

export type Herramienta = "llave" | "pala" | "linterna" | "tablet" | null;

const PIEL = ["#c68c5d", "#8d5a3b", "#e0ac7e", "#a8714b", "#f0c9a0"];

export function Trabajador({
  position,
  rotacion = 0,
  pose = {},
  piel = 0,
  casco = "#f7f7f2",
  herramienta = null,
  escala = 1,
}: {
  position: Vec3;
  rotacion?: number;
  pose?: Pose;
  piel?: number;
  casco?: string;
  herramienta?: Herramienta;
  escala?: number;
}) {
  const r = useMemo(
    () => ({
      overol: new THREE.MeshStandardMaterial({ color: "#24406b", roughness: 0.85 }),
      chaleco: new THREE.MeshStandardMaterial({ color: "#ff7a1a", roughness: 0.7 }),
      reflectivo: new THREE.MeshStandardMaterial({ color: "#eef3f3", roughness: 0.3, emissive: "#ffffff", emissiveIntensity: 0.25 }),
      piel: new THREE.MeshStandardMaterial({ color: PIEL[piel % PIEL.length], roughness: 0.7 }),
      casco: new THREE.MeshStandardMaterial({ color: casco, roughness: 0.35 }),
      bota: new THREE.MeshStandardMaterial({ color: "#2b2622", roughness: 0.8 }),
      guante: new THREE.MeshStandardMaterial({ color: "#f2c230", roughness: 0.8 }),
      ojo: new THREE.MeshBasicMaterial({ color: "#1b1b1b" }),
      metal: new THREE.MeshStandardMaterial({ color: "#b8c0c8", roughness: 0.25, metalness: 0.9 }),
      madera: new THREE.MeshStandardMaterial({ color: "#8a5a35", roughness: 0.7 }),
      pantalla: new THREE.MeshBasicMaterial({ color: "#7fd8ff", toneMapped: false }),
      luz: new THREE.MeshBasicMaterial({ color: "#fff3c4", toneMapped: false }),
    }),
    [piel, casco],
  );
  const p = {
    hombroD: [0, 0], hombroI: [0, 0], codoD: 0, codoI: 0, caderaD: 0, caderaI: 0,
    rodillaD: 0, rodillaI: 0, torso: 0, cabeza: [0, 0], bajar: 0, ...pose,
  } as Required<Pose>;

  const pierna = (lado: 1 | -1, cadera: number, rodilla: number) => (
    <group position={[lado * 0.11, 0.9, 0]} rotation={[-cadera, 0, 0]}>
      <mesh position={[0, -0.22, 0]} material={r.overol} castShadow>
        <capsuleGeometry args={[0.085, 0.3, 4, 10]} />
      </mesh>
      <group position={[0, -0.44, 0]} rotation={[rodilla, 0, 0]}>
        <mesh position={[0, -0.2, 0]} material={r.overol} castShadow>
          <capsuleGeometry args={[0.078, 0.28, 4, 10]} />
        </mesh>
        <mesh position={[0, -0.42, 0.05]} material={r.bota} castShadow>
          <boxGeometry args={[0.15, 0.1, 0.27]} />
        </mesh>
      </group>
    </group>
  );

  const brazo = (lado: 1 | -1, hombro: [number, number], codo: number, mano: Herramienta) => (
    <group position={[lado * 0.27, 1.38, 0]} rotation={[-hombro[0], 0, lado * hombro[1]]}>
      <mesh position={[0, -0.15, 0]} material={r.overol} castShadow>
        <capsuleGeometry args={[0.065, 0.2, 4, 10]} />
      </mesh>
      <group position={[0, -0.3, 0]} rotation={[-codo, 0, 0]}>
        <mesh position={[0, -0.13, 0]} material={r.overol} castShadow>
          <capsuleGeometry args={[0.058, 0.18, 4, 10]} />
        </mesh>
        <mesh position={[0, -0.28, 0]} material={r.guante}>
          <sphereGeometry args={[0.065, 12, 10]} />
        </mesh>
        {mano === "llave" ? (
          <group position={[0, -0.32, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={r.metal}><boxGeometry args={[0.04, 0.34, 0.02]} /></mesh>
            <mesh material={r.metal} position={[0, 0.18, 0]}><torusGeometry args={[0.04, 0.012, 8, 16]} /></mesh>
          </group>
        ) : null}
        {mano === "pala" ? (
          <group position={[0, -0.3, 0]}>
            <mesh material={r.madera} position={[0, -0.25, 0]}><cylinderGeometry args={[0.018, 0.018, 1.0, 8]} /></mesh>
            <mesh material={r.metal} position={[0, -0.8, 0.02]}><boxGeometry args={[0.22, 0.28, 0.02]} /></mesh>
          </group>
        ) : null}
        {mano === "linterna" ? (
          <group position={[0, -0.32, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={r.bota}><cylinderGeometry args={[0.03, 0.03, 0.18, 10]} /></mesh>
            <mesh material={r.luz} position={[0, 0.095, 0]}><cylinderGeometry args={[0.04, 0.03, 0.02, 12]} /></mesh>
          </group>
        ) : null}
        {mano === "tablet" ? (
          <group position={[0, -0.33, 0.1]} rotation={[0.9, 0, 0]}>
            <mesh material={r.bota}><boxGeometry args={[0.26, 0.02, 0.18]} /></mesh>
            <mesh material={r.pantalla} position={[0, 0.012, 0]}><boxGeometry args={[0.23, 0.005, 0.15]} /></mesh>
          </group>
        ) : null}
      </group>
    </group>
  );

  return (
    <group position={position} rotation={[0, rotacion, 0]} scale={escala}>
      <group position={[0, -p.bajar, 0]}>
        {pierna(1, p.caderaD, p.rodillaD)}
        {pierna(-1, p.caderaI, p.rodillaI)}
        <group position={[0, 0.9, 0]} rotation={[p.torso, 0, 0]}>
          <group position={[0, -0.9, 0]}>
            {/* Torso: overol + chaleco con bandas */}
            <mesh position={[0, 1.15, 0]} material={r.overol} castShadow>
              <boxGeometry args={[0.44, 0.56, 0.25]} />
            </mesh>
            <mesh position={[0, 1.2, 0]} material={r.chaleco} castShadow>
              <boxGeometry args={[0.46, 0.42, 0.27]} />
            </mesh>
            {[1.1, 1.26].map((y) => (
              <mesh key={y} position={[0, y, 0]} material={r.reflectivo}>
                <boxGeometry args={[0.47, 0.035, 0.28]} />
              </mesh>
            ))}
            {brazo(1, p.hombroD, p.codoD, herramienta)}
            {brazo(-1, p.hombroI, p.codoI, null)}
            {/* Cabeza, cara y casco */}
            <group position={[0, 1.58, 0]} rotation={[p.cabeza[1], p.cabeza[0], 0]}>
              <mesh position={[0, -0.1, 0]} material={r.piel}>
                <cylinderGeometry args={[0.05, 0.05, 0.08, 10]} />
              </mesh>
              <mesh material={r.piel} castShadow>
                <sphereGeometry args={[0.12, 20, 16]} />
              </mesh>
              {[-0.042, 0.042].map((x) => (
                <mesh key={x} position={[x, 0.01, 0.112]} material={r.ojo}>
                  <sphereGeometry args={[0.014, 8, 6]} />
                </mesh>
              ))}
              <mesh position={[0, 0.045, 0]} material={r.casco} castShadow>
                <sphereGeometry args={[0.135, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              </mesh>
              <mesh position={[0, 0.05, 0.04]} material={r.casco}>
                <cylinderGeometry args={[0.165, 0.165, 0.02, 24]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/** Ciclo de caminata (t en segundos). */
export function poseCaminar(t: number, velocidad = 1): Pose {
  const s = Math.sin(t * 6 * velocidad);
  return {
    caderaD: s * 0.45,
    caderaI: -s * 0.45,
    rodillaD: Math.max(0, -s) * 0.6,
    rodillaI: Math.max(0, s) * 0.6,
    hombroD: [-s * 0.4, 0.05],
    hombroI: [s * 0.4, 0.05],
    codoD: 0.3,
    codoI: 0.3,
  };
}
