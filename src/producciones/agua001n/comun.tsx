import { AbsoluteFill, Series, useCurrentFrame } from "remotion";
import tiempos from "../../../producciones/001-agua/tiempos-narrada.json";
import { clamp01, type ClaveCamara, type Vec3 } from "../../lib/anim";
import { Escenario, calcularCamara, fundidoSuelo, type EstadoEscenario } from "../../three/Escenario";
import { Escuela, Hospital } from "../../three/Edificios";
import { Fundido } from "../../ui/Superposiciones";
import { CONEXIONES, Lienzo, OPCIONES } from "../agua001/comun";

/**
 * Base de la versión narrada: tiempos reales de la voz, claves de cámara en
 * segundos y "tomas" unidas por cortes con barrido.
 */

export const TN = tiempos;
export const FPS = tiempos.fps;
export const s = (seg: number) => Math.round(seg * FPS);

/** Clave de cámara con el tiempo en segundos. */
export const K = (t: number, pos: Vec3, target: Vec3, fov = 42): ClaveCamara => ({ f: s(t), pos, target, fov });

/** Una vista de la ciudad: lienzo + escenario + fundido al atravesar el suelo. */
export const VistaCiudad: React.FC<{
  estado: (f: number) => EstadoEscenario;
  extras?: (f: number) => React.ReactNode;
  brilloHospital?: (f: number) => number;
  sinEspeciales?: boolean;
}> = ({ estado, extras, brilloHospital, sinEspeciales }) => {
  const frame = useCurrentFrame();
  const e = estado(frame);
  const y = calcularCamara(e.camara, frame).pos[1];
  return (
    <AbsoluteFill>
      <Lienzo>
        <Escenario frame={frame} fps={FPS} estado={e} opciones={OPCIONES} conexiones={CONEXIONES}>
          {() => (
            <>
              {!sinEspeciales ? (
                <>
                  <Hospital brillo={brilloHospital ? brilloHospital(frame) : 1} />
                  <Escuela frame={frame} />
                </>
              ) : null}
              {extras?.(frame)}
            </>
          )}
        </Escenario>
      </Lienzo>
      <Fundido color="#140d08" opacidad={fundidoSuelo(y)} />
    </AbsoluteFill>
  );
};

export interface Toma {
  /** Duración en segundos. */
  dur: number;
  componente: React.FC;
}

/**
 * Encadena tomas con un corte de barrido: el cuadro se desenfoca y se
 * ilumina apenas unos fotogramas a cada lado del corte (como un paneo rápido).
 */
export const Tomas: React.FC<{ tomas: Toma[]; barrido?: boolean }> = ({ tomas, barrido = true }) => {
  const frame = useCurrentFrame();
  let acum = 0;
  const cortes: number[] = [];
  const marcos = tomas.map((t) => {
    const desde = acum;
    acum += s(t.dur);
    cortes.push(acum);
    return { ...t, frames: acum - desde };
  });
  cortes.pop();
  const cerca = cortes.reduce((min, c) => Math.min(min, Math.abs(frame - c + 0.5)), Infinity);
  const k = barrido ? clamp01(1 - cerca / 5) : 0;
  return (
    <AbsoluteFill style={{ filter: k > 0 ? `blur(${(k * 14).toFixed(1)}px) brightness(${(1 + k * 0.35).toFixed(2)})` : undefined }}>
      <Series>
        {marcos.map((t, i) => (
          <Series.Sequence key={i} durationInFrames={t.frames}>
            <t.componente />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

/** Hash estable 0..1 por posición (decide qué casas "pagan"). */
export const azarPos = (x: number, z: number) => {
  const v = Math.sin(Math.round(x) * 12.9898 + Math.round(z) * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** Cámara: última clave de una lista (para continuar una toma en la siguiente). */
export const ultima = (c: ClaveCamara[]) => c[c.length - 1];
export const continuar = (c: ClaveCamara[]): ClaveCamara => ({ ...ultima(c), f: 0 });

/** Altura de la cámara en un fotograma (para saber si está bajo tierra). */
export const calcularY = (c: ClaveCamara[], f: number) => calcularCamara(c, f).pos[1];
