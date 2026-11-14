import { useMemo } from "react";
import * as THREE from "three";
import { clamp01, crearAzar, easeInOutCubic, easeOutBack, progreso, type Vec3 } from "../lib/anim";
import { CALLE_Z } from "../demo/escena";
import { POS_TORRE } from "./Edificios";
import { NIVEL_VEREDA } from "./Ciudad";
import { Trabajador, poseCaminar, type Ropa } from "./Personaje";
import { texturaSuelo } from "./texturas";

/**
 * Piezas de la versión narrada: fuente de la plaza con chicos, pueblo rural,
 * lluvia, camión de madrugada y monedas de pago. Mismo lenguaje visual.
 */

const m = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.8, ...o });

export const ROPAS: Ropa[] = [
  { torso: "#e0574a", piernas: "#2f4f7a", pelo: "#2b1d14" },
  { torso: "#f2c230", piernas: "#3a3a46", pelo: "#5a3a22" },
  { torso: "#5fb3a1", piernas: "#2b2b33", pelo: "#1d1410" },
  { torso: "#9b7bd8", piernas: "#33415c", pelo: "#3b2616" },
  { torso: "#74acdf", piernas: "#f4f4f2", pelo: "#24170f" },
];

/** Fuente en la plaza (donde antes emergía la torre) con chicos jugando. `flujo` 0..1. */
export function Fuente({ frame, flujo, chicos = true }: { frame: number; flujo: number; chicos?: boolean }) {
  const r = useMemo(() => {
    const azar = crearAzar(12);
    return {
      piedra: m({ color: "#e6e0d4" }),
      agua: m({ color: "#5bc0eb", roughness: 0.05, metalness: 0.1, emissive: "#1aa3ff", emissiveIntensity: 0.25 }),
      chorro: new THREE.MeshBasicMaterial({ color: "#c9f1ff", transparent: true, opacity: 0.85, toneMapped: false }),
      seco: m({ color: "#b9b0a0" }),
      gotas: Array.from({ length: 140 }, () => ({ ang: azar.entre(0, Math.PI * 2), v: azar.entre(0.8, 1.2), fase: azar.n(), alto: azar.entre(0.7, 1.0) })),
    };
  }, []);
  const t = frame / 30;
  const [cx, , cz] = POS_TORRE;
  return (
    <group position={[cx, NIVEL_VEREDA, cz]}>
      <mesh position={[0, 0.35, 0]} material={r.piedra} castShadow receiveShadow>
        <cylinderGeometry args={[4.2, 4.4, 0.7, 48, 1, true]} />
      </mesh>
      <mesh position={[0, 0.66, 0]} material={r.piedra}>
        <torusGeometry args={[4.3, 0.18, 8, 48]} />
      </mesh>
      <mesh position={[0, 0.1 + 0.45 * flujo, 0]} rotation={[-Math.PI / 2, 0, 0]} material={flujo > 0.05 ? r.agua : r.seco}>
        <circleGeometry args={[4.15, 48]} />
      </mesh>
      <mesh position={[0, 1.2, 0]} material={r.piedra} castShadow>
        <cylinderGeometry args={[0.35, 0.5, 2.4, 20]} />
      </mesh>
      <mesh position={[0, 2.45, 0]} material={r.piedra}>
        <cylinderGeometry args={[1.3, 0.9, 0.3, 28]} />
      </mesh>
      {flujo > 0.02
        ? r.gotas.map((g, i) => {
            const u = (t * g.v * 0.9 + g.fase) % 1;
            const rad = u * 3.4 * g.alto;
            const y = 2.7 + 2.6 * g.alto * flujo * (4 * u * (1 - u)) - u * 0.4;
            return (
              <mesh key={i} material={r.chorro} position={[Math.cos(g.ang) * rad, y, Math.sin(g.ang) * rad]} scale={flujo}>
                <sphereGeometry args={[0.07, 6, 4]} />
              </mesh>
            );
          })
        : null}
      {chicos
        ? [0, 1, 2, 3].map((k) => {
            const a = (k / 4) * Math.PI * 2 + 0.4;
            const salto = Math.max(0, Math.sin(t * 6 + k * 1.7)) * 0.25 * flujo;
            return (
              <Trabajador
                key={k}
                position={[Math.cos(a) * 5.6, salto, Math.sin(a) * 5.6]}
                rotacion={-a - Math.PI / 2}
                escala={0.62}
                piel={k}
                ropa={ROPAS[k]}
                pose={{ hombroD: [2.6 * flujo + 0.2, 0.2], hombroI: [2.6 * flujo + 0.2, 0.2], codoD: 0.2, codoI: 0.2 }}
              />
            );
          })
        : null}
    </group>
  );
}

export const POS_PUEBLO: Vec3 = [178, 0, CALLE_Z];

/** Pueblo rural al este de la ciudad, con molino y tanque. Sin red de agua salvo `conAgua`. */
export function Pueblo({ frame, conAgua = 0 }: { frame: number; conAgua?: number }) {
  const r = useMemo(() => {
    const t = texturaSuelo();
    t.repeat.set(8, 8);
    const azar = crearAzar(88);
    return {
      campo: m({ color: "#c9b27a" }),
      tierra: m({ color: "#a78a5f" }),
      pared: ["#f2e3c6", "#e9c9a8", "#f6efe4", "#efd2c5"].map((c) => m({ color: c })),
      teja: m({ color: "#b5532f", roughness: 0.7 }),
      metal: m({ color: "#9aa4ad", roughness: 0.4, metalness: 0.7 }),
      oxido: m({ color: "#8c5a3c", roughness: 0.8, metalness: 0.3 }),
      azul: m({ color: "#2c6fb0", roughness: 0.35, metalness: 0.5 }),
      rojo: m({ color: "#d33b2c", roughness: 0.4 }),
      agua: m({ color: "#5bc0eb", emissive: "#1aa3ff", emissiveIntensity: 0.4, roughness: 0.1 }),
      arbol: m({ color: "#6fae5a", flatShading: true }),
      casas: Array.from({ length: 7 }, (_, i) => ({
        x: -22 + i * 7.5 + azar.entre(-1.5, 1.5),
        z: (i % 2 ? -9 : 9) + azar.entre(-2, 2),
        ry: azar.entre(-0.3, 0.3),
        c: i % 4,
      })),
    };
  }, []);
  const giro = frame * 0.08;
  // La red de la ciudad se acerca pero no llega; con agua, el caño se completa.
  const largo = 22 + 30 * conAgua;
  return (
    <group position={POS_PUEBLO}>
      <mesh position={[0, 0.06, 0]} material={r.campo} receiveShadow>
        <boxGeometry args={[110, 0.12, 90]} />
      </mesh>
      <mesh position={[0, 0.13, 0]} material={r.tierra} receiveShadow>
        <boxGeometry args={[110, 0.02, 6]} />
      </mesh>
      {r.casas.map((c, i) => (
        <group key={i} position={[c.x, 0.12, c.z]} rotation={[0, c.ry, 0]}>
          <mesh position={[0, 1.4, 0]} material={r.pared[c.c]} castShadow receiveShadow>
            <boxGeometry args={[5, 2.8, 4.5]} />
          </mesh>
          <mesh position={[0, 2.8, 0]} material={r.teja} castShadow scale={[5.4, 1.3, 4.9]}>
            <coneGeometry args={[0.72, 1, 4, 1]} />
          </mesh>
        </group>
      ))}
      {[[-30, 20], [26, -24], [34, 18], [-8, 26]].map(([x, z], i) => (
        <mesh key={i} position={[x, 2.4, z]} material={r.arbol} castShadow>
          <icosahedronGeometry args={[2.2, 1]} />
        </mesh>
      ))}
      {/* Molino */}
      <group position={[16, 0, 14]}>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => (
          <mesh key={i} position={[a * 0.8, 5, b * 0.8]} rotation={[b * 0.08, 0, -a * 0.08]} material={r.metal}>
            <boxGeometry args={[0.12, 10, 0.12]} />
          </mesh>
        ))}
        <group position={[0, 10.3, 0.4]} rotation={[0, 0, giro]}>
          {Array.from({ length: 12 }, (_, k) => (
            <mesh key={k} rotation={[0, 0, (k / 12) * Math.PI * 2]} position={[0, 0, 0]} material={r.metal}>
              <boxGeometry args={[0.35, 3.2, 0.04]} />
            </mesh>
          ))}
        </group>
        <mesh position={[0, 10.3, -0.8]} material={r.metal}>
          <boxGeometry args={[0.1, 0.8, 2.2]} />
        </mesh>
      </group>
      {/* Tanque australiano */}
      <group position={[24, 0, 6]}>
        <mesh position={[0, 0.8, 0]} material={r.oxido} castShadow>
          <cylinderGeometry args={[4, 4, 1.6, 40, 1, true]} />
        </mesh>
        <mesh position={[0, 0.15 + 1.3 * conAgua, 0]} rotation={[-Math.PI / 2, 0, 0]} material={conAgua > 0.05 ? r.agua : r.tierra}>
          <circleGeometry args={[3.95, 40]} />
        </mesh>
      </group>
      {/* Caño que viene de la ciudad */}
      <mesh position={[-55 + largo / 2, 0.9, -3.6]} rotation={[0, 0, Math.PI / 2]} material={r.azul} castShadow>
        <cylinderGeometry args={[0.75, 0.75, largo, 24]} />
      </mesh>
      {conAgua < 0.99 ? (
        <mesh position={[-55 + largo + 0.25, 0.9, -3.6]} rotation={[0, 0, Math.PI / 2]} material={r.rojo} castShadow>
          <cylinderGeometry args={[0.9, 0.9, 0.5, 24]} />
        </mesh>
      ) : null}
    </group>
  );
}

/** Lluvia alrededor de un punto. `intensidad` 0..1. */
export function Lluvia({ frame, centro, intensidad }: { frame: number; centro: Vec3; intensidad: number }) {
  const r = useMemo(() => {
    const azar = crearAzar(9);
    const n = 1600;
    const malla = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.025, 0.7, 0.025),
      new THREE.MeshBasicMaterial({ color: "#cfe6ff", transparent: true, opacity: 0.45, depthWrite: false }),
      n,
    );
    malla.frustumCulled = false;
    const gotas = Array.from({ length: n }, () => ({ x: azar.entre(-16, 16), z: azar.entre(-16, 16), o: azar.n(), v: azar.entre(0.9, 1.2) }));
    return { malla, gotas };
  }, []);
  const tmp = new THREE.Object3D();
  const alto = 18;
  const visibles = Math.floor(r.gotas.length * clamp01(intensidad));
  r.gotas.forEach((g, i) => {
    const y = alto - (((frame / 30) * 14 * g.v + g.o * alto) % alto);
    tmp.position.set(centro[0] + g.x, centro[1] + y - 3, centro[2] + g.z);
    tmp.rotation.set(0, 0, 0.12);
    tmp.updateMatrix();
    r.malla.setMatrixAt(i, tmp.matrix);
  });
  r.malla.count = visibles;
  r.malla.instanceMatrix.needsUpdate = true;
  return <primitive object={r.malla} />;
}

/** Camión de servicio con faros (madrugada). Avanza sobre la calle según `avance` (metros). */
export function Camion({ posicion, avance = 0, faros = 1 }: { posicion: Vec3; avance?: number; faros?: number }) {
  const r = useMemo(
    () => ({
      blanco: m({ color: "#f4f4f2", roughness: 0.5 }),
      azul: m({ color: "#2c6fb0", roughness: 0.35, metalness: 0.5 }),
      faro: new THREE.MeshBasicMaterial({ color: "#fff3c4", toneMapped: false }),
      baliza: new THREE.MeshBasicMaterial({ color: "#ff9a2a", toneMapped: false }),
    }),
    [],
  );
  return (
    <group position={[posicion[0] + avance, posicion[1], posicion[2]]} rotation={[0, Math.PI / 2, 0]}>
      <mesh material={r.blanco} position={[0, 1.6, -1.2]} castShadow>
        <boxGeometry args={[2.4, 2.4, 4.4]} />
      </mesh>
      <mesh material={r.azul} position={[0, 1.3, 2.4]} castShadow>
        <boxGeometry args={[2.3, 2.0, 2.0]} />
      </mesh>
      {[-0.8, 0.8].map((x) => (
        <mesh key={x} material={r.faro} position={[x, 0.9, 3.42]} scale={faros}>
          <boxGeometry args={[0.4, 0.25, 0.05]} />
        </mesh>
      ))}
      <mesh material={r.baliza} position={[0, 2.4, 2.0]}>
        <boxGeometry args={[1.0, 0.18, 0.28]} />
      </mesh>
      {faros > 0.01 ? <pointLight position={[0, 1.2, 6]} intensity={25 * faros} distance={16} decay={1.6} color="#fff1c8" /> : null}
    </group>
  );
}

/** Trabajador que camina hacia el camión. */
export function Caminante({ frame, desde, hasta, t0, t1 }: { frame: number; desde: Vec3; hasta: Vec3; t0: number; t1: number }) {
  const u = easeInOutCubic(progreso(frame, t0, t1));
  const p: Vec3 = [desde[0] + (hasta[0] - desde[0]) * u, desde[1], desde[2] + (hasta[2] - desde[2]) * u];
  const rot = Math.atan2(hasta[0] - desde[0], hasta[2] - desde[2]);
  return <Trabajador position={p} rotacion={rot} pose={u > 0 && u < 1 ? poseCaminar(frame / 30) : {}} piel={2} />;
}

/** Monedas que caen sobre las casas que "pagan". */
export function MonedasPago({ frame, inicio, casas }: { frame: number; inicio: number; casas: Vec3[] }) {
  const r = useMemo(
    () => ({ oro: m({ color: "#f6c344", metalness: 0.8, roughness: 0.25, emissive: "#a86f00", emissiveIntensity: 0.5 }) }),
    [],
  );
  return (
    <group>
      {casas.map((c, i) => {
        const f = frame - inicio - i * 2;
        if (f < 0) return null;
        const pop = easeOutBack(progreso(f, 0, 10));
        const baja = progreso(f, 16, 34, (t) => t * t);
        if (baja >= 1) return null;
        return (
          <group key={i} position={[c[0], c[1] + 7 - baja * 4, c[2]]} rotation={[Math.PI / 2, 0, f * 0.15]} scale={2.2 * pop * (1 - baja * 0.6)}>
            <mesh material={r.oro}>
              <cylinderGeometry args={[0.5, 0.5, 0.12, 24]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
