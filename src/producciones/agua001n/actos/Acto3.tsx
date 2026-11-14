import { AbsoluteFill, useCurrentFrame } from "remotion";
import { progreso } from "../../../lib/anim";
import { Fundido, TituloEscena } from "../../../ui/Superposiciones";
import { FPS, K, s } from "../comun";
import { VistaMapa } from "../VistaMapa";

/**
 * Acto 3 (0:24,5–0:52) — años 90, privatizaciones, promesas y la pregunta.
 * «en distintos lugares del país»: los símbolos de empresas aparecen solo en
 * algunas ciudades. Las promesas son carteles que giran y muestran «?».
 */

export const CAMARA_A3 = [
  K(0, [0, 150, 62], [0, 0, 2], 40),
  K(3.5, [24, 52, 52], [15, 0, 14], 42),
  K(7.5, [10, 96, 66], [2, 0, 2], 40),
  K(11.0, [-6, 58, 34], [-2, 0, -12], 42),
  K(14.0, [-10, 34, -12], [-6, 0, -28], 44),
  K(16.6, [-16, 30, 4], [-12, 0, -12], 44),
  K(18.6, [2, 30, 14], [2, 7, -20], 46),
  K(23.0, [3, 28, 11], [2, 7, -20], 46),
  K(27.5, [3, 40, 30], [2, 5, -20], 48),
];

export const Acto3: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <VistaMapa
        camara={CAMARA_A3}
        estado={(f) => ({
          ciudades: progreso(f, s(0.2), s(3.0)),
          lineaTiempo: progreso(f, s(0.3), s(4.0)),
          contratos: progreso(f, s(8.0), s(11.2)),
          empresas: progreso(f, s(11.8), s(15.6)),
          tension: 0,
          promesas: progreso(f, s(17.0), s(24.0)),
          pregunta: progreso(f, s(24.4), s(26.6)),
        })}
      />
      <Fundido color="#eef5fa" opacidad={1 - progreso(frame, 0, s(0.5))} />
      <TituloEscena frame={frame - s(0.4)} fps={FPS} numero={2} titulo="ARGENTINA, AÑOS 90" dura={2.6} />
    </AbsoluteFill>
  );
};
