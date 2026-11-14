import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeInOutCubic, lerp, progreso, type ClaveCamara } from "../../../lib/anim";
import { Escenario, fundidoSuelo, calcularCamara, type EstadoEscenario } from "../../../three/Escenario";
import { Escuela, Hospital, POS_ESCUELA, POS_HOSPITAL } from "../../../three/Edificios";
import { CASA_QUIETA } from "../../../three/Casa";
import { distanciaRed } from "../../../three/RedAgua";
import { Fundido, TituloEscena } from "../../../ui/Superposiciones";
import { CONEXIONES, FPS, Lienzo, OPCIONES, RED_LLENA, brilloPorAgua, s } from "../comun";
import { CAMARA_E1 } from "./Escena1";

/**
 * Escena 2 — Una ciudad sin agua (12,5 s)
 * Atraviesa el piso, el agua corre por los caños y empieza a retirarse;
 * la cámara sube a una vista con rayos X: la red une casas, hospital y
 * escuela, el agua desaparece y la ciudad se apaga.
 */

const ultima = CAMARA_E1[CAMARA_E1.length - 1];

export const CAMARA_E2: ClaveCamara[] = [
  { f: 0, pos: ultima.pos, target: ultima.target, fov: ultima.fov },
  { f: s(0.5), pos: [2.3, 1.1, -3.6], target: [2.35, -1.6, -3.9], fov: 46 },
  { f: s(1.0), pos: [2.3, -1.1, -3.3], target: [2.2, -2.0, 4], fov: 52 },
  { f: s(2.3), pos: [-1.5, -1.2, 1.5], target: [3, -2.2, 10], fov: 52 },
  { f: s(3.3), pos: [-5, -1.5, 10.2], target: [4, -2.2, 13], fov: 55 },
  { f: s(4.3), pos: [-4, 3.2, 15.5], target: [14, -1, 8], fov: 50 },
  { f: s(5.6), pos: [12, 22, 38], target: [31, 0, 3], fov: 44 },
  { f: s(7.1), pos: [-12, 24, 40], target: [-31, 0, 3], fov: 44 },
  { f: s(10.0), pos: [-22, 78, 88], target: [0, 0, -5], fov: 40 },
  { f: s(12.5), pos: [-26, 92, 100], target: [0, 0, -6], fov: 40 },
];

/** Avance del agua: llena hasta 2 s, después se retira desde las puntas. */
export const frenteE2 = (f: number) => lerp(RED_LLENA, 0, progreso(f, s(2.0), s(11.2), (t) => t * (0.6 + 0.4 * t)));

export function estadoE2(frame: number): EstadoEscenario {
  const y = calcularCamara(CAMARA_E2, frame).pos[1];
  const arriba = frame > s(3.5) && y >= 0;
  const frente = frenteE2(frame);
  return {
    camara: CAMARA_E2,
    // El techo sigue abierto mientras la cámara está en la casa; bajo tierra se repone.
    casa: frame < s(1.2) ? { ...CASA_QUIETA, techoDesvanece: [-2, -1] } : CASA_QUIETA,
    rayosX: arriba ? 1 : 0,
    oscuridad: 0.8 * progreso(frame, s(6.5), s(12), easeInOutCubic),
    brillo: brilloPorAgua(frente),
    red: { frente },
    manometro: [s(2.4), s(3.6)],
  };
}

export const Escena2: React.FC = () => {
  const frame = useCurrentFrame();
  const estado = estadoE2(frame);
  const y = calcularCamara(CAMARA_E2, frame).pos[1];
  const frente = frenteE2(frame);
  const b = (p: number[]) => Math.max(0.2, Math.min(1, 1 - (distanciaRed(p[0], 13) - frente) / 45));
  return (
    <AbsoluteFill>
      <Lienzo>
        <Escenario frame={frame} fps={FPS} estado={estado} opciones={OPCIONES} conexiones={CONEXIONES}>
          {() => (
            <>
              <Hospital brillo={b(POS_HOSPITAL)} />
              <Escuela frame={frame} brillo={b(POS_ESCUELA)} />
            </>
          )}
        </Escenario>
      </Lienzo>
      <Fundido color="#140d08" opacidad={fundidoSuelo(y)} />
      <TituloEscena frame={frame - s(4.4)} fps={FPS} numero={2} titulo="UNA CIUDAD SIN AGUA" dura={2.6} />
    </AbsoluteFill>
  );
};
