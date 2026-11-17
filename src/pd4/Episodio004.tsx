import "@fontsource/anton/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/800.css";
import "@fontsource/fraunces/400-italic.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import tiemposJson from "../../producciones/004-guamini/tiempos.json";
import { CREMA, Mapa, NEGRO, ROJO, salida } from "../pd3/Piezas";

/**
 * PATRIA EN DISPUTA — Episodio 004: «Guaminí: donde nadie es un desconocido».
 *
 * Regla de archivo: las fotografías históricas se muestran tal cual son
 * (sin colorear, sin retocar rostros ni edificios). Solo hay encuadre,
 * un movimiento de cámara lento y fundidos.
 */

interface Tiempos {
  duracion: number;
  frames: number;
  frases: { k: number; inicio: number; fin: number }[];
  palabras: { texto: string; inicio: number; fin: number; frase: number }[];
  bloques: { palabras: number[]; inicio: number; salida: number; lineas: string[] }[];
}
const T = tiemposJson as unknown as Tiempos;
const FPS = 30;
const fr = (s: number) => Math.round(s * FPS);
const F = (k: number) => T.frases[k - 1];
const P = (k: number, i: number) => T.palabras.filter((p) => p.frase === k)[i];
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const suave = (x: number) => {
  const t = c01(x);
  return t * t * (3 - 2 * t);
};

/* ───────────── Fotografía ───────────── */

type Foco = [number, number];

/** Detalle a pantalla completa: recorte vertical sobre el original, con movimiento lento. */
const Detalle: React.FC<{ src: string; dur: number; desde?: Foco; hasta?: Foco; zoom?: [number, number] }> = ({ src, dur, desde = [0.5, 0.5], hasta, zoom = [1.0, 1.06] }) => {
  const f = useCurrentFrame();
  const u = suave(f / Math.max(1, dur));
  const h = hasta ?? desde;
  const x = desde[0] + (h[0] - desde[0]) * u;
  const y = desde[1] + (h[1] - desde[1]) * u;
  const z = zoom[0] + (zoom[1] - zoom[0]) * u;
  return (
    <AbsoluteFill style={{ backgroundColor: NEGRO, overflow: "hidden" }}>
      <Img
        src={staticFile(`pd4/${src}.jpg`)}
        style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", objectPosition: `${x * 100}% ${y * 100}%`, transform: `scale(${z})`, transformOrigin: `${x * 100}% ${y * 100}%` }}
      />
    </AbsoluteFill>
  );
};

/** Documento completo: la foto entera, enmarcada, con epígrafe de archivo. */
const Documento: React.FC<{ src: string; dur: number; epigrafe: string; ancho?: number; top?: number }> = ({ src, dur, epigrafe, ancho = 1000, top = 520 }) => {
  const f = useCurrentFrame();
  const u = suave(f / Math.max(1, dur));
  return (
    <AbsoluteFill style={{ backgroundColor: NEGRO }}>
      <div style={{ position: "absolute", top, left: (1080 - ancho) / 2, width: ancho, transform: `scale(${1 + 0.035 * u})`, transformOrigin: "50% 40%" }}>
        <div style={{ border: `2px solid rgba(239,230,212,0.85)`, padding: 10, backgroundColor: "#0b0b0b", boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>
          <Img src={staticFile(`pd4/${src}.jpg`)} style={{ width: "100%", display: "block" }} />
        </div>
        <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 14, opacity: c01((f - 8) / 10) }}>
          <div style={{ width: 34, height: 5, backgroundColor: ROJO }} />
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: 4, color: CREMA, opacity: 0.85 }}>{epigrafe}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Epígrafe discreto para planos de detalle. */
const Epigrafe: React.FC<{ texto: string; top?: number }> = ({ texto, top = 250 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top, left: 70, right: 70, display: "flex", alignItems: "center", gap: 14, opacity: c01((f - 6) / 10) }}>
      <div style={{ width: 34, height: 5, backgroundColor: ROJO, flexShrink: 0 }} />
      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: 4, color: CREMA, textShadow: "0 2px 14px rgba(0,0,0,0.9)" }}>{texto}</div>
    </div>
  );
};

/** Texto grande editorial (cifra o título). */
const Grande: React.FC<{ texto: string; top: number; tam?: number; color?: string; desde?: number; sub?: string }> = ({ texto, top, tam = 200, color = CREMA, desde = 0, sub }) => {
  const f = useCurrentFrame() - desde;
  if (f < 0) return null;
  const k = salida(f / 10);
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center", opacity: k, transform: `translateY(${(1 - k) * 24}px)` }}>
      <div style={{ fontFamily: "Anton, sans-serif", fontSize: tam, lineHeight: 1, color, textShadow: "0 10px 50px rgba(0,0,0,0.75)" }}>{texto}</div>
      {sub ? <div style={{ marginTop: 18, fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 32, letterSpacing: 6, color: CREMA, textShadow: "0 2px 16px rgba(0,0,0,0.9)" }}>{sub}</div> : null}
    </div>
  );
};

/** Mapa con el punto de Guaminí (37,03° S – 62,42° O en la proyección del mapa de la serie). */
const GUAMINI: Foco = [0.2643, 0.4583];
const MapaGuamini: React.FC<{ dur: number; alejar?: boolean }> = ({ dur, alejar = false }) => {
  const f = useCurrentFrame();
  const u = suave(f / Math.max(1, dur));
  const zoom = alejar ? 3.2 - 2.2 * u : 1 + 2.2 * u;
  const alto = 1400;
  const ancho = alto * 0.4717;
  const top = 300;
  // posición del punto (el mapa escala desde el punto mismo, así que queda fijo)
  const px = (1080 - ancho) / 2 + GUAMINI[0] * alto;
  const py = top + GUAMINI[1] * alto;
  const pulso = 1 + 0.25 * Math.sin(f / 6);
  return (
    <AbsoluteFill style={{ backgroundColor: NEGRO }}>
      <Mapa alto={alto} top={top} relleno={0.08} resaltar={["Buenos Aires"]} enciende={0.25} zoom={zoom} foco={GUAMINI} opacidad={0.75} />
      <div style={{ position: "absolute", left: px - 14, top: py - 14, width: 28, height: 28, borderRadius: 14, backgroundColor: ROJO, boxShadow: "0 0 40px rgba(212,22,44,0.9)", transform: `scale(${pulso})` }} />
      <div style={{ position: "absolute", left: px + 30, top: py - 22, fontFamily: "Anton, sans-serif", fontSize: 46, letterSpacing: 4, color: CREMA, opacity: c01(f / 12) }}>GUAMINÍ</div>
    </AbsoluteFill>
  );
};

/* ───────────── Plan de montaje ───────────── */

type Toma = { id: string; t: number; C: React.FC<{ dur: number }>; fundido?: number };

function armar(): Toma[] {
  const L: Toma[] = [];
  const add = (id: string, t: number, C: React.FC<{ dur: number }>, fundido = 8) => L.push({ id, t, C, fundido });

  // 1 · Gancho: familias del acto frente al municipio (archivo).
  add("familias", 0, ({ dur }) => <Detalle src="IMG_5817" dur={dur} desde={[0.3, 0.62]} hasta={[0.42, 0.6]} zoom={[1.0, 1.08]} />, 0);
  add("guamini", F(2).inicio - 0.15, ({ dur }) => (
    <>
      <Detalle src="IMG_5818" dur={dur} desde={[0.5, 0.55]} hasta={[0.5, 0.42]} zoom={[1.0, 1.12]} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0) 30%, rgba(5,5,5,0) 60%, rgba(5,5,5,0.65) 100%)" }} />
      <Grande texto="GUAMINÍ" top={300} tam={230} />
      <Grande texto="3.054" sub="VECINOS" top={620} tam={150} desde={fr(P(3, 0).inicio - F(2).inicio + 0.15)} />
      <Grande texto="150" sub="AÑOS · 1876 — 2026" top={950} tam={150} desde={fr(P(3, 3).inicio - F(2).inicio + 0.15)} color={ROJO} />
    </>
  ), 4);

  // 2 · La vida en el pueblo.
  add("vereda", F(4).inicio - 0.2, ({ dur }) => <Detalle src="IMG_5815" dur={dur} desde={[0.5, 0.52]} hasta={[0.54, 0.5]} zoom={[1.02, 1.1]} />);
  add("laguna", F(5).inicio - 0.2, ({ dur }) => (
    <>
      <Detalle src="nasa-lagunas" dur={dur} desde={[0.46, 0.52]} hasta={[0.47, 0.5]} zoom={[1.6, 2.1]} />
      <Epigrafe texto="LAGUNA DEL MONTE · DESDE LA ESTACIÓN ESPACIAL INTERNACIONAL, 2023 · NASA" />
    </>
  ));
  add("esquina", F(6).inicio - 0.2, ({ dur }) => <Documento src="IMG_5811" dur={dur} epigrafe="ARCHIVO · ESQUINA «BARCELÓ – MIGUEZ»" top={600} />);

  // 3 · Quienes lo construyeron.
  add("isla", F(7).inicio - 0.2, ({ dur }) => (
    <>
      <Detalle src="nasa-lagunas" dur={dur} desde={[0.47, 0.5]} hasta={[0.48, 0.48]} zoom={[2.6, 3.4]} />
      <Grande texto="GUAMINÍ" top={760} tam={150} sub="VOZ MAPUCHE · LA ISLA EN EL AGUA" />
    </>
  ));
  add("fortin", F(8).inicio - 0.2, ({ dur }) => (
    <>
      <MapaGuamini dur={dur} />
      <Grande texto="1876" top={110} tam={170} color={ROJO} />
    </>
  ));
  add("iglesia", F(9).inicio - 0.2, ({ dur }) => (
    <>
      <Detalle src="IMG_5812" dur={dur} desde={[0.5, 0.78]} hasta={[0.45, 0.2]} zoom={[1.05, 1.1]} />
      <Epigrafe texto="ARCHIVO · PARROQUIA NUESTRA SEÑORA DE LA CANDELARIA" />
    </>
  ));
  add("salamone", F(10).inicio - 0.2, ({ dur }) => (
    <>
      <Detalle src="IMG_5819" dur={dur} desde={[0.47, 0.75]} hasta={[0.47, 0.18]} zoom={[1.0, 1.05]} />
      <Epigrafe texto="ARCHIVO · PALACIO MUNICIPAL · FRANCISCO SALAMONE, 1937" />
    </>
  ));
  const tAsf = F(11).inicio - 0.2;
  const dAsf = F(12).inicio - 0.2 - tAsf;
  add("asfalto-1", tAsf, ({ dur }) => <Detalle src="IMG_5813" dur={dur} desde={[0.45, 0.55]} hasta={[0.5, 0.55]} zoom={[1.02, 1.08]} />, 4);
  add("asfalto-2", tAsf + dAsf / 3, ({ dur }) => <Detalle src="IMG_5816" dur={dur} desde={[0.45, 0.5]} hasta={[0.5, 0.5]} zoom={[1.02, 1.08]} />, 4);
  add("asfalto-3", tAsf + (2 * dAsf) / 3, ({ dur }) => <Detalle src="IMG_5814" dur={dur} desde={[0.5, 0.55]} hasta={[0.52, 0.5]} zoom={[1.0, 1.06]} />, 4);
  add("nombres", F(12).inicio - 0.2, ({ dur }) => <Detalle src="IMG_5814" dur={dur} desde={[0.5, 0.42]} hasta={[0.53, 0.36]} zoom={[1.5, 1.7]} />, 10);

  // 4 · La solidaridad.
  add("agua-1985", F(13).inicio - 0.2, ({ dur }) => (
    <>
      <Detalle src="nasa-lagunas" dur={dur} desde={[0.42, 0.5]} hasta={[0.46, 0.52]} zoom={[1.4, 1.6]} />
      <AbsoluteFill style={{ backgroundColor: "rgba(5,5,5,0.35)" }} />
      <Grande texto="1985" top={760} tam={220} color={ROJO} />
    </>
  ));
  add("bomberos", F(14).inicio - 0.2, () => (
    <AbsoluteFill style={{ backgroundColor: NEGRO }}>
      <Grande texto="BOMBEROS" top={640} tam={170} />
      <Grande texto="VOLUNTARIOS" top={820} tam={130} />
      <Grande texto="25 · 04 · 1985" top={1010} tam={70} color={ROJO} desde={10} sub="GUAMINÍ" />
    </AbsoluteFill>
  ));
  add("todos", F(15).inicio - 0.2, ({ dur }) => <Documento src="IMG_5817" dur={dur} epigrafe="ARCHIVO · ACTO FRENTE AL PALACIO MUNICIPAL" top={560} />);

  // 5 · Instituciones y Estado.
  add("fotos", F(16).inicio - 0.2, ({ dur }) => <Detalle src="IMG_5812" dur={dur} desde={[0.5, 0.62]} hasta={[0.55, 0.6]} zoom={[1.4, 1.5]} />);
  add("escuela", P(17, 0).inicio - 0.1, ({ dur }) => (
    <>
      <Detalle src="IMG_5812" dur={dur} desde={[0.78, 0.66]} hasta={[0.8, 0.64]} zoom={[1.9, 2.0]} />
      <Grande texto="LA ESCUELA PÚBLICA" top={1180} tam={90} />
    </>
  ), 3);
  add("hospital", P(17, 3).inicio - 0.1, () => (
    <AbsoluteFill style={{ backgroundColor: NEGRO }}>
      <Grande texto="EL HOSPITAL" top={760} tam={140} sub="HOSPITAL MUNICIPAL DR. JOAQUÍN LLAMBÍAS" />
    </AbsoluteFill>
  ), 3);
  add("agua-casa", P(17, 5).inicio - 0.1, ({ dur }) => (
    <>
      <Detalle src="IMG_5818" dur={dur} desde={[0.82, 0.65]} hasta={[0.8, 0.62]} zoom={[1.5, 1.6]} />
      <Grande texto="EL AGUA EN CADA CASA" top={1180} tam={84} />
    </>
  ), 3);
  add("obra", P(17, 12).inicio - 0.1, ({ dur }) => (
    <>
      <Detalle src="IMG_5813" dur={dur} desde={[0.6, 0.6]} hasta={[0.62, 0.6]} zoom={[1.3, 1.4]} />
      <Grande texto="LA OBRA PÚBLICA" top={1180} tam={96} />
    </>
  ), 3);
  add("restauracion", F(18).inicio - 0.2, ({ dur }) => (
    <>
      <Detalle src="IMG_5819" dur={dur} desde={[0.47, 0.35]} hasta={[0.47, 0.3]} zoom={[1.15, 1.2]} />
      <Grande texto="RESTAURACIÓN EN CURSO" top={1150} tam={80} sub="PALACIO MUNICIPAL · 2026" />
    </>
  ));
  add("decisiones", F(19).inicio - 0.2, ({ dur }) => <Documento src="IMG_5820" dur={dur} epigrafe="ARCHIVO · PALACIO MUNICIPAL Y PLAZA" top={600} />);

  // 6 · Desafíos.
  add("no-es-facil", F(20).inicio - 0.2, ({ dur }) => (
    <>
      <Detalle src="nasa-lagunas" dur={dur} desde={[0.62, 0.8]} hasta={[0.66, 0.78]} zoom={[1.3, 1.4]} />
      <AbsoluteFill style={{ backgroundColor: "rgba(5,5,5,0.25)" }} />
    </>
  ));
  add("cada-manana", F(21).inicio - 0.2, ({ dur }) => <Detalle src="IMG_5818" dur={dur} desde={[0.5, 0.8]} hasta={[0.5, 0.7]} zoom={[1.2, 1.3]} />);
  add("sigue", F(22).inicio - 0.2, ({ dur }) => <Detalle src="IMG_5818" dur={dur} desde={[0.5, 0.5]} hasta={[0.5, 0.3]} zoom={[1.05, 1.2]} />, 6);

  // 7 · Cierre.
  add("mapa", F(23).inicio - 0.2, ({ dur }) => <MapaGuamini dur={dur} alejar />);
  add("abuelos", P(24, 0).inicio - 0.1, ({ dur }) => <Detalle src="IMG_5815" dur={dur} desde={[0.6, 0.45]} hasta={[0.6, 0.42]} zoom={[1.6, 1.7]} />, 6);
  add("vecino", P(24, 5).inicio - 0.1, ({ dur }) => <Detalle src="IMG_5814" dur={dur} desde={[0.42, 0.5]} hasta={[0.44, 0.48]} zoom={[1.5, 1.6]} />, 6);
  add("manana", P(24, 9).inicio - 0.1, ({ dur }) => <Detalle src="IMG_5812" dur={dur} desde={[0.3, 0.85]} hasta={[0.33, 0.82]} zoom={[1.5, 1.6]} />, 6);
  add("pasado", F(25).inicio - 0.2, ({ dur }) => <Detalle src="IMG_5819" dur={dur} desde={[0.47, 0.5]} hasta={[0.47, 0.45]} zoom={[1.0, 1.04]} />, 10);
  add("presente", F(25).fin - 0.4, ({ dur }) => <Detalle src="IMG_5818" dur={dur} desde={[0.5, 0.5]} hasta={[0.5, 0.35]} zoom={[1.0, 1.15]} />, 40);
  add("placa", F(26).fin + 0.9, () => {
    const f = useCurrentFrame();
    const a = salida(f / 30);
    const b = salida((f - 40) / 30);
    return (
      <AbsoluteFill style={{ backgroundColor: NEGRO }}>
        <div style={{ position: "absolute", top: 640, left: 0, right: 0, textAlign: "center", opacity: a }}>
          <div style={{ fontFamily: "Anton, sans-serif", fontSize: 190, color: CREMA, letterSpacing: 6, lineHeight: 1 }}>GUAMINÍ</div>
          <div style={{ marginTop: 22, fontFamily: "Anton, sans-serif", fontSize: 64, color: ROJO, letterSpacing: 10 }}>1876 — 2026</div>
        </div>
        <div style={{ position: "absolute", top: 1150, left: 0, right: 0, textAlign: "center", opacity: b }}>
          <div style={{ width: 90, height: 8, backgroundColor: ROJO, margin: "0 auto 28px" }} />
          <div style={{ fontFamily: "Anton, sans-serif", fontSize: 54, letterSpacing: 8, color: CREMA }}>PATRIA EN DISPUTA</div>
          <div style={{ marginTop: 18, fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 38, color: CREMA, opacity: 0.85 }}>La historia no se mira desde afuera. Se disputa.</div>
        </div>
      </AbsoluteFill>
    );
  }, 24);
  return L.sort((a, b) => a.t - b.t);
}
const TOMAS = armar();

/* ───────────── Capas fijas ───────────── */

const Subtitulos: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / FPS;
  const b = T.bloques.find((x) => t >= x.inicio && t < x.salida);
  if (!b) return null;
  const op = Math.min(c01((t - b.inicio) / 0.15), c01((b.salida - t) / 0.15));
  return (
    <div style={{ position: "absolute", top: 1400, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: op }}>
      <div style={{ maxWidth: 960, whiteSpace: "nowrap", padding: "12px 26px 15px", backgroundColor: "rgba(5,5,5,0.62)", borderLeft: `6px solid ${ROJO}`, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 44, lineHeight: 1.22, color: CREMA, textAlign: "center" }}>
        {b.lineas.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};

function useFuentes() {
  const [listo, setListo] = useState(false);
  const [h] = useState(() => delayRender("Fuentes PD004"));
  useEffect(() => {
    Promise.all(["400 64px Anton", "600 64px Inter", "800 64px Inter", "italic 400 64px Fraunces"].map((x) => document.fonts.load(x, "ÁÉÍÓÚÑ0123456789")))
      .then(() => document.fonts.ready)
      .catch(() => undefined)
      .then(() => {
        setListo(true);
        continueRender(h);
      });
  }, [h]);
  return listo;
}

export const Episodio004: React.FC<{ conAudio?: boolean; audio?: string }> = ({ conAudio = false, audio = "audio/004-guamini.wav" }) => {
  const frame = useCurrentFrame();
  const listo = useFuentes();
  const ini = TOMAS.map((x) => Math.max(0, fr(x.t)));
  return (
    <AbsoluteFill style={{ backgroundColor: NEGRO }}>
      {listo
        ? TOMAS.map((x, i) => {
            const desde = ini[i];
            const sig = i + 1 < TOMAS.length ? ini[i + 1] + (TOMAS[i + 1].fundido ?? 8) : T.frames;
            const hasta = Math.min(T.frames, sig);
            if (hasta <= desde) return null;
            const C = x.C;
            const fd = x.fundido ?? 8;
            return (
              <Sequence key={x.id} from={desde} durationInFrames={hasta - desde} name={x.id}>
                <Fundido frames={fd}>
                  <C dur={hasta - desde} />
                </Fundido>
              </Sequence>
            );
          })
        : null}
      <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse 90% 75% at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.45) 100%)" }} />
      <Subtitulos frame={frame} />
      {conAudio ? <Audio src={staticFile(audio)} /> : null}
    </AbsoluteFill>
  );
};

/** Entrada por fundido (la toma anterior sigue debajo: fundido encadenado). */
const Fundido: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const f = useCurrentFrame();
  const o = frames <= 0 ? 1 : suave(f / frames);
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

export const DURACION_004 = T.frames;
