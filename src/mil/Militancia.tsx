import "@fontsource/anton/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/800.css";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import montajeJson from "../../producciones/militancia-2026/montaje.json";

/**
 * PATRIA EN DISPUTA — «Los que nunca bajaron los brazos» (17 de noviembre, Día de la Militancia).
 * Archivo real en blanco y negro y movilizaciones actuales en color, con movimiento por profundidad.
 * El montaje (tiempos, imágenes, textos) lo calcula scripts/mil/montar.py a partir de la voz.
 */

const CREMA = "#efe6d4";
const ROJO = "#d4162c";
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const sal = (x: number) => 1 - Math.pow(1 - c01(x), 3);

interface Sub {
  desde: number;
  hasta: number;
  clip: string;
}
interface Toma {
  id: string;
  desde: number;
  hasta: number;
  tipo: "foto" | "doc" | "rapido" | "placa" | "vacio";
  ancho?: number;
  alto?: number;
  clip?: string;
  sub?: Sub[];
  despues?: { clip: string; desde: number };
  lluvia?: boolean;
  fundido?: number;
  epigrafe?: string;
  grande?: string;
  grande_desde?: number;
  oscuro?: number;
  rojo?: boolean;
}
interface Montaje {
  fps: number;
  frames: number;
  tomas: Toma[];
  bloques: { inicio: number; salida: number; lineas: string[] }[];
}
const M = montajeJson as unknown as Montaje;
export const DURACION_MILITANCIA = M.frames;

const Fundido: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: frames > 0 ? c01(f / frames) : 1 }}>{children}</AbsoluteFill>;
};

/** Documento: la foto entera (viva), enmarcada, sobre su propia imagen desenfocada. */
const Documento: React.FC<{ src: string; ancho: number; alto: number }> = ({ src, ancho, alto }) => {
  const w = 972;
  const h = Math.round((w * alto) / ancho);
  const top = Math.max(150, Math.round((1920 - h) / 2) - 90);
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      <AbsoluteFill style={{ filter: "blur(34px) brightness(0.42) saturate(0.6)", transform: "scale(1.25)" }}>
        <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: (1080 - w) / 2, top, width: w, height: h, boxShadow: "0 40px 120px rgba(0,0,0,0.85)", outline: "1px solid rgba(239,230,212,0.35)" }}>
        <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </AbsoluteFill>
  );
};

const Video: React.FC<{ src: string }> = ({ src }) => (
  <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
);

/** Lluvia: trazos finos, deterministas, en dos capas de profundidad. */
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
      <AbsoluteFill style={{ backgroundColor: "rgba(20,26,34,0.18)" }} />
    </AbsoluteFill>
  );
};

/** Palabra grande que golpea con la música. */
const Grande: React.FC<{ texto: string; rojo?: boolean }> = ({ texto, rojo }) => {
  const f = useCurrentFrame();
  const k = sal(f / 6);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center", transform: `scale(${1.18 - 0.18 * k})`, opacity: c01(f / 3), filter: `blur(${(1 - k) * 6}px)` }}>
        <div style={{ fontFamily: "Anton, sans-serif", fontSize: texto.length > 10 ? 150 : 190, lineHeight: 1, letterSpacing: 4, color: rojo ? ROJO : CREMA, textShadow: "0 10px 60px rgba(0,0,0,0.85)" }}>{texto}</div>
        <div style={{ width: 130, height: 11, backgroundColor: rojo ? CREMA : ROJO, margin: "26px auto 0", transform: `scaleX(${sal((f - 3) / 8)})` }} />
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

/** Placa final sobria, en el punto máximo de la música. */
const Placa: React.FC = () => {
  const f = useCurrentFrame();
  const l = (d: number) => sal((f - d) / 10);
  return (
    <AbsoluteFill style={{ backgroundColor: "rgba(5,5,5,0.86)", justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "Anton, sans-serif", fontSize: 120, color: CREMA, letterSpacing: 6, opacity: l(0), transform: `translateY(${(1 - l(0)) * 20}px)` }}>17 DE NOVIEMBRE</div>
        <div style={{ fontFamily: "Anton, sans-serif", fontSize: 92, color: ROJO, letterSpacing: 5, marginTop: 10, opacity: l(8) }}>DÍA DE LA MILITANCIA</div>
        <div style={{ width: 120, height: 9, backgroundColor: CREMA, margin: "54px auto 40px", transform: `scaleX(${l(18)})` }} />
        <div style={{ fontFamily: "Anton, sans-serif", fontSize: 58, color: CREMA, letterSpacing: 9, opacity: l(24) }}>PATRIA EN DISPUTA</div>
        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 28, color: CREMA, letterSpacing: 10, marginTop: 14, opacity: 0.85 * l(30) }}>EPISODIO 004</div>
      </div>
    </AbsoluteFill>
  );
};

const Subtitulos: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / M.fps;
  const b = M.bloques.find((x) => t >= x.inicio && t < x.salida);
  if (!b) return null;
  const o = Math.min(c01((t - b.inicio) / 0.12), c01((b.salida - t) / 0.12));
  return (
    <div style={{ position: "absolute", top: 1430, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ maxWidth: 960, whiteSpace: "nowrap", padding: "12px 26px 15px", backgroundColor: "rgba(5,5,5,0.6)", borderLeft: `6px solid ${ROJO}`, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 44, lineHeight: 1.22, color: CREMA, textAlign: "center" }}>
        {b.lineas.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};

function useFuentes() {
  const [listo, setListo] = useState(false);
  const [h] = useState(() => delayRender("Fuentes militancia"));
  useEffect(() => {
    Promise.all(["400 64px Anton", "600 64px Inter", "800 64px Inter"].map((x) => document.fonts.load(x, "ÁÉÍÓÚÑ0123456789")))
      .catch(() => undefined)
      .then(() => {
        setListo(true);
        continueRender(h);
      });
  }, [h]);
  return listo;
}

export const Militancia: React.FC<{ audio?: string }> = ({ audio = "" }) => {
  const frame = useCurrentFrame();
  const listo = useFuentes();
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      {M.tomas.map((t, i) => {
        const sig = M.tomas[i + 1];
        const fd = t.fundido ?? 0;
        const desde = Math.max(0, t.desde - fd);
        const hasta = Math.min(M.frames, sig ? sig.desde : t.hasta);
        if (hasta <= desde) return null;
        return (
          <Sequence key={t.id} from={desde} durationInFrames={hasta - desde} name={t.id}>
            <Fundido frames={fd}>
              {t.tipo === "foto" && t.clip ? <Video src={t.clip} /> : null}
              {t.tipo === "doc" && t.clip ? <Documento src={t.clip} ancho={t.ancho ?? 16} alto={t.alto ?? 9} /> : null}
              {t.tipo === "rapido" && t.sub
                ? t.sub.map((s, j) => (
                    <Sequence key={j} from={s.desde - desde} durationInFrames={Math.max(1, s.hasta - s.desde)}>
                      <Video src={s.clip} />
                    </Sequence>
                  ))
                : null}
              {t.despues ? (
                <Sequence from={t.despues.desde - desde}>
                  <Fundido frames={22}>
                    <Video src={t.despues.clip} />
                  </Fundido>
                </Sequence>
              ) : null}
              {t.oscuro ? <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${t.oscuro})` }} /> : null}
              {t.lluvia ? <Lluvia /> : null}
              {listo && t.epigrafe ? <Epigrafe texto={t.epigrafe} /> : null}
              {listo && t.grande ? (
                <Sequence from={(t.grande_desde ?? t.desde) - desde}>
                  <Grande texto={t.grande} rojo={t.rojo} />
                </Sequence>
              ) : null}
              {t.tipo === "placa" && listo ? <Placa /> : null}
            </Fundido>
          </Sequence>
        );
      })}
      <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse 90% 75% at 50% 45%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.5) 100%), linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,0.55) 100%)" }} />
      {listo ? <Subtitulos frame={frame} /> : null}
      {audio ? <Audio src={staticFile(audio)} /> : null}
    </AbsoluteFill>
  );
};
