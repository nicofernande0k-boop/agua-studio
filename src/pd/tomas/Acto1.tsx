import { useMemo } from "react";
import { clamp01, crearAzar, easeInOutCubic, lerp, progreso, type Vec3 } from "../../lib/anim";
import { HiloRojo, Toma3D, type Luz } from "../Escena";
import { Multitud, manoDerecha, manoIzquierda, type Persona } from "../Multitud";
import { Anden, Monolitos } from "../Sets";
import { U, useCamara, useDuracion } from "./comun";

/**
 * Acto I — El individualismo. Luz fría, espacios enormes, personas que no se miran.
 */

const FRIO = "#d6dfeb";

/** Caminantes en línea recta cruzándose sin mirarse. */
export function caminantes(semilla: number, cantidad: number, zona: [number, number, number, number], t: number, velocidad = 1.25): Persona[] {
  const az = crearAzar(semilla);
  const [x0, x1, z0, z1] = zona;
  return Array.from({ length: cantidad }, () => {
    const rumbo = az.elegir([0, Math.PI, Math.PI / 2, -Math.PI / 2, 0.3, Math.PI + 0.3]) + az.entre(-0.15, 0.15);
    const v = velocidad * az.entre(0.8, 1.2);
    const ancho = x1 - x0;
    const largo = z1 - z0;
    const sx = az.entre(x0, x1);
    const sz = az.entre(z0, z1);
    const d = v * t;
    let x = sx + Math.sin(rumbo) * d;
    let z = sz + Math.cos(rumbo) * d;
    x = ((((x - x0) % ancho) + ancho) % ancho) + x0;
    z = ((((z - z0) % largo) + largo) % largo) + z0;
    return { p: [x, 0, z] as Vec3, rumbo, paso: 1, fase: (t * 5.6 * v) / 1.25 + az.entre(0, 6), cabeza: az.entre(0.15, 0.45), tono: az.n() };
  });
}

/** «Nos dijeron que teníamos que salvarnos solos.» */
export const Solos: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([
    U(0, [0.6, 1.5, 3.2], [0, 1.4, 0], 30),
    U(0.45, [1.5, 3.2, 8], [0, 1.2, 0], 34),
    U(1, [6, 16, 26], [0, 0, -4], 38),
  ]);
  const gente = useMemo(() => {
    const az = crearAzar(21);
    const lista: { p: Vec3; rumbo: number; tono: number; cabeza: number }[] = [{ p: [0, 0, 0], rumbo: 0.3, tono: 0.5, cabeza: 0.35 }];
    for (let i = 0; i < 26; i++) {
      const a = az.entre(0, Math.PI * 2);
      const r = az.entre(5, 22);
      lista.push({ p: [Math.cos(a) * r, 0, Math.sin(a) * r - 4], rumbo: az.entre(0, 6.28), tono: az.n(), cabeza: az.entre(0.1, 0.5) });
    }
    return lista;
  }, []);
  return (
    <Toma3D
      camara={camara}
      ambiente={() => ({ niebla: [10, 55], relleno: 0.05 })}
      luces={(f) =>
        gente.map((g, i): Luz => {
          const enciende = progreso(f, n * (0.35 + i * 0.012), n * (0.4 + i * 0.012));
          return {
            pos: [g.p[0], 9, g.p[2] + 0.5],
            apunta: [g.p[0], 0, g.p[2]],
            intensidad: i === 0 ? 140 : 120 * enciende,
            angulo: 0.22,
            penumbra: 0.35,
            sombra: i === 0,
            cono: i === 0 ? 0.09 : 0.07 * enciende,
            color: "#f4ece0",
          };
        })
      }
    >
      {(f) => <Multitud personas={gente.map((g): Persona => ({ p: g.p, rumbo: g.rumbo + Math.sin(f * 0.01 + g.tono) * 0.05, cabeza: g.cabeza, tono: g.tono }))} />}
    </Toma3D>
  );
};

/** «Que el problema del otro no era nuestro problema. Que si alguien se quedaba atrás…» */
export const Ciudad: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([
    U(0, [0, 1.7, 12], [0, 1.5, -10], 34),
    U(0.55, [0.4, 1.5, 4], [0.6, 1.2, -6], 36),
    U(1, [1.6, 0.75, 1.2], [3.2, 0.7, -1.4], 40),
  ]);
  const sentado: Persona = { p: [3.4, 0, -1.6], rumbo: -0.9, sentado: 1, cabeza: 0.7, manoD: 0.25, manoI: 0.25, codo: 0.9, tono: 0.4 };
  return (
    <Toma3D
      camara={camara}
      ambiente={() => ({ niebla: [14, 70], relleno: 0.12, colorRelleno: "#8fa3ba" })}
      luces={() => [
        { pos: [0, 14, 4], apunta: [0, 0, -4], intensidad: 160, angulo: 0.5, penumbra: 0.7, color: FRIO, cono: 0.04 },
        { pos: [4, 7, -1], apunta: [3.4, 0, -1.6], intensidad: 70, angulo: 0.28, penumbra: 0.5, color: "#e9e2d6", cono: 0.06, sombra: false },
        { pos: [-6, 9, -16], apunta: [-2, 0, -14], intensidad: 90, angulo: 0.4, penumbra: 0.7, color: FRIO, sombra: false },
      ]}
    >
      {(f) => {
        const t = f / 30;
        const gente = caminantes(5, 46, [-5, 5, -30, 10], t);
        const aparece = progreso(f, n * 0.45, n * 0.55);
        return (
          <>
            <Monolitos semilla={7} ancho={60} fondo={80} />
            <Multitud personas={aparece > 0 ? [...gente, { ...sentado, tono: 0.4 }] : gente} />
          </>
        );
      }}
    </Toma3D>
  );
};

/** «Nos enseñaron a competir. A desconfiar. A mirar al de al lado como un rival.» */
export const Subte: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([U(0, [-9, 2.2, 4.6], [6, 2.0, 1.2], 30), U(0.7, [-3, 2.1, 4.4], [8, 2.0, 1.2], 30), U(1, [-0.6, 2.1, 4.2], [1.8, 2.05, 1.4], 28)]);
  const gente = useMemo(() => {
    const az = crearAzar(9);
    return Array.from({ length: 9 }, (_, i) => ({ p: [-14 + i * 3.6 + az.entre(-0.6, 0.6), 1, 1.6 + az.entre(-0.5, 0.6)] as Vec3, tono: az.n() }));
  }, []);
  return (
    <Toma3D
      camara={camara}
      ambiente={() => ({ niebla: [12, 50], relleno: 0.1, colorRelleno: "#8fa3ba" })}
      luces={(f) => {
        const tren = progreso(f, n * 0.15, n * 0.6);
        const parpadeo = tren > 0 && tren < 1 ? 0.6 + 0.4 * Math.sin(f * 2.1) : 1;
        return [-24, -12, 0, 12, 24].map((x): Luz => ({ pos: [x, 7, 1.5], apunta: [x, 1, 1.5], intensidad: 70 * parpadeo, angulo: 0.5, penumbra: 0.8, color: "#dfe6ee", cono: 0.03, sombra: x === 0 }));
      }}
    >
      {(f) => {
        const giro = progreso(f, n * 0.74, n * 0.86, easeInOutCubic);
        return (
          <>
            <Anden tren={progreso(f, n * 0.15, n * 0.6)} />
            <Multitud
              personas={gente.map((g, i): Persona => {
                // Los dos del centro se miran de reojo al final.
                const mira = i === 4 ? -0.9 * giro : i === 5 ? 0.9 * giro : 0;
                return { p: g.p, rumbo: mira, cabeza: 0.15, tono: g.tono };
              })}
            />
          </>
        );
      }}
    </Toma3D>
  );
};

/** «Y casi sin darnos cuenta, empezamos a olvidarnos de algo.» — se dispersan y el hilo se corta. */
export const Olvidar: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([U(0, [0.1, 9, 3], [0, 0.8, 0], 36), U(1, [0.1, 26, 6], [0, 0, 0], 40)]);
  const gente = useMemo(() => {
    const az = crearAzar(31);
    return Array.from({ length: 70 }, (_, i) => {
      const a = az.entre(0, Math.PI * 2);
      return { a, r0: 1.2 + Math.sqrt(i) * 0.45, v: az.entre(0.8, 1.5), tono: az.n() };
    });
  }, []);
  return (
    <Toma3D
      camara={camara}
      temblor={0.5}
      ambiente={() => ({ niebla: [14, 45], relleno: 0.06 })}
      luces={() => [{ pos: [0, 18, 2], apunta: [0, 0, 0], intensidad: 260, angulo: 0.42, penumbra: 0.75, color: "#f1ebe1", cono: 0.05 }]}
    >
      {(f) => {
        const t = f / 30;
        const sale = progreso(f, n * 0.2, n);
        const corte = progreso(f, n * 0.38, n * 0.42);
        const a: Persona = { p: [-0.55 - sale * 2.5, 0, 0], rumbo: Math.PI / 2 - sale * 1.2, manoD: 0.55 * (1 - corte), codo: 0.1, paso: sale > 0 ? 1 : 0, fase: t * 5 };
        const b: Persona = { p: [0.55 + sale * 2.5, 0, 0], rumbo: -Math.PI / 2 + sale * 1.2, manoI: 0.55 * (1 - corte), codo: 0.1, paso: sale > 0 ? 1 : 0, fase: t * 5 + 1 };
        const resto = gente.map((g): Persona => {
          const r = g.r0 + sale * g.v * 9;
          return { p: [Math.cos(g.a) * r, 0, Math.sin(g.a) * r], rumbo: Math.atan2(Math.cos(g.a), Math.sin(g.a)), paso: sale > 0.02 ? 1 : 0, fase: t * 5 * g.v, cabeza: 0.3, tono: g.tono };
        });
        const ma = manoDerecha(a);
        const mb = manoIzquierda(b);
        const medio: Vec3 = [(ma[0] + mb[0]) / 2, Math.min(ma[1], mb[1]) - 0.15, (ma[2] + mb[2]) / 2];
        const cae = clamp01(progreso(f, n * 0.42, n * 0.7));
        return (
          <>
            <Multitud personas={[a, b, ...resto]} />
            {corte < 1 ? (
              <HiloRojo puntos={[ma, medio, mb]} />
            ) : (
              <>
                <HiloRojo puntos={[ma, [ma[0] + 0.15, lerp(ma[1] - 0.2, 0.02, cae), ma[2]], [ma[0] + 0.4, lerp(ma[1] - 0.5, 0.01, cae), ma[2] + 0.1]]} />
                <HiloRojo puntos={[mb, [mb[0] - 0.15, lerp(mb[1] - 0.2, 0.02, cae), mb[2]], [mb[0] - 0.4, lerp(mb[1] - 0.5, 0.01, cae), mb[2] - 0.1]]} />
              </>
            )}
          </>
        );
      }}
    </Toma3D>
  );
};
