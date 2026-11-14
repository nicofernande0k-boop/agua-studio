import { ThreeCanvas } from "@remotion/three";
import { useEffect, useState } from "react";
import { continueRender, delayRender, useVideoConfig } from "remotion";
import tiempos from "../../../producciones/001-agua/tiempos.json";
import { CONEXIONES_ESPECIALES, OPCIONES_CIUDAD_001 } from "../../three/Edificios";
import { DISTANCIA_MAXIMA, distanciaRed } from "../../three/RedAgua";

/**
 * Piezas compartidas por las seis escenas de «¿Y si mañana no tenés agua?».
 */

export const TIEMPOS = tiempos;
export const FPS = tiempos.fps;
/** Segundos → fotogramas. */
export const s = (seg: number) => Math.round(seg * FPS);

export const OPCIONES = OPCIONES_CIUDAD_001;
export const CONEXIONES = CONEXIONES_ESPECIALES;
export const RED_LLENA = DISTANCIA_MAXIMA;

/** Brillo de un edificio según si el agua ya llegó (o todavía está) en su zona. */
export function brilloPorAgua(frente: number, minimo = 0.15) {
  return (x: number, z: number) => {
    const falta = distanciaRed(x, z) - frente;
    const t = Math.min(1, Math.max(0, 1 - falta / 45));
    return minimo + (1 - minimo) * t;
  };
}

/** Espera a que Inter esté cargada antes de dibujar carteles 3D con texto. */
export function useFuentesListas() {
  const [listo, setListo] = useState(false);
  const [espera] = useState(() => delayRender("Cargando fuentes"));
  useEffect(() => {
    Promise.all([document.fonts.load("800 64px Inter"), document.fonts.load("600 64px Inter")])
      .catch(() => undefined)
      .then(() => {
        setListo(true);
        continueRender(espera);
      });
  }, [espera]);
  return listo;
}

/** Lienzo 3D vertical con sombras, igual al de la demo. */
export const Lienzo: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ fov: 40, near: 0.05, far: 900, position: [0, 50, 50] }}
    >
      {children}
    </ThreeCanvas>
  );
};
