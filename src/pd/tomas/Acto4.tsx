import { useMemo } from "react";
import { crearAzar, easeInOutCubic, easeOutCubic, lerp, progreso, type Vec3 } from "../../lib/anim";
import { HiloRojo, Toma3D, type Luz } from "../Escena";
import { Multitud, manoDerecha, type Persona } from "../Multitud";
import { Pista, Viga } from "../Sets";
import { U, useCamara, useDuracion } from "./comun";

/**
 * Acto IV — El futuro. Luz dorada que crece, trabajo colectivo y la palabra NOSOTROS.
 */

const DORADA = "#ffe3b0";

/** «Tal vez nos hicieron creer que el futuro era una carrera individual…» */
export const Carrera: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([U(0, [6, 1.3, 2], [-2, 1.1, -10], 34), U(1, [5, 2.2, -10], [-1, 0.8, -16], 34)]);
  const corredores = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ x: (i - 3) * 1.4, v: 6 + (i % 3) * 0.6, tono: (i * 0.31) % 1 })), []);
  return (
    <Toma3D
      camara={camara}
      ambiente={() => ({ niebla: [14, 60], relleno: 0.12, colorRelleno: "#c9b08e" })}
      luces={() => [{ pos: [4, 14, -6], apunta: [0, 0, -14], intensidad: 160, angulo: 0.55, penumbra: 0.8, color: DORADA, cono: 0.04 }]}
    >
      {(f) => {
        const t = f / 30;
        const frenan = progreso(f, n * 0.5, n * 0.75, easeOutCubic);
        const caidoZ = -16;
        const lista = corredores.map((c, i): Persona => {
          if (i === 4) return { p: [c.x, 0, caidoZ], rumbo: Math.PI, sentado: 1, cabeza: 0.5, manoI: 0.4, codo: 0.4, tono: c.tono };
          const avance = c.v * Math.min(t, n / 30 * 0.5) + c.v * (1 - frenan) * Math.max(0, t - (n / 30) * 0.5) * 0.6;
          const z = 6 - avance;
          const vuelve = i === 3 ? progreso(f, n * 0.55, n * 0.8, easeInOutCubic) : 0;
          return { p: [lerp(c.x, -0.4 + corredores[4].x, vuelve), 0, z], rumbo: Math.PI + vuelve * Math.PI * 0.75, paso: 1 - frenan * 0.85, fase: t * 9, inclinar: 0.18 * (1 - frenan), manoD: vuelve * 0.6, tono: c.tono };
        });
        return (
          <>
            <Pista />
            <Multitud personas={lista} />
          </>
        );
      }}
    </Toma3D>
  );
};

/** «Pero una patria no es una competencia. Una patria es una construcción colectiva.» */
export const Construir: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([U(0, [0, 0.6, 9], [0, 2.2, 0], 36), U(1, [3, 1.2, 10.5], [0, 2.6, 0], 40)]);
  const gente = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ x: -6 + i * 1.1, z: i % 2 ? 0.35 : -0.35, tono: (i * 0.23) % 1 })), []);
  return (
    <Toma3D
      camara={camara}
      ambiente={(f) => ({ niebla: [14, 50], relleno: lerp(0.08, 0.3, progreso(f, 0, n)), colorRelleno: "#d9b98a" })}
      luces={(f): Luz[] => [
        { pos: [0, 12, -6], apunta: [0, 0, 0], intensidad: lerp(60, 220, progreso(f, 0, n)), angulo: 0.6, penumbra: 0.8, color: DORADA, cono: 0.06 },
        { pos: [6, 4, 8], apunta: [0, 1.5, 0], intensidad: 40, angulo: 0.6, penumbra: 0.9, color: "#ffd59a", sombra: false },
      ]}
    >
      {(f) => {
        const sube = progreso(f, n * 0.1, n * 0.85, easeInOutCubic);
        const alto = lerp(1.05, 2.25, sube);
        return (
          <>
            <Viga alto={alto} />
            <Multitud
              personas={gente.map((g): Persona => ({ p: [g.x, 0, g.z], rumbo: g.z > 0 ? Math.PI : 0, manoD: lerp(0.55, 1.05, sube), manoI: lerp(0.55, 1.05, sube), codo: lerp(0.8, 0.15, sube), cabeza: -0.25 * sube, inclinar: lerp(0.15, -0.05, sube), tono: g.tono }))}
            />
          </>
        );
      }}
    </Toma3D>
  );
};

/** «…si aprende a mirar para otro lado cuando alguien necesita ayuda.» — la multitud se da vuelta. */
export const Mirar: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([U(0, [0, 1.0, -2], [0, 1.4, 12], 36), U(1, [0, 1.3, 0.5], [0, 1.0, 10], 34)]);
  const gente = useMemo(() => {
    const az = crearAzar(61);
    return Array.from({ length: 40 }, () => ({ x: az.entre(-7, 7), z: az.entre(3, 16), tono: az.n(), d: az.entre(0, 0.25) }));
  }, []);
  return (
    <Toma3D
      camara={camara}
      ambiente={() => ({ niebla: [10, 45], relleno: 0.1, colorRelleno: "#c9b08e", entorno: 0.05 })}
      luces={() => [
        { pos: [0, 9, 1], apunta: [0, 0, 0], intensidad: 140, angulo: 0.3, penumbra: 0.6, color: DORADA, cono: 0.07 },
        { pos: [0, 14, 12], apunta: [0, 0, 10], intensidad: 45, angulo: 0.6, penumbra: 0.9, color: "#f2e6d2", sombra: false },
      ]}
    >
      {(f) => {
        const t = f / 30;
        const arrodillado: Persona = { p: [0, 0, 0], rumbo: 0, sentado: 0.85, cabeza: 0.4, manoD: 0.5, codo: 0.3, tono: 0.3 };
        const gira = (d: number) => progreso(f, n * (0.2 + d), n * (0.45 + d), easeInOutCubic);
        const vienen = progreso(f, n * 0.55, n, easeInOutCubic);
        const multitud = gente.map((g): Persona => {
          const k = gira(g.d);
          const z = lerp(g.z, g.z * 0.55 + 1.5, vienen);
          return { p: [lerp(g.x, g.x * 0.6, vienen), 0, z], rumbo: lerp(0, Math.PI, k), paso: vienen > 0.02 && vienen < 0.98 ? 1 : 0, fase: t * 5 + g.tono * 6, tono: g.tono };
        });
        return <Multitud personas={[arrodillado, ...multitud]} />;
      }}
    </Toma3D>
  );
};

/** Posiciones que dibujan la palabra NOSOTROS (muestreo de la tipografía en un lienzo). */
function puntosPalabra(lineas: string[], paso = 10, escala = 0.05): Vec3[] {
  const W = 700;
  const H = 520;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#fff";
  g.font = "400 220px Anton, Impact, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  lineas.forEach((l, i) => g.fillText(l, W / 2, H / 2 + (i - (lineas.length - 1) / 2) * 235));
  const d = g.getImageData(0, 0, W, H).data;
  const pts: Vec3[] = [];
  for (let y = 0; y < H; y += paso) {
    for (let x = 0; x < W; x += paso) {
      if (d[(y * W + x) * 4] > 128) pts.push([(x - W / 2) * escala, 0, (y - H / 2) * escala]);
    }
  }
  return pts;
}

/** «Porque el destino del otro… También es el nuestro.» — se levantan juntos; desde arriba, NOSOTROS. */
export const Nosotros: React.FC = () => {
  const n = useDuracion();
  const camara = useCamara([
    U(0, [1.6, 1.0, 3.2], [0, 1.0, 0], 32),
    U(0.35, [1.8, 2.4, 5], [0, 1.1, 0], 34),
    U(0.7, [0.2, 34, 14], [0, 0, 0], 40),
    U(1, [0.05, 62, 4], [0, 0, 0], 40),
  ]);
  const r = useMemo(() => {
    const pts = puntosPalabra(["NOS", "OTROS"]);
    const az = crearAzar(88);
    const gente = pts.map((p) => ({ p, rumbo: az.entre(-0.3, 0.3), tono: az.n(), aparece: az.entre(0.3, 0.6) }));
    // Hilos que unen vecinos cercanos.
    const hilos: [Vec3, Vec3][] = [];
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i][0] - pts[j][0];
        const dz = pts[i][2] - pts[j][2];
        if (dx * dx + dz * dz < 0.3 && az.n() < 0.35) hilos.push([pts[i], pts[j]]);
      }
    }
    return { gente, hilos };
  }, []);
  return (
    <Toma3D
      camara={camara}
      temblor={0.6}
      ambiente={(f) => ({ niebla: [20, 90], relleno: lerp(0.1, 0.35, progreso(f, n * 0.3, n)), colorRelleno: "#d9b98a" })}
      luces={(f): Luz[] => [
        { pos: [0.5, 8, 2], apunta: [0, 0, 0], intensidad: 150 * (1 - progreso(f, n * 0.45, n * 0.7)), angulo: 0.3, penumbra: 0.6, color: DORADA, cono: 0.07 },
        { pos: [0, 70, 12], apunta: [0, 0, 0], intensidad: 2600 * progreso(f, n * 0.35, n * 0.7), angulo: 0.32, penumbra: 0.9, color: DORADA, sombra: true },
      ]}
    >
      {(f) => {
        const sube = progreso(f, n * 0.08, n * 0.38, easeInOutCubic);
        const ayudado: Persona = { p: [0.45, 0, 0], rumbo: -Math.PI / 2, sentado: 1 - sube, cabeza: lerp(0.5, 0, sube), manoD: lerp(0.8, 0.3, sube), codo: 0.1, tono: 0.3 };
        const ayuda: Persona = { p: [-0.45, 0, 0], rumbo: Math.PI / 2, manoD: lerp(0.75, 0.35, sube), codo: 0.05, inclinar: lerp(0.45, 0.05, sube), tono: 0.7 };
        const multitud = r.gente
          .filter((g) => progreso(f, n * g.aparece, n * (g.aparece + 0.1)) > 0)
          .map((g): Persona => ({ p: g.p, rumbo: g.rumbo, tono: g.tono, escala: 0.95 }));
        const hilos = progreso(f, n * 0.62, n * 0.92);
        return (
          <>
            <Multitud personas={[ayudado, ayuda, ...multitud]} />
            <HiloRojo puntos={[manoDerecha(ayuda), [0, 1.0, 0.05], manoDerecha(ayudado)]} crece={progreso(f, n * 0.05, n * 0.15)} />
            {hilos > 0
              ? r.hilos.map(([a, b], i) => (
                  <HiloRojo key={i} puntos={[[a[0], 1.1, a[2]], [(a[0] + b[0]) / 2, 1.05, (a[2] + b[2]) / 2], [b[0], 1.1, b[2]]]} crece={progreso(hilos, (i / r.hilos.length) * 0.6, (i / r.hilos.length) * 0.6 + 0.4)} grosor={0.03} />
                ))
              : null}
          </>
        );
      }}
    </Toma3D>
  );
};
