import { useMemo } from "react";
import { crearAzar, easeInOutCubic, lerp, progreso, type Vec3 } from "../../lib/anim";
import { HiloRojo, Toma3D, type Luz } from "../Escena";
import { Multitud, manoDerecha, manoIzquierda, type Persona } from "../Multitud";
import { Caja, CasaDanada, Comedor, Monolitos, Mural } from "../Sets";
import { U, useCamara, useDuracion } from "./comun";

/**
 * Acto III — La memoria colectiva. Entra la luz cálida.
 */

const CALIDA = "#ffcf8f";

/** «Sin embargo, hay algo que todavía permanece.» — una ventana encendida en la noche. */
export const Ventana: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([U(0, [0, 6, 30], [0, 8, 0], 30), U(1, [0, 8.5, 12], [0, 8.8, 0], 26)]);
  return (
    <Toma3D
      camara={camara}
      ambiente={() => ({ niebla: [20, 70], relleno: 0.04 })}
      luces={() => [{ pos: [0, 9, 3], apunta: [0, 8.5, 0], intensidad: 30, angulo: 0.5, penumbra: 0.9, color: CALIDA, sombra: false }]}
    >
      {(f) => {
        const calor = progreso(f, n * 0.35, n);
        return (
          <>
            <Monolitos semilla={23} ancho={40} fondo={30} encendidas={0} calor={calor * 0.35} />
            <mesh position={[0, 8, -0.2]}>
              <boxGeometry args={[9, 16, 0.3]} />
              <meshStandardMaterial color="#141416" roughness={0.9} />
            </mesh>
            <mesh position={[0, 8.6, 0]}>
              <boxGeometry args={[1.3, 1.7, 0.05]} />
              <meshBasicMaterial color="#ffc777" toneMapped={false} />
            </mesh>
            <pointLight position={[0, 8.6, 1]} color={CALIDA} intensity={6} distance={6} />
          </>
        );
      }}
    </Toma3D>
  );
};

/** «Está en el vecino que ayuda cuando una familia lo pierde todo.» — cadena de manos. */
export const Vecinos: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([U(0, [6, 2.2, 7], [0, 1.0, 0], 34), U(1, [3, 1.6, 6.2], [-1, 1.1, 0.5], 32)]);
  const cadena = useMemo(() => Array.from({ length: 6 }, (_, i) => [-2.2 + i * 1.05, 0, 1.2 + Math.sin(i) * 0.25] as Vec3), []);
  return (
    <Toma3D
      camara={camara}
      ambiente={() => ({ niebla: [12, 40], relleno: 0.12, colorRelleno: "#c9a27e" })}
      luces={() => [
        { pos: [6, 8, 6], apunta: [0, 0, 0], intensidad: 120, angulo: 0.45, penumbra: 0.7, color: CALIDA, cono: 0.05 },
        { pos: [-6, 6, -2], apunta: [0, 1, 0], intensidad: 40, angulo: 0.5, penumbra: 0.8, color: "#ffe9c9", sombra: false },
      ]}
    >
      {(f) => {
        const t = f / 30;
        const personas: Persona[] = cadena.map((p, i) => {
          const balanceo = Math.sin(t * 3 + i * 1.2);
          return { p, rumbo: i % 2 ? Math.PI / 2 + 0.3 : -Math.PI / 2 - 0.3, manoD: 0.7 + 0.2 * balanceo, manoI: 0.7 - 0.2 * balanceo, codo: 0.4, inclinar: 0.12, tono: (i * 0.37) % 1 };
        });
        // Una caja que viaja de mano en mano.
        const u = ((t * 0.9) % 1) * (cadena.length - 1);
        const k = Math.floor(u);
        const a = cadena[k];
        const b = cadena[k + 1];
        const fr = u - k;
        const caja: Vec3 = [lerp(a[0], b[0], fr), 1.2 + Math.sin(fr * Math.PI) * 0.25, lerp(a[2], b[2], fr)];
        void n;
        return (
          <>
            <group position={[-4.5, 0, -1.5]} rotation={[0, 0.5, 0]}>
              <CasaDanada />
            </group>
            <Multitud personas={personas} />
            <Caja p={caja} />
            <Caja p={[3.6, 0.16, 1.6]} />
            <Caja p={[3.9, 0.48, 1.5]} />
          </>
        );
      }}
    </Toma3D>
  );
};

/** «En quienes se organizan para levantar un comedor.» */
export const ComedorT: React.FC = () => {
  const camara = useCamara([U(0, [-8, 2.4, 3.2], [-2, 1.0, 0], 34), U(1, [5, 1.8, 2.8], [7, 0.9, 0], 34)]);
  const lugares = useMemo(() => {
    const az = crearAzar(5);
    const l: { p: Vec3; rumbo: number; tono: number; escala: number }[] = [];
    for (let x = -5.4; x <= 5.4; x += 1.1) {
      if (az.n() < 0.85) l.push({ p: [x, 0, -0.95], rumbo: 0, tono: az.n(), escala: az.n() < 0.25 ? 0.72 : 1 });
      if (az.n() < 0.85) l.push({ p: [x + 0.4, 0, 0.95], rumbo: Math.PI, tono: az.n(), escala: az.n() < 0.25 ? 0.72 : 1 });
    }
    return l;
  }, []);
  return (
    <Toma3D
      camara={camara}
      ambiente={() => ({ niebla: [10, 32], relleno: 0.1, colorRelleno: "#b58f6a" })}
      luces={() => [{ pos: [0, 10, 3], apunta: [0, 0, 0], intensidad: 70, angulo: 0.6, penumbra: 0.9, color: CALIDA, cono: 0.03 }]}
    >
      {(f) => {
        const t = f / 30;
        const sentados = lugares.map((l, i): Persona => ({ p: l.p, rumbo: l.rumbo, sentado: 0.55, manoD: 0.55 + 0.1 * Math.sin(t * 2 + i), manoI: 0.45, codo: 0.7, cabeza: 0.2, tono: l.tono, escala: l.escala }));
        const mozo: Persona = { p: [lerp(-6.5, 6, ((t * 0.12) % 1)), 0, 1.9], rumbo: Math.PI / 2, paso: 1, fase: t * 5, manoD: 0.7, manoI: 0.7, codo: 0.6, tono: 0.8 };
        return (
          <>
            {[-0.95, 0.95].map((z) => (
              <mesh key={z} position={[0, 0.25, z * 1.0]} receiveShadow castShadow>
                <boxGeometry args={[12, 0.08, 0.35]} />
                <meshStandardMaterial color="#4a3526" roughness={0.7} />
              </mesh>
            ))}
            <Comedor frame={f} />
            <Multitud personas={[...sentados, mozo]} />
          </>
        );
      }}
    </Toma3D>
  );
};

/** «En los trabajadores que acompañan a un compañero.» — lo ayudan a levantarse. */
export const Companeros: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([U(0, [3.5, 1.0, 4.5], [0, 0.9, 0], 32), U(1, [2.2, 1.6, 4.2], [0, 1.2, 0], 30)]);
  return (
    <Toma3D
      camara={camara}
      ambiente={() => ({ niebla: [10, 35], relleno: 0.08, colorRelleno: "#b58f6a" })}
      luces={() => [{ pos: [2, 8, 4], apunta: [0, 0.5, 0], intensidad: 120, angulo: 0.32, penumbra: 0.6, color: CALIDA, cono: 0.07 }]}
    >
      {(f) => {
        const sube = progreso(f, n * 0.2, n * 0.75, easeInOutCubic);
        const caido: Persona = { p: [0, 0, 0], rumbo: 0.2, sentado: 1 - sube, cabeza: lerp(0.6, 0, sube), manoD: lerp(0.6, 0.2, sube), manoI: lerp(0.6, 0.2, sube), codo: 0.2, tono: 0.3 };
        const a: Persona = { p: [-0.7, 0, 0.35], rumbo: Math.PI / 2 + 0.4, manoD: 0.75, manoI: 0.4, codo: 0.2, inclinar: lerp(0.45, 0.1, sube), tono: 0.7 };
        const b: Persona = { p: [0.75, 0, 0.3], rumbo: -Math.PI / 2 - 0.4, manoI: 0.75, manoD: 0.4, codo: 0.2, inclinar: lerp(0.45, 0.1, sube), tono: 0.55 };
        return <Multitud personas={[caido, a, b]} />;
      }}
    </Toma3D>
  );
};

/** «En los jóvenes que deciden involucrarse…» — pintan un mural. */
export const Jovenes: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([U(0, [-4, 1.8, 6], [0, 2, -2], 34), U(1, [3.5, 2.2, 6.5], [0, 2.2, -2], 34)]);
  return (
    <Toma3D
      camara={camara}
      ambiente={() => ({ niebla: [10, 40], relleno: 0.12, colorRelleno: "#c9a27e" })}
      luces={() => [{ pos: [0, 9, 6], apunta: [0, 2, -2], intensidad: 120, angulo: 0.5, penumbra: 0.7, color: "#ffe6c0", cono: 0.04 }]}
    >
      {(f) => {
        const t = f / 30;
        const pinta = progreso(f, n * 0.05, n * 0.95);
        const jovenes = [-3, -1, 1, 3].map((x, i): Persona => ({ p: [x, 0, -1.2], rumbo: Math.PI, manoD: 0.9 + 0.12 * Math.sin(t * 5 + i), codo: 0.1 + 0.1 * Math.sin(t * 5 + i), escala: 0.9, tono: 0.2 + i * 0.2 }));
        return (
          <>
            <Mural pinta={pinta} />
            <Multitud personas={jovenes} />
          </>
        );
      }}
    </Toma3D>
  );
};

/** «En cada persona que entiende que la vida del otro también importa.» — el hilo rojo vuelve. */
export const Ronda: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([U(0, [0, 1.6, 6.5], [0, 1.2, 0], 34), U(1, [0, 9, 5], [0, 0.8, 0], 38)]);
  const angulos = useMemo(() => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2), []);
  return (
    <Toma3D
      camara={camara}
      ambiente={() => ({ niebla: [10, 35], relleno: 0.08, colorRelleno: "#b58f6a" })}
      luces={(): Luz[] => [{ pos: [0, 10, 1], apunta: [0, 0, 0], intensidad: 160, angulo: 0.4, penumbra: 0.7, color: CALIDA, cono: 0.06 }]}
    >
      {(f) => {
        const ronda = angulos.map((a, i): Persona => ({ p: [Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4], rumbo: -a - Math.PI / 2, manoD: 0.4, manoI: 0.4, codo: 0.05, tono: (i * 0.29) % 1 }));
        const manos: Vec3[] = [];
        ronda.forEach((p) => {
          manos.push(manoIzquierda(p), manoDerecha(p));
        });
        manos.push(manos[0]);
        return (
          <>
            <Multitud personas={ronda} />
            <HiloRojo puntos={manos} crece={progreso(f, n * 0.1, n * 0.85)} grosor={0.022} />
          </>
        );
      }}
    </Toma3D>
  );
};

/** «Porque la solidaridad no desapareció. Sigue estando ahí. Esperando…» — la ciudad se enciende. */
export const Encuentro: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([U(0, [0, 1.6, 12], [0, 2.4, -6], 34), U(1, [0, 1.3, 6], [0, 1.3, 0], 32)]);
  return (
    <Toma3D
      camara={camara}
      ambiente={() => ({ niebla: [14, 70], relleno: 0.08, colorRelleno: "#b58f6a" })}
      luces={() => [{ pos: [0, 10, 2], apunta: [0, 0, 0], intensidad: 120, angulo: 0.35, penumbra: 0.6, color: CALIDA, cono: 0.06 }]}
    >
      {(f) => {
        const t = f / 30;
        const acerca = progreso(f, 0, n * 0.8, easeInOutCubic);
        const a: Persona = { p: [lerp(-4.5, -0.55, acerca), 0, 0], rumbo: Math.PI / 2, paso: acerca < 1 ? 1 : 0, fase: t * 5, manoD: 0.6 * progreso(f, n * 0.6, n * 0.85), codo: 0.05 };
        const b: Persona = { p: [lerp(4.5, 0.55, acerca), 0, 0], rumbo: -Math.PI / 2, paso: acerca < 1 ? 1 : 0, fase: t * 5 + 1, manoD: 0.6 * progreso(f, n * 0.6, n * 0.85), codo: 0.05 };
        const ma = manoDerecha(a);
        const mb = manoDerecha(b);
        return (
          <>
            <Monolitos semilla={23} ancho={50} fondo={40} encendidas={0.05} calor={progreso(f, 0, n) * 0.6} />
            <Multitud personas={[a, b]} />
            {acerca > 0.95 ? <HiloRojo puntos={[ma, [(ma[0] + mb[0]) / 2, ma[1] - 0.12, ma[2]], mb]} crece={progreso(f, n * 0.82, n * 0.95)} /> : null}
          </>
        );
      }}
    </Toma3D>
  );
};
