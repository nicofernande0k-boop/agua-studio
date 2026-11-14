import type { ClaveCamara, Vec3 } from "../lib/anim";

/**
 * Medidas y guion de tiempos de la demo «¿Y si mañana no tenés agua?».
 * Unidad: 1 = 1 metro. La casa protagonista está centrada en el origen y su
 * frente mira hacia +z (la calle).
 */

export const FPS = 30;
export const DURACION = 8 * FPS; // 240 fotogramas
export const ANCHO = 1080;
export const ALTO = 1920;

/** Altura del piso interior de la casa. */
export const PISO = 0.3;
/** Altura de las paredes (arranque del techo). */
export const ALTURA_PARED = 3.0;

/** Baño: rectángulo interior. */
export const BANO = { x0: 0.9, x1: 3.8, z0: -4.8, z1: -1.6 };
/** Centro de la bacha, contra la pared del fondo del baño. */
export const BACHA: Vec3 = [2.35, PISO, BANO.z0];

/** Calle frente a la casa y caño maestro debajo. */
export const CALLE_Z = 13;
export const CANO_MAESTRO: { y: number; z: number; radio: number } = {
  y: -2.4,
  z: CALLE_Z,
  radio: 0.42,
};
/** Techo de la "cámara" subterránea (corte de suelo). */
export const SUELO_TECHO = -0.12;

/** Momentos clave (en fotogramas). */
export const T = {
  techoDesvanece: [80, 100] as const,
  abreCanilla: [134, 150] as const,
  gota: [151, 172] as const,
    bajoTierra: [180, 190] as const,
  manometro: [194, 228] as const,
  titulo: [200, 240] as const,
};

/**
 * Recorrido de cámara: picado aéreo → techo → baño → canilla → piso →
 * cañerías. Los valores se interpolan con curvas suaves (ver anim.ts).
 */
export const CAMARA: ClaveCamara[] = [
  { f: 0, pos: [-58, 74, 80], target: [0, 0, -6], fov: 32 },
  { f: 44, pos: [-24, 36, 42], target: [0.5, 0, -2.5], fov: 34 },
  { f: 78, pos: [-6.5, 14, 13.5], target: [1.8, 2, -2.6], fov: 38 },
  { f: 98, pos: [1.7, 7.0, -0.6], target: [2.35, 1.4, -3.4], fov: 44 },
  { f: 114, pos: [2.3, 3.0, -1.9], target: [2.35, 1.2, -4.6], fov: 50 },
  { f: 128, pos: [2.32, 1.78, -2.6], target: [2.35, 1.22, -4.7], fov: 44 },
  { f: 142, pos: [2.27, 1.58, -3.55], target: [2.35, 1.27, -4.6], fov: 40 },
  { f: 168, pos: [2.3, 1.5, -3.86], target: [2.35, 1.25, -4.6], fov: 38 },
  { f: 178, pos: [2.3, 1.1, -3.6], target: [2.35, -1.6, -3.9], fov: 46 },
  { f: 190, pos: [2.3, -1.1, -3.3], target: [2.2, -2.0, 4], fov: 52 },
  { f: 212, pos: [-2.8, -0.9, -1.6], target: [1.8, -2.1, 7.5], fov: 52 },
  { f: 240, pos: [-9.5, -0.7, -0.2], target: [1.2, -2.2, 8.5], fov: 50 },
];
