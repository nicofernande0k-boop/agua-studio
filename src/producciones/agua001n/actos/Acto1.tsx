import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CASA_QUIETA } from "../../../three/Casa";
import { TituloEscena } from "../../../ui/Superposiciones";
import { RED_LLENA } from "../../agua001/comun";
import { AMANECER } from "../cielos";
import { FPS, K, VistaCiudad, s } from "../comun";

/**
 * Acto 1 (0:00–0:11,6) — «Imaginate que mañana te despertás, caminás hasta la
 * cocina, abrís la canilla y no sale una sola gota de agua.»
 * Amanecer → techo → cocina → la canilla se abre (6,1 s) → una gota (9,7 s) →
 * silencio sobre el pico seco.
 */

export const CAMARA_A1 = [
  K(0, [-70, 92, 108], [0, 0, -4], 32),
  K(2.2, [-36, 30, 46], [-4, 2, 8], 36),
  K(3.6, [-8, 9, 14], [2.5, 2.5, -0.5], 42),
  K(4.6, [2.4, 7.2, 2.8], [2.9, 1.2, -0.6], 46),
  K(5.4, [2.6, 2.9, 1.5], [3.0, 1.3, -1.2], 50),
  K(6.0, [2.8, 2.05, 0.9], [3.05, 1.38, -1.2], 44),
  K(7.6, [2.95, 1.82, 0.25], [3.05, 1.42, -1.15], 40),
  K(9.6, [3.0, 1.64, -0.4], [3.05, 1.45, -1.12], 34),
  K(11.6, [3.04, 1.57, -0.7], [3.05, 1.47, -1.14], 30),
];

export const Acto1: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <VistaCiudad
        estado={() => ({
          camara: CAMARA_A1,
          cielo: AMANECER,
          casa: { ...CASA_QUIETA, techoDesvanece: [s(3.9), s(4.9)] },
          cocina: { abre: [s(6.15), s(6.6)], gota: [s(8.2), s(9.95)] },
          red: { frente: RED_LLENA },
        })}
      />
      <TituloEscena frame={frame - s(0.2)} fps={FPS} numero={1} titulo="¿Y SI MAÑANA NO TENÉS AGUA?" dura={2.2} grande />
    </AbsoluteFill>
  );
};
