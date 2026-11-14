import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { ClaveCamara } from "../../../lib/anim";
import { Escenario, fundidoSuelo, calcularCamara, type EstadoEscenario } from "../../../three/Escenario";
import { Escuela, Hospital } from "../../../three/Edificios";
import { Fundido, TituloEscena } from "../../../ui/Superposiciones";
import { CONEXIONES, FPS, Lienzo, OPCIONES, RED_LLENA, s } from "../comun";

/**
 * Escena 1 — ¿Y si mañana no tenés agua? (12 s)
 * Picado sobre la ciudad → recorrido por una calle → techo → baño →
 * la canilla se abre y no sale agua → primer plano del pico.
 */

export const CAMARA_E1: ClaveCamara[] = [
  { f: 0, pos: [-70, 92, 108], target: [0, 0, -4], fov: 32 },
  { f: s(2.5), pos: [-42, 32, 50], target: [-8, 2, 11], fov: 36 },
  { f: s(4.0), pos: [-24, 6.5, 15.5], target: [-2, 3.2, 8], fov: 42 },
  { f: s(5.0), pos: [-7, 7.6, 14.5], target: [1.5, 3, 2], fov: 42 },
  { f: s(5.7), pos: [1.0, 8.0, 3.6], target: [2.3, 1.5, -2.8], fov: 44 },
  { f: s(6.2), pos: [2.3, 3.0, -1.9], target: [2.35, 1.2, -4.6], fov: 50 },
  { f: s(6.7), pos: [2.32, 1.8, -2.4], target: [2.35, 1.22, -4.7], fov: 44 },
  { f: s(7.4), pos: [2.27, 1.58, -3.55], target: [2.35, 1.27, -4.6], fov: 40 },
  { f: s(8.7), pos: [2.3, 1.48, -3.9], target: [2.35, 1.25, -4.6], fov: 38 },
  { f: s(11.0), pos: [2.36, 1.37, -4.25], target: [2.35, 1.3, -4.56], fov: 30 },
  { f: s(12.0), pos: [2.36, 1.35, -4.31], target: [2.35, 1.3, -4.56], fov: 30 },
];

export const TIEMPOS_CASA_E1 = {
  techoDesvanece: [s(5.0), s(5.75)] as const,
  abreCanilla: [s(6.6), s(7.2)] as const,
  gota: [s(7.4), s(8.4)] as const,
};

export function estadoE1(): EstadoEscenario {
  return {
    camara: CAMARA_E1,
    casa: TIEMPOS_CASA_E1,
    red: { frente: RED_LLENA },
  };
}

export const Escena1: React.FC = () => {
  const frame = useCurrentFrame();
  const estado = estadoE1();
  const y = calcularCamara(CAMARA_E1, frame).pos[1];
  return (
    <AbsoluteFill>
      <Lienzo>
        <Escenario frame={frame} fps={FPS} estado={estado} opciones={OPCIONES} conexiones={CONEXIONES}>
          {() => (
            <>
              <Hospital />
              <Escuela frame={frame} />
            </>
          )}
        </Escenario>
      </Lienzo>
      <Fundido color="#140d08" opacidad={fundidoSuelo(y)} />
      <TituloEscena frame={frame - s(0.3)} fps={FPS} numero={1} titulo="¿Y SI MAÑANA NO TENÉS AGUA?" dura={3.1} grande />
    </AbsoluteFill>
  );
};
