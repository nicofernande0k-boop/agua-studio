import { easeInOutCubic, progreso } from "../../../lib/anim";
import { CASA_QUIETA } from "../../../three/Casa";
import { POS_ESCUELA, POS_HOSPITAL, POS_TORRE, TorreCorporativa } from "../../../three/Edificios";
import { Fuente } from "../../../three/Narrada";
import { RED_LLENA } from "../../agua001/comun";
import { DORADO } from "../cielos";
import { K, Tomas, VistaCiudad, s } from "../comun";

/**
 * Acto 5 (1:06,2–1:16) — «no es un lujo, no es un privilegio, no es una
 * mercancía cualquiera. El agua es salud, es dignidad, es vida.»
 * La torre se hunde → hospital que se ilumina → escuela → la fuente vuelve a brotar.
 */

const [tx, , tz] = POS_TORRE;
const base = { cielo: DORADO, casa: CASA_QUIETA, red: { frente: RED_LLENA } };

const TorreSeHunde: React.FC = () => (
  <VistaCiudad
    estado={() => ({ ...base, camara: [K(0, [-34, 46, 96], [28, 24, 26], 44), K(5.4, [-8, 24, 66], [tx, 6, tz], 44)] })}
    extras={(f) => (
      <>
        <TorreCorporativa frame={f} p={1 - progreso(f, s(1.2), s(4.8), easeInOutCubic)} />
        <Fuente frame={f} flujo={0} chicos={false} />
      </>
    )}
  />
);

const Salud: React.FC = () => (
  <VistaCiudad
    estado={() => ({ ...base, camara: [K(0, [14, 12, 32], [POS_HOSPITAL[0], 7, 4], 44), K(1.5, [17, 13, 29], [POS_HOSPITAL[0], 8, 3], 42)] })}
    brilloHospital={(f) => 0.35 + 0.65 * progreso(f, s(0.2), s(0.9))}
    extras={(f) => <Fuente frame={f} flujo={0} chicos={false} />}
  />
);

const Dignidad: React.FC = () => (
  <VistaCiudad
    estado={() => ({ ...base, camara: [K(0, [-19, 8, 24], [POS_ESCUELA[0] + 4, 6, 6], 44), K(1.3, [-21, 9, 22], [POS_ESCUELA[0] + 5, 7, 6], 42)] })}
  />
);

const Vida: React.FC = () => (
  <VistaCiudad
    estado={() => ({ ...base, camara: [K(0, [tx - 9, 5, tz + 13], [tx, 2.6, tz], 44), K(1.6, [tx - 7, 4.5, tz + 11], [tx, 3, tz], 42)] })}
    extras={(f) => <Fuente frame={f} flujo={progreso(f, s(0.35), s(1.0), easeInOutCubic)} />}
  />
);

export const Acto5: React.FC = () => (
  <Tomas
    tomas={[
      { dur: 5.4, componente: TorreSeHunde },
      { dur: 1.5, componente: Salud },
      { dur: 1.3, componente: Dignidad },
      { dur: 1.6, componente: Vida },
    ]}
  />
);
