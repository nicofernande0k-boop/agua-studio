import { CASA_QUIETA } from "../../../three/Casa";
import { datosCiudad } from "../../../three/Ciudad";
import { POS_TORRE, TorreCorporativa } from "../../../three/Edificios";
import { MonedasPago } from "../../../three/Narrada";
import { FlujoDinero } from "../../../three/Simbolos";
import { easeInOutCubic, progreso, type Vec3 } from "../../../lib/anim";
import { OPCIONES, RED_LLENA } from "../../agua001/comun";
import { AMANECER } from "../cielos";
import { K, VistaCiudad, azarPos, calcularY, s } from "../comun";
import { CAMARA_A1 } from "./Acto1";

/**
 * Acto 2 (0:11,6–0:24,5) — «Ahora imaginá que eso no es un accidente, que
 * tener agua en tu casa depende de cuánto podés pagar y que algo tan esencial
 * para vivir se convierte en un negocio.»
 * Bajo el piso → red con rayos X → solo las casas que «pagan» reciben agua →
 * emerge la torre corporativa y el dinero viaja hacia ella.
 */

const u = CAMARA_A1[CAMARA_A1.length - 1];

export const CAMARA_A2 = [
  { ...u, f: 0 },
  K(0.5, [3.0, 1.3, -0.5], [3.0, -1.5, -0.9], 44),
  K(1.1, [3.0, -1.1, -0.4], [2.6, -2.0, 6], 52),
  K(2.2, [-1, -1.3, 8], [6, -2.3, 13], 54),
  K(3.3, [-4, 4.5, 17], [8, -1, 8], 48),
  K(5.0, [-30, 30, 50], [-4, 0, 4], 42),
  K(8.0, [-24, 40, 68], [10, 4, 10], 42),
  K(10.6, [-42, 52, 114], [14, 30, 20], 44),
  K(12.9, [-46, 56, 120], [16, 36, 20], 44),
];

/** Las casas que "pagan": la mitad, elegidas por posición. */
export const paga = (x: number, z: number) => azarPos(x, z) < 0.5;

export const Acto2: React.FC = () => {
  const casas: Vec3[] = datosCiudad(OPCIONES)
    .lotes.filter((l) => l.tipo === "casa" && Math.hypot(l.x + 6, l.z) < 42 && paga(l.x, l.z))
    .slice(0, 16)
    .map((l) => [l.x, 3.5, l.z]);
  const origenes: Vec3[] = casas.slice(0, 14);
  return (
    <VistaCiudad
      estado={(f) => {
        const y = calcularY(CAMARA_A2, f);
        const corte = progreso(f, s(5.2), s(7.0), easeInOutCubic);
        return {
          camara: CAMARA_A2,
          cielo: AMANECER,
          casa: f < s(1.2) ? { ...CASA_QUIETA, techoDesvanece: [-2, -1] } : CASA_QUIETA,
          cocina: { abre: [-2, -1], gota: [1e9, 1e9 + 1] },
          rayosX: f > s(2.4) && y >= 0 ? 1 - progreso(f, s(8.6), s(10.0)) : 0,
          brillo: (x, z) => (paga(x, z) ? 1 : 1 - 0.75 * corte),
          conexion: (x, z) => (paga(x, z) ? 1 : 1 - corte),
          red: { frente: RED_LLENA, brillo: 1.2 },
        };
      }}
      extras={(f) => (
        <>
          <MonedasPago frame={f} inicio={s(4.0)} casas={casas} />
          <TorreCorporativa frame={f} p={progreso(f, s(8.2), s(10.4))} />
          <FlujoDinero frame={f} inicio={s(9.6)} origenes={origenes} destino={[POS_TORRE[0], 46, POS_TORRE[2]]} />
        </>
      )}
    />
  );
};
