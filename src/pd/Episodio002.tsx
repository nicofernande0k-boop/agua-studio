import "@fontsource/anton/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/800.css";
import "@fontsource/fraunces/400-italic.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import tiempos from "../../producciones/002-nosotros/tiempos.json";
import { clamp01 } from "../lib/anim";
import { CREMA, ROJO } from "./Escena";
import { Ciudad, Olvidar, Solos, Subte } from "./tomas/Acto1";
import { Cima, Grietas, Lluvioso, Recuerdo } from "./tomas/Acto2";
import { Companeros, ComedorT, Encuentro, Jovenes, Ronda, Vecinos, Ventana } from "./tomas/Acto3";
import { Carrera, Construir, Mirar, Nosotros } from "./tomas/Acto4";

/**
 * PATRIA EN DISPUTA — Episodio 002: «¿Cuándo dejamos de pensar en nosotros?»
 * El montaje se arma solo a partir de los tiempos reales de la voz.
 */

interface TiemposPD {
  fps: number;
  duracion: number;
  frames: number;
  frases: { k: number; acto: string; texto: string; inicio: number; fin: number }[];
  palabras: { texto: string; inicio: number; fin: number; frase: number }[];
  bloques: { palabras: number[]; inicio: number; fin: number; salida: number; lineas: string[] }[];
}
const T = tiempos as unknown as TiemposPD;
const FPS = T.fps;
const f = (s: number) => Math.round(s * FPS);
const frase = (k: number) => T.frases[k - 1];

const PLAN: { toma: string; desde: number }[] = [
  { toma: "Solos", desde: 1 },
  { toma: "Ciudad", desde: 2 },
  { toma: "Subte", desde: 4 },
  { toma: "Olvidar", desde: 7 },
  { toma: "TipoNosotros", desde: 8 },
  { toma: "Lluvioso", desde: 9 },
  { toma: "Grietas", desde: 12 },
  { toma: "Recuerdo", desde: 13 },
  { toma: "Cima", desde: 16 },
  { toma: "Ventana", desde: 17 },
  { toma: "Vecinos", desde: 18 },
  { toma: "ComedorT", desde: 19 },
  { toma: "Companeros", desde: 20 },
  { toma: "Jovenes", desde: 21 },
  { toma: "Ronda", desde: 22 },
  { toma: "Encuentro", desde: 23 },
  { toma: "Carrera", desde: 26 },
  { toma: "Construir", desde: 28 },
  { toma: "Mirar", desde: 30 },
  { toma: "Nosotros", desde: 31 },
  { toma: "Cierre", desde: 33 },
];

const ACTOS = [
  { desde: 1, rotulo: "I", titulo: "EL INDIVIDUALISMO" },
  { desde: 9, rotulo: "II", titulo: "LO QUE PERDIMOS" },
  { desde: 17, rotulo: "III", titulo: "LA MEMORIA COLECTIVA" },
  { desde: 26, rotulo: "IV", titulo: "EL FUTURO" },
];

const TipoNosotros: React.FC = () => {
  const fr = useCurrentFrame();
  const letras = "NOSOTROS".split("");
  const entra = spring({ frame: fr - 4, fps: FPS, config: { damping: 20, stiffness: 80 } });
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505", justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", fontFamily: "Anton, sans-serif", fontSize: 220, color: CREMA, letterSpacing: 4, marginTop: -120 }}>
        {letras.map((l, i) => {
          const d = (i - 3.5) / 3.5;
          const sep = clamp01((fr - 30 - Math.abs(d) * 8) / 70);
          return (
            <span key={i} style={{ display: "inline-block", opacity: entra * (1 - sep * 0.92), transform: `translate(${d * sep * 160}px, ${Math.sin(i * 2.1) * sep * 70}px) rotate(${d * sep * 9}deg)`, filter: `blur(${sep * 6}px)` }}>
              {l}
            </span>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1090, width: 18, height: 18, borderRadius: 9, backgroundColor: ROJO, opacity: entra * (1 - clamp01((fr - 60) / 40)) }} />
    </AbsoluteFill>
  );
};

/** Cierre tipográfico sincronizado con la voz (frases 33 a 38). */
const Cierre: React.FC = () => {
  const fr = useCurrentFrame();
  const base = frase(33).inicio - 0.35;
  const t = fr / FPS + base;
  const ap = (k: number, extra = 0) => spring({ frame: f(t - frase(k).inicio - extra), fps: FPS, config: { damping: 18, stiffness: 90 } });
  const tachado = clamp01((t - frase(34).inicio) / 0.6);
  const sale1 = clamp01((t - frase(35).inicio + 0.3) / 0.4);
  const sale2 = clamp01((t - frase(36).inicio + 0.2) / 0.4);
  const titulo = ["¿CUÁNDO DEJAMOS", "DE PENSAR EN", "NOSOTROS?"];
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505", fontFamily: "Anton, sans-serif", color: CREMA, alignItems: "center" }}>
      {/* La pregunta del título, que después se tacha */}
      <div style={{ position: "absolute", top: 520, textAlign: "center", opacity: 1 - sale1 }}>
        {titulo.map((l, i) => (
          <div key={i} style={{ fontSize: 118, lineHeight: 1.05, opacity: ap(33, i * 0.35), color: i === 2 ? ROJO : CREMA, transform: `translateY(${(1 - ap(33, i * 0.35)) * 30}px)` }}>
            {l}
          </div>
        ))}
        <div style={{ position: "absolute", left: -20, right: -20, top: 186, height: 10, backgroundColor: ROJO, transform: `scaleX(${tachado})`, transformOrigin: "left" }} />
        <div style={{ marginTop: 60, fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 54, opacity: ap(34, 0.3) }}>Quizás la verdadera pregunta sea…</div>
      </div>
      {/* La nueva pregunta */}
      <div style={{ position: "absolute", top: 560, textAlign: "center", opacity: ap(35) * (1 - sale2) }}>
        {["¿CUÁNDO", "VAMOS A VOLVER", "A HACERLO?"].map((l, i) => (
          <div key={i} style={{ fontSize: 132, lineHeight: 1.04, transform: `translateY(${(1 - ap(35, i * 0.25)) * 40}px)`, opacity: ap(35, i * 0.25) }}>
            {l}
          </div>
        ))}
      </div>
      {/* Firma */}
      <div style={{ position: "absolute", top: 700, textAlign: "center", opacity: ap(36) }}>
        <div style={{ width: 120, height: 10, backgroundColor: ROJO, margin: "0 auto 34px", transform: `scaleX(${ap(36)})` }} />
        <div style={{ fontSize: 112, letterSpacing: 6, lineHeight: 1 }}>PATRIA EN DISPUTA</div>
        <div style={{ marginTop: 64, fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 54, opacity: ap(37) }}>La historia no se mira desde afuera.</div>
        <div style={{ marginTop: 30, fontSize: 150, color: ROJO, letterSpacing: 4, opacity: ap(38), transform: `scale(${interpolate(ap(38), [0, 1], [1.25, 1])})` }}>SE DISPUTA.</div>
      </div>
    </AbsoluteFill>
  );
};

const COMPONENTES: Record<string, React.FC> = {
  Solos, Ciudad, Subte, Olvidar, TipoNosotros, Lluvioso, Grietas, Recuerdo, Cima,
  Ventana, Vecinos, ComedorT, Companeros, Jovenes, Ronda, Encuentro,
  Carrera, Construir, Mirar, Nosotros, Cierre,
};

/** Cortes del montaje (en fotogramas). */
export function cortes() {
  const ini = PLAN.map((p, i) => (i === 0 ? 0 : f(frase(p.desde).inicio - 0.35)));
  return PLAN.map((p, i) => ({ ...p, desde: ini[i], hasta: i + 1 < PLAN.length ? ini[i + 1] : T.frames }));
}

const Grano: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.11 }}>
    <svg width="1080" height="1920">
      <filter id="g">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 97} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="1080" height="1920" filter="url(#g)" />
    </svg>
  </AbsoluteFill>
);

const Rotulo: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / FPS;
  const a = ACTOS.find((x) => t >= frase(x.desde).inicio - 0.4 && t < frase(x.desde).inicio + 3.2);
  if (!a) return null;
  const local = t - (frase(a.desde).inicio - 0.4);
  const op = Math.min(clamp01(local / 0.5), clamp01((3.6 - local) / 0.5));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 170, left: 72, display: "flex", alignItems: "center", gap: 20, opacity: op }}>
        <div style={{ width: 54, height: 7, backgroundColor: ROJO }} />
        <div style={{ fontFamily: "Anton, sans-serif", fontSize: 34, letterSpacing: 5, color: CREMA }}>
          {a.rotulo} · {a.titulo}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Subtitulos: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / FPS;
  const b = T.bloques.find((x) => t >= x.inicio && t < x.salida);
  if (!b) return null;
  const k = T.palabras[b.palabras[0]].frase;
  if (k === 8 || k >= 33) return null; // esas frases se muestran como tipografía
  const op = Math.min(clamp01((t - b.inicio) / 0.15), clamp01((b.salida - t) / 0.15));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 1210, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: op }}>
        <div style={{ maxWidth: 900, padding: "16px 30px 20px", backgroundColor: "rgba(5,5,5,0.62)", borderLeft: `6px solid ${ROJO}`, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 52, lineHeight: 1.22, color: CREMA, textAlign: "center", letterSpacing: -0.3 }}>
          {b.lineas.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Fundidos a negro en los cambios de acto y al comienzo. */
function negro(frame: number) {
  const t = frame / FPS;
  const inicio = 1 - clamp01((t - 0.2) / 1.4);
  const cambios = [9, 17, 26, 33].map((k) => clamp01(1 - Math.abs(t - (frase(k).inicio - 0.35)) / 0.32));
  return Math.max(inicio, ...cambios);
}

function useFuentes() {
  const [listo, setListo] = useState(false);
  const [h] = useState(() => delayRender("Fuentes PD"));
  useEffect(() => {
    Promise.all(["400 64px Anton", "600 64px Inter", "italic 400 64px Fraunces"].map((x) => document.fonts.load(x)))
      .catch(() => undefined)
      .then(() => {
        setListo(true);
        continueRender(h);
      });
  }, [h]);
  return listo;
}

export const Episodio002: React.FC<{ conAudio?: boolean }> = ({ conAudio = false }) => {
  const frame = useCurrentFrame();
  const listo = useFuentes();
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      {listo
        ? cortes().map((c) => {
            const C = COMPONENTES[c.toma];
            return (
              <Sequence key={c.toma} from={c.desde} durationInFrames={c.hasta - c.desde} name={c.toma}>
                <C />
              </Sequence>
            );
          })
        : null}
      <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse 80% 65% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
      <AbsoluteFill style={{ pointerEvents: "none", backgroundColor: "#000", opacity: negro(frame) }} />
      <Grano frame={frame} />
      <Rotulo frame={frame} />
      <Subtitulos frame={frame} />
      {conAudio ? <Audio src={staticFile("audio/002-nosotros.wav")} /> : null}
    </AbsoluteFill>
  );
};

export const DURACION_002 = T.frames;
