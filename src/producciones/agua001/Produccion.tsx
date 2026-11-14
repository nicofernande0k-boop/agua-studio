import "@fontsource/inter/800.css";
import "@fontsource/inter/600.css";
import { AbsoluteFill, Audio, Series, staticFile, useCurrentFrame } from "remotion";
import { Marca, Subtitulos, Vineta } from "../../ui/Superposiciones";
import { FPS, TIEMPOS, useFuentesListas } from "./comun";
import { Escena1 } from "./escenas/Escena1";
import { Escena2 } from "./escenas/Escena2";
import { Escena3 } from "./escenas/Escena3";
import { Escena4 } from "./escenas/Escena4";
import { Escena5 } from "./escenas/Escena5";
import { Escena6 } from "./escenas/Escena6";

/**
 * AGUA STUDIO — Producción 001: «¿Y si mañana no tenés agua?»
 * Seis escenas en serie; los subtítulos y la marca van por encima de todo.
 */

const ESCENAS = [Escena1, Escena2, Escena3, Escena4, Escena5, Escena6];

export interface PropsProduccion {
  /** Incluir la mezcla de audio (solo para la vista previa en Remotion Studio). */
  conAudio?: boolean;
}

export const Produccion001: React.FC<PropsProduccion> = ({ conAudio = false }) => {
  const frame = useCurrentFrame();
  const listo = useFuentesListas();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{ backgroundColor: "#bfdcee" }}>
      {listo ? (
        <Series>
          {TIEMPOS.escenas.map((e, i) => {
            const Escena = ESCENAS[i];
            return (
              <Series.Sequence key={e.id} durationInFrames={e.frames} name={`${e.indice}. ${e.titulo}`}>
                <Escena />
              </Series.Sequence>
            );
          })}
        </Series>
      ) : null}
      <Vineta fuerza={0.32} />
      <Subtitulos t={t} fps={FPS} palabras={TIEMPOS.palabras} bloques={TIEMPOS.bloques} />
      <Marca />
      {conAudio ? <Audio src={staticFile("audio/001-agua-mezcla.wav")} /> : null}
    </AbsoluteFill>
  );
};
