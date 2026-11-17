import "@fontsource/anton/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/800.css";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import montajeJson from "../../producciones/especial-17n/montaje.json";
import subsJson from "../../producciones/especial-17n/subtitulos.json";

/**
 * PATRIA EN DISPUTA — Especial 17 de noviembre, Día de la Militancia.
 * Sobre el audio aportado (voz y música, intactos): video real de movilizaciones y archivo histórico vivo.
 * El montaje lo calcula scripts/esp/montar17n.py; los subtítulos, scripts/esp/subtitulos17n.py.
 */

const CREMA = "#efe6d4";
const ROJO = "#d4162c";
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const sal = (x: number) => 1 - Math.pow(1 - c01(x), 3);

interface Toma {
  id: string;
  desde: number;
  hasta: number;
  tipo: "video" | "foto" | "doc";
  clip: string;
  ancho?: number;
  alto?: number;
  fundido?: number;
  epigrafe?: string;
  lluvia?: boolean;
  grande?: string;
  grande_desde?: number;
}
const M = montajeJson as unknown as { fps: number; frames: number; placa: number; tomas: Toma[] };
const SUBS = (subsJson as unknown as { bloques: { inicio: number; salida: number; lineas: string[] }[] }).bloques;
export const DURACION_ESPECIAL = M.frames;

const Fundido: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: frames > 0 ? c01(f / frames) : 1 }}>{children}</AbsoluteFill>;
};

/** Video a pantalla completa con un empuje de cámara lento (alterna acercar/alejar). */
const Video: React.FC<{ src: string; dur: number; i: number }> = ({ src, dur, i }) => {
  const f = useCurrentFrame();
  const u = c01(f / Math.max(1, dur));
  const z = i % 2 ? 1.07 - 0.06 * u : 1.01 + 0.06 * u;
  return (
    <AbsoluteFill style={{ transform: `scale(${z})` }}>
      <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

/** Encuadre completo: la imagen entera sobre su propia copia desenfocada. */
const Documento: React.FC<{ src: string; ancho: number; alto: number; dur: number }> = ({ src, ancho, alto, dur }) => {
  const f = useCurrentFrame();
  const w = 1000;
  const h = Math.round((w * alto) / ancho);
  const top = Math.max(150, Math.round((1920 - h) / 2) - 110);
  const z = 1 + 0.035 * c01(f / Math.max(1, dur));
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      <AbsoluteFill style={{ filter: "blur(38px) brightness(0.4) saturate(0.7)", transform: "scale(1.3)" }}>
        <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: (1080 - w) / 2, top, width: w, height: h, transform: `scale(${z})`, boxShadow: "0 40px 120px rgba(0,0,0,0.85)", outline: "1px solid rgba(239,230,212,0.3)" }}>
        <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </AbsoluteFill>
  );
};

const Lluvia: React.FC = () => {
  const f = useCurrentFrame();
  const gotas = useMemo(() => Array.from({ length: 140 }, (_, i) => ({ x: (i * 7919) % 1080, y0: (i * 104729) % 1920, v: 38 + (i % 5) * 9, l: 40 + (i % 4) * 22, o: 0.1 + (i % 3) * 0.07 })), []);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="1080" height="1920">
        {gotas.map((g, i) => {
          const y = ((g.y0 + f * g.v) % 2100) - 120;
          return <line key={i} x1={g.x} y1={y} x2={g.x - g.l * 0.18} y2={y + g.l} stroke="#dfe6ee" strokeWidth={1.6} strokeOpacity={g.o} />;
        })}
      </svg>
      <AbsoluteFill style={{ backgroundColor: "rgba(20,26,34,0.16)" }} />
    </AbsoluteFill>
  );
};

const Grande: React.FC<{ texto: string }> = ({ texto }) => {
  const f = useCurrentFrame();
  const k = sal(f / 6);
  const palabras = texto.split(" ");
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: `rgba(0,0,0,${0.35 * k})` }}>
      <div style={{ textAlign: "center", transform: `scale(${1.15 - 0.15 * k})`, opacity: c01(f / 3), filter: `blur(${(1 - k) * 6}px)` }}>
        {palabras.map((p, i) => (
          <div key={i} style={{ fontFamily: "Anton, sans-serif", fontSize: 190, lineHeight: 1.02, letterSpacing: 4, color: i === palabras.length - 1 ? ROJO : CREMA, textShadow: "0 10px 60px rgba(0,0,0,0.85)", opacity: c01((f - i * 4) / 4) }}>
            {p}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Epigrafe: React.FC<{ texto: string }> = ({ texto }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top: 210, left: 70, right: 70, display: "flex", alignItems: "center", gap: 14, opacity: c01((f - 6) / 10) }}>
      <div style={{ width: 34, height: 5, backgroundColor: ROJO, flexShrink: 0 }} />
      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 25, letterSpacing: 4, color: CREMA, textShadow: "0 2px 14px rgba(0,0,0,0.95)" }}>{texto}</div>
    </div>
  );
};

/** Sello de la serie al comienzo. */
const Sello: React.FC<{ frame: number }> = ({ frame }) => {
  const o = Math.min(c01((frame - 8) / 12), c01((150 - frame) / 15));
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", top: 120, left: 70, display: "flex", alignItems: "center", gap: 14, opacity: o }}>
      <div style={{ width: 36, height: 6, backgroundColor: ROJO }} />
      <div style={{ fontFamily: "Anton, sans-serif", fontSize: 28, letterSpacing: 5, color: CREMA, textShadow: "0 2px 14px rgba(0,0,0,0.9)" }}>PATRIA EN DISPUTA · ESPECIAL 17N</div>
    </div>
  );
};

const Placa: React.FC = () => {
  const f = useCurrentFrame();
  const l = (d: number) => sal((f - d) / 12);
  return (
    <AbsoluteFill style={{ backgroundColor: `rgba(5,5,5,${0.72 * sal(f / 20)})`, justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "Anton, sans-serif", fontSize: 124, color: CREMA, letterSpacing: 6, opacity: l(6), transform: `translateY(${(1 - l(6)) * 24}px)` }}>17 DE NOVIEMBRE</div>
        <div style={{ fontFamily: "Anton, sans-serif", fontSize: 94, color: ROJO, letterSpacing: 5, marginTop: 10, opacity: l(22), transform: `translateY(${(1 - l(22)) * 18}px)` }}>DÍA DE LA MILITANCIA</div>
        <div style={{ width: 120, height: 9, backgroundColor: CREMA, margin: "56px auto 42px", transform: `scaleX(${l(40)})` }} />
        <div style={{ fontFamily: "Anton, sans-serif", fontSize: 62, color: CREMA, letterSpacing: 10, opacity: l(52) }}>PATRIA EN DISPUTA</div>
      </div>
    </AbsoluteFill>
  );
};

const Subtitulos: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / M.fps;
  const b = SUBS.find((x) => t >= x.inicio && t < x.salida);
  if (!b) return null;
  const o = Math.min(c01((t - b.inicio) / 0.1), c01((b.salida - t) / 0.12));
  return (
    <div style={{ position: "absolute", top: 1430, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ maxWidth: 980, whiteSpace: "nowrap", padding: "12px 26px 15px", backgroundColor: "rgba(5,5,5,0.6)", borderLeft: `6px solid ${ROJO}`, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 44, lineHeight: 1.22, color: CREMA, textAlign: "center" }}>
        {b.lineas.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};

function useFuentes() {
  const [listo, setListo] = useState(false);
  const [h] = useState(() => delayRender("Fuentes especial"));
  useEffect(() => {
    Promise.all(["400 64px Anton", "600 64px Inter", "800 64px Inter"].map((x) => document.fonts.load(x, "ÁÉÍÓÚÑ«»0123456789")))
      .catch(() => undefined)
      .then(() => {
        setListo(true);
        continueRender(h);
      });
  }, [h]);
  return listo;
}

export const Especial17N: React.FC<{ audio?: string }> = ({ audio = "esp/audio/especial.wav" }) => {
  const frame = useCurrentFrame();
  const listo = useFuentes();
  const negro = c01((frame - (M.frames - 30)) / 28);
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      {M.tomas.map((t, i) => {
        const sig = M.tomas[i + 1];
        const fd = t.fundido ?? 0;
        const desde = Math.max(0, t.desde - fd);
        const hasta = Math.min(M.frames, sig ? sig.desde : M.frames);
        if (hasta <= desde) return null;
        const dur = hasta - desde;
        return (
          <Sequence key={t.id} from={desde} durationInFrames={dur} name={t.id}>
            <Fundido frames={fd}>
              {t.tipo === "doc" ? <Documento src={t.clip} ancho={t.ancho ?? 16} alto={t.alto ?? 9} dur={dur} /> : <Video src={t.clip} dur={dur} i={i} />}
              {t.lluvia ? <Lluvia /> : null}
              {listo && t.epigrafe ? <Epigrafe texto={t.epigrafe} /> : null}
              {listo && t.grande ? (
                <Sequence from={(t.grande_desde ?? t.desde) - desde}>
                  <Grande texto={t.grande} />
                </Sequence>
              ) : null}
            </Fundido>
          </Sequence>
        );
      })}
      <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse 90% 75% at 50% 45%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.5) 100%), linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,0.55) 100%)" }} />
      {listo ? (
        <Sequence from={M.placa}>
          <Placa />
        </Sequence>
      ) : null}
      {listo ? <Sello frame={frame} /> : null}
      {listo && frame < M.placa ? <Subtitulos frame={frame} /> : null}
      <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${negro})` }} />
      {audio ? <Audio src={staticFile(audio)} /> : null}
    </AbsoluteFill>
  );
};
