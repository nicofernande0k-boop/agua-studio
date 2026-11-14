import { easeInOutCubic, progreso } from "../../../lib/anim";
import { CASA_QUIETA, PICO_COCINA } from "../../../three/Casa";
import { POS_VALVULA, ValvulaGigante } from "../../../three/Edificios";
import { POS_PUEBLO, Pueblo, ROPAS } from "../../../three/Narrada";
import { Trabajador } from "../../../three/Personaje";
import { distanciaRed } from "../../../three/RedAgua";
import { PISO } from "../../../demo/escena";
import { RED_LLENA } from "../../agua001/comun";
import { DORADO } from "../cielos";
import { K, Tomas, VistaCiudad, s } from "../comun";

/**
 * Acto 4 (0:52–1:06,2) — las cuatro preguntas.
 * ¿rentabilidad? → válvula gigante · ¿familias que no pueden pagar? → cocina
 * con la canilla seca · ¿pueblos donde invertir no es rentable? → pueblo sin
 * red · ¿quién garantiza el derecho al agua? → la cámara sube y queda en silencio.
 */

const D_VALVULA = distanciaRed(POS_VALVULA[0], POS_VALVULA[2]);
const [px, , pz] = POS_PUEBLO;

const Valvula: React.FC = () => (
  <VistaCiudad
    estado={(f) => {
      const cierre = progreso(f, s(1.6), s(4.3), easeInOutCubic);
      return {
        camara: [K(0, [6, 26, -10], [16.5, 7, 13], 46), K(4.6, [-4, 36, -26], [17, 3, 14], 48)],
        cielo: DORADO,
        casa: CASA_QUIETA,
        rayosX: 0.75,
        red: { frente: RED_LLENA, valvula: { d: D_VALVULA, cierre } },
        brillo: (x, z) => (distanciaRed(x, z) >= D_VALVULA ? 1 - 0.5 * cierre : 1),
      };
    }}
    extras={(f) => <ValvulaGigante sube={progreso(f, s(0.1), s(1.3))} cierre={progreso(f, s(1.6), s(4.3), easeInOutCubic)} />}
  />
);

const Familia: React.FC = () => (
  <VistaCiudad
    estado={() => ({
      camara: [K(0, [0.9, 2.35, 2.3], [2.8, 1.25, -0.9], 50), K(3.1, [1.2, 2.2, 1.9], [2.85, 1.3, -1.0], 48)],
      cielo: DORADO,
      oscuridad: 0.2,
      casa: { ...CASA_QUIETA, techoDesvanece: [-2, -1] },
      cocina: { abre: [-2, -1], gota: [1e9, 1e9 + 1] },
      red: { frente: RED_LLENA },
    })}
    extras={(f) => {
      const mira = Math.sin(f * 0.05) * 0.1;
      return (
        <>
          <Trabajador
            position={[PICO_COCINA[0] - 0.05, PISO, -0.42]}
            rotacion={Math.PI}
            ropa={ROPAS[0]}
            piel={2}
            herramienta="vaso"
            pose={{ hombroD: [0.95, 0.05], codoD: 0.9, hombroI: [0.15, 0.05], cabeza: [mira, 0.25] }}
          />
          <Trabajador
            position={[PICO_COCINA[0] - 0.6, PISO, -0.25]}
            rotacion={Math.PI - 0.35}
            escala={0.62}
            ropa={ROPAS[3]}
            piel={2}
            pose={{ hombroI: [0.6, 0.1], codoI: 0.4, cabeza: [-0.3, -0.35] }}
          />
        </>
      );
    }}
  />
);

const PuebloSinRed: React.FC = () => (
  <VistaCiudad
    sinEspeciales
    estado={() => ({
      camara: [K(0, [px - 39, 2.6, pz + 3.5], [px - 32, 1.0, pz - 3.6], 48), K(3.6, [px - 40, 5.5, pz + 9], [px - 4, 2.5, pz - 2], 44)],
      cielo: DORADO,
      casa: CASA_QUIETA,
      red: null,
    })}
    extras={(f) => <Pueblo frame={f} conAgua={0} />}
  />
);

const Pregunta: React.FC = () => (
  <VistaCiudad
    sinEspeciales
    estado={() => ({
      camara: [K(0, [px - 14, 18, pz + 34], [px, 2, pz], 44), K(3.0, [px - 30, 72, pz + 100], [60, 0, 0], 44)],
      cielo: DORADO,
      oscuridad: 0.25,
      casa: CASA_QUIETA,
      red: null,
    })}
    extras={(f) => <Pueblo frame={f} conAgua={0} />}
  />
);

export const Acto4: React.FC = () => (
  <Tomas
    tomas={[
      { dur: 4.5, componente: Valvula },
      { dur: 3.1, componente: Familia },
      { dur: 3.6, componente: PuebloSinRed },
      { dur: 3.0, componente: Pregunta },
    ]}
  />
);
