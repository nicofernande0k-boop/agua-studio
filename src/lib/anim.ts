/**
 * Utilidades de animación deterministas: todo depende solo del número de
 * fotograma, así cada render produce exactamente las mismas imágenes.
 */

export type Vec3 = [number, number, number];

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t: number) => t * t * t;
export const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Progreso 0..1 entre dos fotogramas, con curva opcional. */
export function progreso(
  frame: number,
  desde: number,
  hasta: number,
  curva: (t: number) => number = (t) => t,
) {
  return curva(clamp01((frame - desde) / (hasta - desde)));
}

/** Clave de cámara: en el fotograma `f`, la cámara está en `pos` mirando a `target`. */
export interface ClaveCamara {
  f: number;
  pos: Vec3;
  target: Vec3;
  fov: number;
}

type Muestra = number[];

/**
 * Interpolación Hermite cúbica con tiempos no uniformes y tangentes monótonas.
 * Da movimiento continuo y sin frenadas entre claves; arranca y termina
 * con velocidad cero para que la toma "respire".
 */
function hermite(tiempos: number[], valores: Muestra[], f: number): Muestra {
  const n = tiempos.length;
  if (f <= tiempos[0]) return valores[0];
  if (f >= tiempos[n - 1]) return valores[n - 1];
  let i = 0;
  while (f > tiempos[i + 1]) i++;
  const t0 = tiempos[i];
  const t1 = tiempos[i + 1];
  const dt = t1 - t0;
  const s = (f - t0) / dt;
  // Tangentes monótonas (Fritsch-Carlson): sin rebotes ni "pasarse de largo"
  // cuando la cámara cambia de dirección bruscamente.
  const pendiente = (k: number, d: number) => (valores[k + 1][d] - valores[k][d]) / (tiempos[k + 1] - tiempos[k]);
  const tangente = (k: number, d: number) => {
    if (k === 0 || k === n - 1) return 0;
    const a = pendiente(k - 1, d);
    const b = pendiente(k, d);
    if (a * b <= 0) return 0;
    return (2 * a * b) / (a + b);
  };
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1;
  const h10 = s ** 3 - 2 * s ** 2 + s;
  const h01 = -2 * s ** 3 + 3 * s ** 2;
  const h11 = s ** 3 - s ** 2;
  return valores[i].map(
    (p0, d) =>
      h00 * p0 +
      h10 * dt * tangente(i, d) +
      h01 * valores[i + 1][d] +
      h11 * dt * tangente(i + 1, d),
  );
}

export function muestrearCamara(claves: ClaveCamara[], f: number) {
  const tiempos = claves.map((k) => k.f);
  const v = hermite(
    tiempos,
    claves.map((k) => [...k.pos, ...k.target, k.fov]),
    f,
  );
  return {
    pos: [v[0], v[1], v[2]] as Vec3,
    target: [v[3], v[4], v[5]] as Vec3,
    fov: v[6],
  };
}

/** Generador pseudoaleatorio con semilla (mulberry32). */
export function crearAzar(semilla: number) {
  let a = semilla >>> 0;
  const siguiente = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    n: siguiente,
    entre: (min: number, max: number) => min + (max - min) * siguiente(),
    entero: (min: number, max: number) => Math.floor(min + (max - min + 1) * siguiente()),
    elegir: <T,>(lista: readonly T[]) => lista[Math.floor(siguiente() * lista.length)],
  };
}
