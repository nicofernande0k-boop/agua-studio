import { useVideoConfig } from "remotion";
import type { ClaveCamara, Vec3 } from "../../lib/anim";

/** Clave de cámara en tiempo normalizado (0..1 de la duración de la toma). */
export const U = (u: number, pos: Vec3, target: Vec3, fov = 35) => ({ u, pos, target, fov });

export function useCamara(claves: ReturnType<typeof U>[]): ClaveCamara[] {
  const { durationInFrames } = useVideoConfig();
  return claves.map((k) => ({ f: Math.round(k.u * (durationInFrames - 1)), pos: k.pos, target: k.target, fov: k.fov }));
}

/** Duración de la toma en fotogramas (la define la composición según la voz). */
export function useDuracion() {
  return useVideoConfig().durationInFrames;
}
