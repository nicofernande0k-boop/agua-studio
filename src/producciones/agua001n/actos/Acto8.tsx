import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeInOutCubic, lerp, progreso } from "../../../lib/anim";
import { CASA_QUIETA } from "../../../three/Casa";
import { Fuente } from "../../../three/Narrada";
import { RED_LLENA } from "../../agua001/comun";
import { LucesYGota } from "../../agua001/escenas/Escena6";
import { DORADO } from "../cielos";
import { K, VistaCiudad, s } from "../comun";

/**
 * Acto 8 (2:06,6–2:31,5) — «…El agua es un derecho esencial… Porque el agua
 * es vida. El agua es soberanía y la vida de un pueblo no está en venta.
 * El agua no se vende.»
 * Plaza al atardecer → la red se ilumina → líneas de luz → la gota gigante →
 * el fondo se oscurece para el cierre (que se dibuja en la composición).
 */

export const CAMARA_A8 = [
  K(0, [16, 3.2, 44], [33, 3, 29.5], 44),
  K(3.8, [-6, 30, 46], [4, 4, 4], 44),
  K(7.5, [-30, 80, 110], [0, 18, -4], 42),
  K(11.0, [-30, 92, 120], [0, 30, -4], 42),
  K(14.5, [-16, 76, 58], [0, 64, -4], 40),
  K(18.6, [-6, 72, 34], [0, 68, -4], 40),
  K(24.9, [-4, 71.5, 29], [0, 68, -4], 40),
];

export const Acto8: React.FC = () => {
  const frame = useCurrentFrame();
  const oscuro = progreso(frame, s(18.9), s(19.8), easeInOutCubic);
  return (
    <AbsoluteFill>
      <VistaCiudad
        estado={(f) => {
          const luz = progreso(f, s(4.5), s(9.0), easeInOutCubic);
          return {
            camara: CAMARA_A8,
            cielo: DORADO,
            casa: CASA_QUIETA,
            rayosX: progreso(f, s(3.4), s(5.0)),
            oscuridad: lerp(0, 0.65, progreso(f, s(4.0), s(10.0))) + 0.3 * progreso(f, s(14.0), s(19.0)),
            red: { frente: RED_LLENA, brillo: lerp(1.3, 3.4, luz), vidrio: lerp(0.3, 0.55, luz) },
          };
        }}
        extras={(f) => (
          <>
            <Fuente frame={f} flujo={1} />
            <LucesYGota frame={f} tiempos={{ arcos: s(5.0), particulas: s(11.0), ventana: s(4.5), gota: [s(13.4), s(16.6)] }} />
          </>
        )}
      />
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          opacity: oscuro,
          background: "radial-gradient(ellipse 60% 34% at 50% 66%, rgba(6,16,28,0.15) 0%, rgba(6,16,28,0.88) 70%, rgba(6,16,28,0.97) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
