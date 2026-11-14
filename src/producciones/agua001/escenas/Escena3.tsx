import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easeInOutCubic, lerp, progreso, type ClaveCamara, type Vec3 } from "../../../lib/anim";
import { Escenario, type EstadoEscenario } from "../../../three/Escenario";
import { Escuela, Hospital, POS_TORRE, POS_VALVULA, TorreCorporativa, ValvulaGigante } from "../../../three/Edificios";
import { CASA_QUIETA } from "../../../three/Casa";
import { datosCiudad } from "../../../three/Ciudad";
import { distanciaRed } from "../../../three/RedAgua";
import { FlujoDinero, GraficoGanancias } from "../../../three/Simbolos";
import { Fundido, TituloEscena } from "../../../ui/Superposiciones";
import { CONEXIONES, FPS, Lienzo, OPCIONES, RED_LLENA, s } from "../comun";
import { CAMARA_E2 } from "./Escena2";

/**
 * Escena 3 — ¿Un derecho o un negocio? (14,5 s)
 * Vuelve el agua; en la plaza emerge una torre corporativa; facturas,
 * billetes y monedas viajan hacia ella; crece un gráfico de ganancias.
 * Sobre la red aparece una válvula gigante que se cierra: representación
 * conceptual del conflicto entre rentabilidad y acceso universal.
 */

const ultima = CAMARA_E2[CAMARA_E2.length - 1];

export const CAMARA_E3: ClaveCamara[] = [
  { f: 0, pos: ultima.pos, target: ultima.target, fov: ultima.fov },
  { f: s(2.2), pos: [-48, 50, 104], target: [14, 16, 18], fov: 42 },
  { f: s(4.6), pos: [-50, 54, 122], target: [14, 34, 20], fov: 44 },
  { f: s(7.6), pos: [-38, 50, 120], target: [16, 36, 20], fov: 44 },
  { f: s(9.4), pos: [2, 30, -14], target: [16.5, 6, 13], fov: 46 },
  { f: s(12.8), pos: [-2, 34, -24], target: [17, 2, 14], fov: 48 },
  { f: s(14.5), pos: [-10, 150, 40], target: [10, 0, -6], fov: 40 },
];

const D_VALVULA = distanciaRed(POS_VALVULA[0], POS_VALVULA[2]);

export const cierreValvula = (f: number) => progreso(f, s(10.2), s(13.2), easeInOutCubic);

export function estadoE3(frame: number): EstadoEscenario {
  const frente = lerp(0, RED_LLENA, progreso(frame, 0, s(2.0), easeInOutCubic));
  const cierre = cierreValvula(frame);
  const vuelveLuz = progreso(frame, 0, s(2.0), easeInOutCubic);
  return {
    camara: CAMARA_E3,
    casa: CASA_QUIETA,
    rayosX: Math.max(1 - progreso(frame, s(0.7), s(2.5)), 0.75 * progreso(frame, s(8.8), s(10.0))),
    oscuridad: 0.8 * (1 - vuelveLuz),
    brillo: (x, z) => {
      const base = 0.15 + 0.85 * vuelveLuz;
      return distanciaRed(x, z) >= D_VALVULA ? base * (1 - 0.5 * cierre) : base;
    },
    red: { frente, valvula: { d: D_VALVULA, cierre } },
  };
}

export const Escena3: React.FC = () => {
  const frame = useCurrentFrame();
  const estado = estadoE3(frame);
  const origenes: Vec3[] = datosCiudad(OPCIONES)
    .lotes.filter((l) => l.tipo === "casa" && Math.hypot(l.x - 4, l.z - 4) < 48)
    .filter((_, i) => i % 2 === 0)
    .slice(0, 22)
    .map((l) => [l.x, 3, l.z]);
  origenes.unshift([0, 4.8, 0]);
  const destino: Vec3 = [POS_TORRE[0], 46, POS_TORRE[2]];
  const blanco = progreso(frame, s(13.4), s(14.5));
  return (
    <AbsoluteFill>
      <Lienzo>
        <Escenario frame={frame} fps={FPS} estado={estado} opciones={OPCIONES} conexiones={CONEXIONES}>
          {() => (
            <>
              <Hospital />
              <Escuela frame={frame} />
              <TorreCorporativa frame={frame} p={progreso(frame, s(2.0), s(4.3))} />
              <FlujoDinero frame={frame} inicio={s(4.6)} origenes={origenes} destino={destino} />
              <GraficoGanancias position={[8, 42, 24]} rotacion={-0.55} p={progreso(frame, s(5.6), s(8.4))} />
              <ValvulaGigante sube={progreso(frame, s(8.8), s(10.0))} cierre={cierreValvula(frame)} />
            </>
          )}
        </Escenario>
      </Lienzo>
      <Fundido color="#eef5fa" opacidad={blanco} />
      <TituloEscena frame={frame - s(0.4)} fps={FPS} numero={3} titulo="¿UN DERECHO O UN NEGOCIO?" dura={2.8} />
    </AbsoluteFill>
  );
};
