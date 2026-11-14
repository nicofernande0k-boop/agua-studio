import { lerp, progreso } from "../../../lib/anim";
import { CASA_QUIETA } from "../../../three/Casa";
import { POS_TORRE, Planta } from "../../../three/Edificios";
import { Caminante, Camion, Fuente, Lluvia } from "../../../three/Narrada";
import { PLANTA } from "../../../three/RedAgua";
import { RED_LLENA, brilloPorAgua } from "../../agua001/comun";
import { Operador, Zanja } from "../../agua001/escenas/Escena5";
import { AMANECER, DORADO, LLUVIA, MADRUGADA } from "../cielos";
import { K, Tomas, VistaCiudad, s } from "../comun";

/**
 * Acto 6 (1:16–1:39,9) — los trabajadores que hacen posible el agua.
 * Gota → red · madrugada · lluvia · planta día y noche · el agua recorre la
 * ciudad · la vida cotidiana del barrio.
 */

const [tx, , tz] = POS_TORRE;
const X_PLANTA = PLANTA.x - 12;

const GotaARed: React.FC = () => (
  <VistaCiudad
    estado={(f) => ({
      camara: [
        K(0, [tx - 10, 6, tz + 12], [tx, 2.5, tz], 44),
        K(1.6, [tx - 3, 1.8, tz + 5], [tx - 1, -2.4, tz - 6], 48),
        K(2.9, [20, 7, 22], [10, -2, 13], 46),
        K(4.9, [-2, 13, 24], [-30, -2, 13], 44),
      ],
      cielo: DORADO,
      casa: CASA_QUIETA,
      rayosX: progreso(f, s(0.6), s(1.6)),
      red: { frente: RED_LLENA, brillo: 1.3 },
    })}
    extras={(f) => <Fuente frame={f} flujo={1} />}
  />
);

const Madrugada: React.FC = () => (
  <VistaCiudad
    sinEspeciales
    estado={() => ({
      camara: [K(0, [-122, 3.0, 15.2], [-140, 1.4, 10.6], 46), K(2.4, [-120, 3.4, 15.6], [-134, 1.4, 10.6], 46)],
      cielo: MADRUGADA,
      oscuridad: 0.75,
      brillo: () => 0.45,
      casa: CASA_QUIETA,
      red: null,
    })}
    extras={(f) => (
      <>
        <Camion posicion={[-146, 0, 10.7]} avance={lerp(0, 14, progreso(f, s(0.6), s(2.4)))} faros={1} />
        <Caminante frame={f} desde={[-133, 0.15, 7.4]} hasta={[-133, 0.15, 9.4]} t0={0} t1={s(1.4)} />
        <pointLight position={[-128, 6, 8]} color="#ffcf8a" intensity={14} distance={16} decay={1.6} />
      </>
    )}
  />
);

const BajoLaLluvia: React.FC = () => (
  <VistaCiudad
    sinEspeciales
    estado={() => ({
      camara: [K(0, [-97.2, 5.9, 9.2], [-100, -2.9, 13.7], 46), K(2.2, [-98.6, 5.0, 10.4], [-100, -2.9, 13.7], 44)],
      cielo: LLUVIA,
      oscuridad: 0.35,
      casa: CASA_QUIETA,
      rayosX: 1,
      red: { frente: 40, brillo: 1.3 },
    })}
    extras={(f) => (
      <>
        <Zanja frame={f + s(6.5)} />
        <Lluvia frame={f} centro={[-100, 0, 13]} intensidad={1} />
      </>
    )}
  />
);

const PlantaDiaYNoche: React.FC = () => (
  <VistaCiudad
    sinEspeciales
    estado={(f) => ({
      camara: [K(0, [-128, 18, 44], [-162, 2, 8], 42), K(3.7, [-152, 22, 48], [-170, 2, 6], 42)],
      cielo: AMANECER,
      oscuridad: 0.85 * progreso(f, s(0.4), s(3.2)),
      casa: CASA_QUIETA,
      red: null,
    })}
    extras={(f) => (
      <>
        <Planta frame={f * 4} x={X_PLANTA} z={PLANTA.z} actividad={1} />
        <Operador frame={f + s(5.0)} />
        <pointLight position={[X_PLANTA + 10, 9, PLANTA.z + 8]} color="#ffe0a8" intensity={40 * progreso(f, s(1.5), s(2.6))} distance={45} decay={1.4} />
      </>
    )}
  />
);

const AguaRecorre: React.FC = () => (
  <VistaCiudad
    estado={(f) => {
      const frente = lerp(0, RED_LLENA, progreso(f, s(0.1), s(4.4), (t) => t * (0.6 + 0.4 * t)));
      return {
        camara: [K(0, [-118, 42, 62], [-140, 0, 13], 44), K(4.6, [-40, 64, 94], [0, 0, 0], 44)],
        cielo: AMANECER,
        oscuridad: 0.5 * (1 - progreso(f, 0, s(4.6))),
        casa: CASA_QUIETA,
        rayosX: 1,
        brillo: brilloPorAgua(frente),
        red: { frente, brillo: 1.4 },
      };
    }}
  />
);

const VidaCotidiana: React.FC = () => (
  <VistaCiudad
    estado={() => ({
      camara: [K(0, [-32, 5.5, 15.4], [-8, 2, 8], 44), K(3.6, [8, 6, 15.4], [22, 3, 6], 44), K(6.1, [2, 24, 46], [6, 2, 0], 44)],
      cielo: DORADO,
      casa: CASA_QUIETA,
      red: { frente: RED_LLENA },
    })}
    extras={(f) => (
      <>
        <Camion posicion={[-46, 0, 10.7]} avance={lerp(0, 60, progreso(f, 0, s(6.1)))} faros={0} />
        <Fuente frame={f} flujo={1} />
      </>
    )}
  />
);

export const Acto6: React.FC = () => (
  <Tomas
    tomas={[
      { dur: 4.9, componente: GotaARed },
      { dur: 2.4, componente: Madrugada },
      { dur: 2.2, componente: BajoLaLluvia },
      { dur: 3.7, componente: PlantaDiaYNoche },
      { dur: 4.6, componente: AguaRecorre },
      { dur: 6.1, componente: VidaCotidiana },
    ]}
  />
);
