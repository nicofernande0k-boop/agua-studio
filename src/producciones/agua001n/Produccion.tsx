import "@fontsource/inter/800.css";
import "@fontsource/inter/600.css";
import { AbsoluteFill, Audio, Series, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { clamp01 } from "../../lib/anim";
import { Fundido, Marca, Subtitulos, Vineta } from "../../ui/Superposiciones";
import { useFuentesListas } from "../agua001/comun";
import { Acto1 } from "./actos/Acto1";
import { Acto2 } from "./actos/Acto2";
import { Acto3 } from "./actos/Acto3";
import { Acto4 } from "./actos/Acto4";
import { Acto5 } from "./actos/Acto5";
import { Acto6 } from "./actos/Acto6";
import { Acto7 } from "./actos/Acto7";
import { Acto8 } from "./actos/Acto8";
import { FPS, TN } from "./comun";

/**
 * AGUA STUDIO — Producción 001, versión narrada: «El agua no se vende».
 * Ocho actos sincronizados con la voz; subtítulos con los tiempos reales de
 * cada palabra; cierre que aparece junto con la voz.
 */

const ACTOS = [Acto1, Acto2, Acto3, Acto4, Acto5, Acto6, Acto7, Acto8];
/** Cambios de mundo (ciudad ↔ mapa): fundido breve a blanco. */
const BLANCOS = ["a3", "a4", "a7", "a8"].map((id) => TN.escenas.find((e) => e.id === id)!.inicio);

const CELESTE = "#7fd8ff";

const CierreNarrado: React.FC<{ t: number }> = ({ t }) => {
  const [el, , no] = TN.cierre.palabras;
  if (t < el.inicio - 0.05) return null;
  const f = (seg: number) => Math.round((t - seg) * FPS);
  const a = spring({ frame: f(el.inicio), fps: FPS, config: { damping: 14, stiffness: 130 } });
  const b = spring({ frame: f(no.inicio), fps: FPS, config: { damping: 14, stiffness: 130 } });
  const c = spring({ frame: f(TN.cierre.defiende), fps: FPS, config: { damping: 9, stiffness: 160, mass: 0.8 } });
  const destello = clamp01(1 - Math.abs(t - TN.cierre.defiende - 0.05) / 0.12);
  const linea = (texto: string, s: number, tam: number, color: string, extra = {}) => (
    <div style={{ fontSize: tam, letterSpacing: -3, color, opacity: s, transform: `translateY(${(1 - s) * 40}px) scale(${interpolate(s, [0, 1], [0.9, 1])})`, ...extra }}>{texto}</div>
  );
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none" }}>
      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, textAlign: "center", lineHeight: 1.0, marginTop: -160, textShadow: "0 8px 40px rgba(0,0,0,0.6)" }}>
        {linea("EL AGUA", a, 124, "#ffffff")}
        {linea("NO SE VENDE.", b, 124, "#ffffff")}
        <div
          style={{
            marginTop: 40,
            fontSize: 150,
            letterSpacing: -4,
            color: CELESTE,
            opacity: c,
            transform: `scale(${interpolate(c, [0, 1], [1.45, 1])})`,
            textShadow: `0 0 ${60 + 80 * destello}px rgba(79,195,255,${0.6 + 0.4 * destello}), 0 8px 40px rgba(0,0,0,0.6)`,
          }}
        >
          SE DEFIENDE.
        </div>
      </div>
      <Fundido color="#ffffff" opacidad={destello * 0.45} />
    </AbsoluteFill>
  );
};

export const Produccion001Narrada: React.FC<{ conAudio?: boolean }> = ({ conAudio = false }) => {
  const frame = useCurrentFrame();
  const listo = useFuentesListas();
  const t = frame / FPS;
  const blanco = Math.max(0, ...BLANCOS.map((b) => clamp01(1 - Math.abs(t - b) / 0.4)));
  const finSubtitulos = TN.cierre.palabras[0].inicio - 0.05;
  return (
    <AbsoluteFill style={{ backgroundColor: "#10263b" }}>
      {listo ? (
        <Series>
          {TN.escenas.map((e, i) => {
            const Acto = ACTOS[i];
            return (
              <Series.Sequence key={e.id} durationInFrames={e.frames} name={`${e.indice}. ${e.titulo}`}>
                <Acto />
              </Series.Sequence>
            );
          })}
        </Series>
      ) : null}
      <Fundido color="#eef5fa" opacidad={blanco} />
      <Vineta fuerza={0.32} />
      {t < finSubtitulos ? <Subtitulos t={t} fps={FPS} palabras={TN.palabras} bloques={TN.bloques} /> : null}
      <CierreNarrado t={t} />
      <Marca />
      {conAudio ? <Audio src={staticFile("audio/001-agua-narrada.wav")} /> : null}
    </AbsoluteFill>
  );
};
