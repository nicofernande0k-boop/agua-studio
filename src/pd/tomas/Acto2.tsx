import { useMemo } from "react";
import * as THREE from "three";
import { crearAzar, easeInOutCubic, lerp, progreso, type Vec3 } from "../../lib/anim";
import { Lluvia } from "../../three/Narrada";
import { ROJO, Toma3D } from "../Escena";
import { Multitud, type Persona } from "../Multitud";
import { Escalera, Grieta, Monolitos, cimaEscalera } from "../Sets";
import { U, useCamara, useDuracion } from "./comun";
import { caminantes } from "./Acto1";

/**
 * Acto II — Lo que perdimos. Lluvia, distancia, un piso que se parte.
 */

/** «Cada uno tiene lo que merece… ayudar al otro es perder el tiempo… la solidaridad es una debilidad.» */
export const Lluvioso: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([U(0, [-5, 1.4, 7], [1.5, 1.0, -1], 32), U(1, [-1.5, 1.1, 3.6], [2.4, 0.8, -1.4], 30)]);
  return (
    <Toma3D
      camara={camara}
      ambiente={() => ({ niebla: [8, 40], relleno: 0.1, colorRelleno: "#7f93ab", piso: "#09090a" })}
      luces={() => [
        { pos: [3, 7, 1], apunta: [2.6, 0, -1.4], intensidad: 150, angulo: 0.3, penumbra: 0.6, color: "#cfdbe8", cono: 0.07 },
        { pos: [-4, 5, -6], apunta: [-2, 0, -4], intensidad: 40, angulo: 0.5, penumbra: 0.8, color: ROJO, sombra: false, cono: 0.03 },
      ]}
    >
      {(f) => {
        const t = f / 30;
        const mano = progreso(f, n * 0.62, n * 0.78, easeInOutCubic);
        const sentado: Persona = { p: [2.6, 0, -1.6], rumbo: -0.25, sentado: 1, cabeza: lerp(0.7, -0.2, mano), manoD: 0.3 + 0.7 * mano, codo: 0.9 - 0.8 * mano, manoI: 0.3, tono: 0.35 };
        return (
          <>
            <Monolitos semilla={12} ancho={50} fondo={60} encendidas={0.06} />
            <mesh position={[2.6, 2, -2.4]} receiveShadow>
              <boxGeometry args={[10, 4, 0.3]} />
              <meshStandardMaterial color="#1c1c1e" roughness={0.9} />
            </mesh>
            <Multitud personas={[sentado, ...caminantes(14, 18, [-6, 1.2, -18, 8], t, 1.4)]} />
            <Lluvia frame={f} centro={[0, 0, 0]} intensidad={1} />
          </>
        );
      }}
    </Toma3D>
  );
};

/** «…empezamos a perder aquello que nos hacía fuertes.» — dos personas y un piso que se abre. */
export const Grietas: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([U(0, [0, 1.3, 7.5], [0, 1.2, 0], 30), U(1, [5, 4.5, 8], [0, 0.6, 0], 34)]);
  return (
    <Toma3D
      camara={camara}
      ambiente={() => ({ niebla: [10, 40], relleno: 0.06, sinPiso: true })}
      luces={() => [
        { pos: [-2.5, 9, 1], apunta: [-1.4, 0, 0], intensidad: 110, angulo: 0.28, penumbra: 0.5, color: "#ede6da", cono: 0.06 },
        { pos: [2.5, 9, 1], apunta: [1.4, 0, 0], intensidad: 110, angulo: 0.28, penumbra: 0.5, color: "#ede6da", cono: 0.06 },
      ]}
    >
      {(f) => {
        const ab = lerp(0, 2.6, progreso(f, n * 0.15, n * 0.85, easeInOutCubic));
        const tiende = 1 - progreso(f, n * 0.55, n * 0.9);
        const a: Persona = { p: [-0.75 - ab / 2, 0, 0], rumbo: Math.PI / 2, manoD: 0.85 * tiende, codo: 0.05, cabeza: 0.1 };
        const b: Persona = { p: [0.75 + ab / 2, 0, 0], rumbo: -Math.PI / 2, manoD: 0.85 * tiende, codo: 0.05, cabeza: 0.1 };
        return (
          <>
            <Grieta apertura={ab} />
            <Multitud personas={[a, b]} />
          </>
        );
      }}
    </Toma3D>
  );
};

/** «La capacidad de encontrarnos. De organizarnos. De tender una mano…» — un recuerdo cálido que se desvanece. */
export const Recuerdo: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([U(0, [0, 2.4, 7], [0, 1.0, 0], 34), U(1, [0, 3.6, 9.5], [0, 0.8, 0], 36)]);
  const fantasma = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffe2b6", emissive: "#ffb46a", emissiveIntensity: 0.35, roughness: 0.6, transparent: true, opacity: 1, depthWrite: false }),
    [],
  );
  const ronda = useMemo(() => Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2), []);
  return (
    <Toma3D
      camara={camara}
      ambiente={() => ({ niebla: [8, 30], relleno: 0.05 })}
      luces={(f) => [{ pos: [0, 9, 1], apunta: [0, 0, 0], intensidad: lerp(150, 60, progreso(f, n * 0.5, n)), angulo: 0.42, penumbra: 0.7, color: "#ffd9a8", cono: 0.06 }]}
    >
      {(f) => {
        fantasma.opacity = 1 - progreso(f, n * 0.45, n * 0.95);
        fantasma.visible = fantasma.opacity > 0.01;
        return (
          <>
            <Multitud
              material={fantasma}
              sombras={false}
              personas={ronda.map((a, i): Persona => ({ p: [Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2], rumbo: -a - Math.PI / 2, manoD: 0.35, manoI: 0.35, codo: 0.05, cabeza: -0.05, tono: (i % 3) / 3 }))}
            />
            <Multitud personas={[{ p: [0, 0, 0], rumbo: 0.2, cabeza: 0.5, tono: 0.3 }]} />
          </>
        );
      }}
    </Toma3D>
  );
};

/** «Porque ninguna sociedad se construyó solamente con personas intentando llegar primero.» */
export const Cima: React.FC = () => {
  const n = useDuracion();
  const cima = cimaEscalera();
  const camara = useCamara([U(0, [7, 3, 6], [0, 4, -8], 38), U(0.6, [5, 10, 4], [0, 9, -18], 38), U(1, [10, 26, 22], [0, 9, -22], 40)]);
  const trepadores = useMemo(() => {
    const az = crearAzar(77);
    return Array.from({ length: 34 }, () => ({ x: az.entre(-4, 4), s0: az.entre(0, 18), v: az.entre(2.2, 3.4), tono: az.n() }));
  }, []);
  return (
    <Toma3D
      camara={camara}
      ambiente={() => ({ niebla: [12, 60], relleno: 0.06 })}
      luces={(f) => [
        { pos: [cima[0], cima[1] + 9, cima[2] + 1], apunta: cima, intensidad: 180, angulo: 0.18, penumbra: 0.4, color: "#f4ece0", cono: 0.1 },
        { pos: [0, 16, 6], apunta: [0, 4, -8], intensidad: 60 * (1 - progreso(f, n * 0.55, n * 0.85)), angulo: 0.6, penumbra: 0.8, color: "#c9d4e2", sombra: false },
      ]}
    >
      {(f) => {
        const t = f / 30;
        const llega = progreso(f, n * 0.45, n * 0.6);
        const ganador: Persona = { p: [cima[0], cima[1] - 0.6 + 0.6 * llega, cima[2]], rumbo: Math.PI * 0.95, cabeza: -0.1 };
        const resto = trepadores.map((g): Persona => {
          const s = Math.min(24, g.s0 + g.v * t * 0.45);
          const i = Math.floor(s);
          return { p: [g.x, 0.5 * (i + 1), -i * 1.1 - 0.4] as Vec3, rumbo: Math.PI, paso: 1, fase: t * 6 + g.s0, inclinar: 0.25, tono: g.tono };
        });
        return (
          <>
            <Escalera />
            <Multitud personas={[ganador, ...resto]} />
          </>
        );
      }}
    </Toma3D>
  );
};
