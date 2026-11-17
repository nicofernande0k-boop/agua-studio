import "@fontsource/anton/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/800.css";
import "@fontsource/fraunces/400-italic.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import tiemposJson from "../../producciones/003-de-quien-es/tiempos.json";
import { ordinal, Chicos, Cita, CREMA, Dato, Destello, Foto, FPS, Golpe, Mapa, NEGRO, Pregunta, Regalias, ROJO, Rotulo, salida, Textura, UnoDeTres } from "./Piezas";

/**
 * PATRIA EN DISPUTA — Episodio 003: «¿De quién es la Argentina?»
 * Montaje guiado por la voz: cada corte cae en una palabra real de la narración.
 */

interface Tiempos {
  fps: number;
  duracion: number;
  frames: number;
  frases: { k: number; acto: string; texto: string; inicio: number; fin: number }[];
  palabras: { texto: string; inicio: number; fin: number; frase: number }[];
  bloques: { palabras: number[]; inicio: number; fin: number; salida: number; lineas: string[] }[];
}
const T = tiemposJson as unknown as Tiempos;
const fr = (s: number) => Math.round(s * FPS);
const F = (k: number) => T.frases[k - 1];
const P = (k: number, i: number) => {
  const ps = T.palabras.filter((p) => p.frase === k);
  return ps[i < 0 ? ps.length + i : i];
};

/** Imágenes (archivo real). Ver producciones/003-de-quien-es/CREDITOS-IMAGENES.md */
export const IMG = {
  orbita: "andes-orbita",
  petroleo: "neuquen-cuenca",
  gas: "bahia-blanca",
  puna: "salar-arizaro",
  rio: "rio-parana",
  litio: "litio-estanques",
  agua: "glaciar-viedma",
  tierra: "pampa-lagunas",
  ciudad: "buenos-aires-noche",
  ciudad2: "buenos-aires-noche-2",
  hielo: "glaciar-campo-hielo",
  lago: "lago-argentino",
  costa: "costa-atlantica-noche",
};

type Toma = { id: string; t: number; C: React.FC<{ dur: number }>; destello?: number };

const PROV_LITIO = ["Jujuy", "Salta", "Catamarca"];
const PROV_PETROLEO = ["Neuquén", "Río Negro", "Mendoza", "La Pampa", "Chubut", "Santa Cruz", "Tierra del Fuego"];

/* ─────────────────────── Tomas ─────────────────────── */

const recursos = [
  { palabra: "PETRÓLEO", img: IMG.petroleo, mov: { zoom: [1.5, 1.75] as [number, number], foco: [[0.62, 0.55], [0.6, 0.5]] as [[number, number], [number, number]] } },
  { palabra: "GAS", img: IMG.gas, mov: { zoom: [1.3, 1.55] as [number, number], foco: [[0.45, 0.45], [0.5, 0.5]] as [[number, number], [number, number]] } },
  { palabra: "LITIO", img: IMG.litio, mov: { zoom: [1.35, 1.6] as [number, number], foco: [[0.48, 0.42], [0.44, 0.4]] as [[number, number], [number, number]] } },
  { palabra: "AGUA", img: IMG.agua, mov: { zoom: [1.3, 1.55] as [number, number], foco: [[0.42, 0.45], [0.48, 0.5]] as [[number, number], [number, number]] } },
  { palabra: "TIERRA", img: IMG.tierra, mov: { zoom: [1.25, 1.5] as [number, number], foco: [[0.5, 0.5], [0.52, 0.47]] as [[number, number], [number, number]] } },
];

function armarTomas(): Toma[] {
  const tomas: Toma[] = [];
  const add = (id: string, t: number, C: React.FC<{ dur: number }>, destello?: number) => tomas.push({ id, t, C, destello });

  // ── GANCHO ─────────────────────────────────────────────
  add("tenemos", 0, ({ dur }) => (
    <>
      <Foto src={IMG.orbita} dur={dur} mov={{ zoom: [1.15, 1.4], foco: [[0.35, 0.4], [0.35, 0.45]] }} oscuro={0.5} />
      <Golpe texto="TENEMOS" top={800} tam={170} linea={false} />
    </>
  ), 0.8);
  recursos.forEach((r, j) => {
    add(`recurso-${j}`, P(1, j + 1).inicio - 0.04, ({ dur }) => (
      <>
        <Foto src={r.img} dur={dur} mov={r.mov} oscuro={0.3} />
        <Golpe texto={r.palabra} top={780} tam={j === 0 ? 210 : 250} />
      </>
    ), 0.45);
  });
  add("pregunta", F(2).inicio - 0.12, ({ dur }) => {
    const f = useCurrentFrame();
    const bn = salida((f - fr(P(2, -2).inicio - F(2).inicio + 0.12)) / 10);
    return (
      <>
        <Foto src={IMG.ciudad} dur={dur} mov={{ zoom: [1.25, 1.45], foco: [[0.55, 0.45], [0.5, 0.5]] }} bn={bn} oscuro={0.55} />
        <UnoDeTres desde={fr(P(2, 2).inicio - F(2).inicio)} top={520} />
      </>
    );
  }, 0.3);
  add("titulo", F(2).fin - 0.02, ({ dur }) => {
    const f = useCurrentFrame();
    return (
      <AbsoluteFill style={{ backgroundColor: NEGRO }}>
        <Mapa alto={1300} top={330} dibuja={salida(f / (dur * 0.8))} opacidad={0.55} />
        <div style={{ position: "absolute", top: 690, left: 0, right: 0, textAlign: "center", fontFamily: "Anton, sans-serif", color: CREMA, fontSize: 150, lineHeight: 1.02, transform: `scale(${1.2 - 0.2 * salida(f / 6)})`, textShadow: "0 10px 60px rgba(0,0,0,0.9)" }}>
          ¿DE QUIÉN ES
          <br />
          <span style={{ color: ROJO }}>LA ARGENTINA?</span>
        </div>
      </AbsoluteFill>
    );
  }, 0.7);

  // ── RIQUEZA ────────────────────────────────────────────
  add("vaca-muerta", Math.max(F(3).inicio - 0.3, F(2).fin + 0.85), ({ dur }) => (
    <>
      <Foto src={IMG.petroleo} dur={dur} mov={{ zoom: [1.2, 1.45], foco: [[0.55, 0.5], [0.65, 0.45]] }} oscuro={0.6} />
      <Rotulo texto="VACA MUERTA · NEUQUÉN" top={300} tam={32} color={ROJO} />
      <Dato valor={974} formato={(n) => `${Math.round(n)} MIL`} etiqueta="BARRILES DE PETRÓLEO POR DÍA EN EL PAÍS · RÉCORD HISTÓRICO" fuente="SECRETARÍA DE ENERGÍA · SEPTIEMBRE 2026" top={560} tam={250} desde={4} />
    </>
  ), 0.3);
  add("gas", F(4).inicio - 0.25, ({ dur }) => {
    const f = useCurrentFrame();
    return (
      <AbsoluteFill style={{ backgroundColor: NEGRO }}>
        <Mapa alto={1500} top={210} resaltar={["Neuquén"]} enciende={salida(f / 10)} relleno={0.06} zoom={1 + 0.9 * salida(f / dur)} foco={[0.35, 0.47]} opacidad={0.55} />
        <Dato valor={2} formato={ordinal} etiqueta="POTENCIAL MUNDIAL DE GAS NO CONVENCIONAL" fuente="EIA (EE. UU.) · EVALUACIÓN MUNDIAL 2013–2015" top={430} desde={3} dur={8} />
      </AbsoluteFill>
    );
  }, 0.3);
  add("litio", F(5).inicio - 0.25, ({ dur }) => (
    <>
      <Foto src={IMG.litio} dur={dur} mov={{ zoom: [1.3, 1.7], foco: [[0.4, 0.4], [0.3, 0.42]] }} oscuro={0.45} />
      <Rotulo texto="PILETAS DE LITIO · PUNA ARGENTINA, VISTAS DESDE LA ESTACIÓN ESPACIAL" top={300} tam={24} opacidad={0.8} />
      <Golpe texto="TRIÁNGULO DEL LITIO" top={640} tam={128} desde={3} />
      <Rotulo texto="ARGENTINA · BOLIVIA · CHILE" top={900} tam={36} desde={10} />
      <Rotulo texto="USGS · MINERAL COMMODITY SUMMARIES 2026" top={970} tam={24} desde={14} opacidad={0.7} />
    </>
  ), 0.3);
  add("glaciares", F(6).inicio - 0.25, ({ dur }) => (
    <>
      <Foto src={IMG.agua} dur={dur} mov={{ zoom: [1.35, 1.6], foco: [[0.45, 0.5], [0.5, 0.42]] }} oscuro={0.45} />
      <Dato valor={16968} formato={(n) => Math.round(n).toLocaleString("es-AR")} etiqueta="GLACIARES" fuente="INVENTARIO NACIONAL DE GLACIARES · IANIGLA (2018)" top={600} desde={2} dur={26} tam={250} />
    </>
  ), 0.3);
  add("territorio", F(7).inicio - 0.25, ({ dur }) => {
    const f = useCurrentFrame();
    return (
      <AbsoluteFill style={{ backgroundColor: NEGRO }}>
        <Foto src={IMG.tierra} dur={dur} mov={{ zoom: [1.2, 1.35] }} oscuro={0.8} />
        <Mapa alto={1350} top={300} dibuja={1} relleno={salida(f / (dur * 0.7))} orden={1} opacidad={0.92} />
        <Dato valor={8} formato={ordinal} etiqueta="PAÍS MÁS EXTENSO DEL MUNDO" fuente="2,78 MILLONES DE KM² CONTINENTALES" top={520} desde={6} dur={10} />
      </AbsoluteFill>
    );
  }, 0.3);

  // ── PARADOJA ───────────────────────────────────────────
  add("chicos", F(8).inicio - 0.3, ({ dur }) => {
    const f = useCurrentFrame();
    const t0 = fr(P(8, 4).inicio - F(8).inicio + 0.3); // «casi la mitad»
    return (
      <AbsoluteFill style={{ backgroundColor: NEGRO }}>
        <Foto src={IMG.ciudad2} dur={dur} mov={{ zoom: [1.3, 1.45], foco: [[0.5, 0.5], [0.55, 0.5]] }} bn={1} oscuro={0.85} />
        <Chicos rojos={9} progreso={salida((f - t0) / 24)} top={330} />
        <Dato valor={44.5} formato={(n) => `${n.toFixed(1).replace(".", ",")} %`} etiqueta="DE LOS CHICOS DE HASTA 14 AÑOS VIVE EN LA POBREZA" fuente="INDEC · EPH, 1.er SEMESTRE 2026" top={980} desde={t0 + 8} color={ROJO} tam={230} />
      </AbsoluteFill>
    );
  }, 0.15);
  add("pregunta-real", F(9).inicio - 0.2, () => {
    const f = useCurrentFrame();
    const t10 = fr(F(10).inicio - F(9).inicio + 0.2);
    const tacha = salida((f - t10 + 6) / 8);
    return (
      <AbsoluteFill style={{ backgroundColor: NEGRO }}>
        <Rotulo texto="LA PREGUNTA NO ES" top={600} tam={40} />
        <div style={{ position: "absolute", top: 690, left: 0, right: 0, textAlign: "center" }}>
          <span style={{ position: "relative", fontFamily: "Anton, sans-serif", fontSize: 170, color: CREMA, opacity: 1 - 0.55 * tacha }}>
            QUÉ TENEMOS
            <span style={{ position: "absolute", left: -20, right: -20, top: "52%", height: 16, backgroundColor: ROJO, transform: `scaleX(${tacha})`, transformOrigin: "left" }} />
          </span>
        </div>
        {f >= t10 ? <Golpe texto="ES DE QUIÉN ES." top={960} tam={150} color={ROJO} desde={t10} linea={false} /> : null}
      </AbsoluteFill>
    );
  }, 0.1);

  // ── DISPUTA ────────────────────────────────────────────
  add("de-quien-son", F(11).inicio - 0.15, ({ dur }) => {
    const f = useCurrentFrame();
    const tc = fr(P(11, 3).inicio - F(11).inicio + 0.15); // «La Constitución…»
    const tp = fr(P(11, -1).inicio - F(11).inicio + 0.15); // «provincias»
    return (
      <AbsoluteFill style={{ backgroundColor: NEGRO }}>
        <Mapa alto={1400} top={330} relleno={0.1} resaltar={f >= tp ? [...PROV_PETROLEO, ...PROV_LITIO] : []} enciende={salida((f - tp) / 10)} opacidad={0.38} />
        <Pregunta texto="¿DE QUIÉN SON?" />
        <Cita desde={tc} top={720} />
        <div style={{ display: "none" }}>{dur}</div>
      </AbsoluteFill>
    );
  }, 0.35);
  add("extraen", F(12).inicio - 0.15, ({ dur }) => {
    const ti = fr(P(12, 3).inicio - F(12).inicio + 0.15);
    const te = fr(P(12, 5).inicio - F(12).inicio + 0.15);
    return (
      <>
        <Foto src={IMG.litio} dur={dur} mov={{ zoom: [2.0, 2.3], foco: [[0.3, 0.42], [0.36, 0.4]] }} oscuro={0.85} bn={0.35} />
        <Pregunta texto="¿QUIÉN LOS EXTRAE?" />
        <Golpe texto="GRANDES EMPRESAS." top={760} tam={112} desde={ti} linea={false} />
        <Golpe texto="MUCHAS, EXTRANJERAS." top={900} tam={112} color={ROJO} desde={te} />
      </>
    );
  }, 0.35);
  add("cuanto-queda", F(13).inicio - 0.15, () => {
    const tr = fr(P(13, 2).inicio - F(13).inicio + 0.15);
    return (
      <AbsoluteFill style={{ backgroundColor: NEGRO }}>
        <Pregunta texto="¿CUÁNTO QUEDA?" />
        <Regalias desde={tr} top={640} />
      </AbsoluteFill>
    );
  }, 0.35);
  add("agua", F(14).inicio - 0.15, ({ dur }) => {
    const tl = fr(P(14, 4).inicio - F(14).inicio + 0.15);
    return (
      <>
        <Foto src={IMG.hielo} dur={dur} mov={{ zoom: [1.3, 1.6], foco: [[0.55, 0.5], [0.5, 0.55]] }} oscuro={0.9} bn={0.3} />
        <Pregunta texto="¿QUIÉN CUIDA EL AGUA?" />
        {useCurrentFrame() >= tl ? (
          <div style={{ position: "absolute", top: 730, left: 0, right: 0, textAlign: "center" }}>
            <span style={{ display: "inline-block", backgroundColor: ROJO, color: CREMA, fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 25, letterSpacing: 3, padding: "10px 20px", whiteSpace: "nowrap" }}>
              LEY 27.804 · REFORMA DE LA LEY DE GLACIARES (2026)
            </span>
          </div>
        ) : null}
        <Golpe texto="CADA PROVINCIA ELIGE" top={830} tam={104} desde={tl + 6} linea={false} />
        <Golpe texto="QUÉ GLACIARES PROTEGER" top={950} tam={92} desde={tl + 14} />
        <Rotulo texto="LA REFORMA ESTÁ CUESTIONADA EN LA JUSTICIA · AMPARO EN TRÁMITE" top={1130} tam={22} desde={tl + 22} opacidad={0.75} />
      </>
    );
  }, 0.35);
  add("reglas", F(15).inicio - 0.15, () => {
    const t30 = fr(P(15, 3).inicio - F(15).inicio + 0.15);
    return (
      <AbsoluteFill style={{ backgroundColor: NEGRO }}>
        <Pregunta texto="¿Y LAS REGLAS?" />
        <Dato valor={30} formato={(n) => `${Math.round(n)} AÑOS`} etiqueta="DE ESTABILIDAD FISCAL, ADUANERA Y CAMBIARIA PARA GRANDES INVERSIONES" fuente="RIGI · LEY 27.742 (2024)" top={640} desde={t30} dur={18} />
      </AbsoluteFill>
    );
  }, 0.35);
  const actores = [
    { palabra: "EMPRESAS.", img: IMG.litio, foco: [0.25, 0.42] },
    { palabra: "NACIÓN.", img: IMG.ciudad, foco: [0.6, 0.5] },
    { palabra: "PROVINCIAS.", img: "", foco: [0.5, 0.5] },
    { palabra: "COMUNIDADES.", img: IMG.puna, foco: [0.5, 0.6] },
  ];
  actores.forEach((a, j) => {
    add(`actor-${j}`, P(16, j).inicio - 0.05, ({ dur }) => (
      <>
        {a.img ? (
          <Foto src={a.img} dur={dur} mov={{ zoom: [1.6, 1.75], foco: [a.foco as [number, number], a.foco as [number, number]] }} oscuro={0.6} bn={0.6} rojo={0.18} />
        ) : (
          <AbsoluteFill style={{ backgroundColor: NEGRO }}>
            <Mapa alto={1400} top={300} relleno={0.15} resaltar={[...PROV_PETROLEO, ...PROV_LITIO]} enciende={1} opacidad={0.6} />
          </AbsoluteFill>
        )}
        <Golpe texto={a.palabra} top={820} tam={a.palabra.length > 10 ? 150 : 180} />
      </>
    ), 0.6);
  });
  add("disputa", F(17).inicio - 0.1, ({ dur }) => {
    const f = useCurrentFrame();
    // Montaje que se acelera: cada imagen dura menos que la anterior.
    const imgs = [IMG.petroleo, IMG.gas, IMG.litio, IMG.agua, IMG.tierra, IMG.ciudad, IMG.puna, IMG.hielo, IMG.rio, IMG.orbita, IMG.lago, IMG.ciudad2];
    let acum = 0;
    let idx = 0;
    for (let i = 0; i < 60; i++) {
      const largo = Math.max(3, Math.round(14 * Math.pow(0.82, i)));
      if (f < acum + largo) {
        idx = i;
        break;
      }
      acum += largo;
      idx = i + 1;
    }
    const td = fr(P(17, 4).inicio - F(17).inicio + 0.1); // «quién decide»
    const tb = fr(P(17, 7).inicio - F(17).inicio + 0.1); // «quién se beneficia»
    return (
      <AbsoluteFill style={{ backgroundColor: NEGRO }}>
        <Sequence from={acum} durationInFrames={dur} layout="none">
          <Foto src={imgs[idx % imgs.length]} dur={30} mov={{ zoom: [1.5 + (idx % 3) * 0.2, 1.7 + (idx % 3) * 0.2], foco: [[0.3 + (idx % 4) * 0.12, 0.45], [0.35 + (idx % 4) * 0.12, 0.5]] }} oscuro={0.55} bn={0.4} />
        </Sequence>
        <Rotulo texto="TODOS DISPUTAN LO MISMO" top={520} tam={40} />
        {f >= td ? <Golpe texto="¿QUIÉN DECIDE?" top={640} tam={150} desde={td} linea={false} /> : null}
        {f >= tb ? <Golpe texto="¿QUIÉN SE BENEFICIA?" top={820} tam={118} color={ROJO} desde={tb} /> : null}
      </AbsoluteFill>
    );
  }, 0.3);

  // ── CIERRE ─────────────────────────────────────────────
  add("riqueza", F(18).inicio - 0.3, ({ dur }) => {
    const f = useCurrentFrame();
    const t19 = fr(F(19).inicio - F(18).inicio + 0.3);
    const o1 = salida((f - 6) / 14);
    const o2 = salida((f - t19) / 12);
    return (
      <AbsoluteFill style={{ backgroundColor: NEGRO }}>
        <Foto src={IMG.costa} dur={dur} mov={{ zoom: [1.6, 1.9], foco: [[0.42, 0.62], [0.4, 0.66]] }} oscuro={0.35} />
        <div style={{ position: "absolute", top: 640, left: 90, right: 90, textAlign: "center", fontFamily: "Fraunces, serif", fontStyle: "italic", color: CREMA, fontSize: 76, lineHeight: 1.18, textShadow: "0 4px 40px rgba(0,0,0,0.95)" }}>
          <div style={{ opacity: o1 * (1 - 0.25 * o2) }}>La riqueza no está bajo el suelo.</div>
          <div style={{ marginTop: 40, opacity: o2, color: "#ffffff", fontSize: 92 }}>Está en las decisiones.</div>
        </div>
      </AbsoluteFill>
    );
  });
  add("soberania", F(20).inicio - 0.25, ({ dur }) => {
    const f = useCurrentFrame();
    const t21 = fr(F(21).inicio - F(20).inicio + 0.25);
    const tfin = fr(F(21).fin - F(20).inicio + 0.25);
    const a = salida((f - 2) / 10);
    const b = salida((f - t21) / 8);
    const g = f >= tfin ? salida((f - tfin) / 5) : 0;
    const marca = salida((f - tfin - 24) / 14);
    return (
      <AbsoluteFill style={{ backgroundColor: NEGRO }}>
        <div style={{ position: "absolute", top: 520, left: 70, right: 70, textAlign: "center", fontFamily: "Anton, sans-serif", color: CREMA, lineHeight: 1.04 }}>
          <div style={{ fontSize: 112, opacity: a * (1 - 0.35 * b), transform: `translateY(${(1 - a) * 30}px)` }}>
            UN PAÍS NO ES SOBERANO
            <br />
            POR LO QUE TIENE.
          </div>
          <div style={{ marginTop: 70, fontSize: 124, opacity: b, transform: `scale(${1.15 - 0.15 * b + 0.04 * g})` }}>
            ES SOBERANO
            <br />
            POR LO QUE <span style={{ color: ROJO }}>DECIDE.</span>
          </div>
          <div style={{ width: 160, height: 12, backgroundColor: ROJO, margin: "60px auto 0", transform: `scaleX(${g})` }} />
        </div>
        <div style={{ position: "absolute", top: 1360, left: 0, right: 0, textAlign: "center", opacity: marca }}>
          <div style={{ fontFamily: "Anton, sans-serif", fontSize: 62, letterSpacing: 8, color: CREMA }}>PATRIA EN DISPUTA</div>
          <div style={{ marginTop: 12, fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: 8, color: ROJO }}>EPISODIO 003</div>
        </div>
        <div style={{ display: "none" }}>{dur}</div>
      </AbsoluteFill>
    );
  }, 0.2);
  return tomas.sort((x, y) => x.t - y.t);
}

const TOMAS = armarTomas();

/* ─────────────────────── Capas fijas ─────────────────────── */

/** Frases que ya se muestran como tipografía: sin subtítulo. */
const SIN_SUBTITULO = new Set([1, 9, 10, 16, 18, 19, 20, 21]);

const Subtitulos: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / FPS;
  const b = T.bloques.find((x) => t >= x.inicio && t < x.salida);
  if (!b) return null;
  if (SIN_SUBTITULO.has(T.palabras[b.palabras[0]].frase)) return null;
  const op = Math.min(Math.min(1, (t - b.inicio) / 0.12), Math.min(1, (b.salida - t) / 0.12));
  return (
    <div style={{ position: "absolute", top: 1395, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: op }}>
      <div style={{ maxWidth: 960, whiteSpace: "nowrap", padding: "12px 26px 15px", backgroundColor: "rgba(5,5,5,0.66)", borderLeft: `6px solid ${ROJO}`, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 44, lineHeight: 1.22, color: CREMA, textAlign: "center" }}>
        {b.lineas.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};

/** Firma discreta arriba a la izquierda (fuera del título y del cierre). */
const Firma: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / FPS;
  const visible = t > F(3).inicio - 0.3 && t < F(18).inicio - 0.4;
  if (!visible) return null;
  return (
    <div style={{ position: "absolute", top: 150, left: 64, display: "flex", alignItems: "center", gap: 16, opacity: 0.85 }}>
      <div style={{ width: 40, height: 6, backgroundColor: ROJO }} />
      <div style={{ fontFamily: "Anton, sans-serif", fontSize: 28, letterSpacing: 5, color: CREMA }}>PATRIA EN DISPUTA · 003</div>
    </div>
  );
};

function useFuentes() {
  const [listo, setListo] = useState(false);
  const [h] = useState(() => delayRender("Fuentes PD003"));
  useEffect(() => {
    Promise.all(["400 64px Anton", "600 64px Inter", "800 64px Inter", "italic 400 64px Fraunces"].map((x) => document.fonts.load(x, "ÁÉÍÓÚÑ¿?0123456789")))
      .then(() => document.fonts.ready)
      .catch(() => undefined)
      .then(() => {
        setListo(true);
        continueRender(h);
      });
  }, [h]);
  return listo;
}

export const Episodio003: React.FC<{ conAudio?: boolean }> = ({ conAudio = false }) => {
  const frame = useCurrentFrame();
  const listo = useFuentes();
  const inicios = TOMAS.map((x) => Math.max(0, fr(x.t)));
  return (
    <AbsoluteFill style={{ backgroundColor: NEGRO }}>
      {listo
        ? TOMAS.map((x, i) => {
            const desde = inicios[i];
            const hasta = i + 1 < TOMAS.length ? inicios[i + 1] : T.frames;
            if (hasta <= desde) return null;
            const C = x.C;
            return (
              <Sequence key={x.id} from={desde} durationInFrames={hasta - desde} name={x.id}>
                <C dur={hasta - desde} />
                {x.destello ? <Destello fuerza={x.destello} /> : null}
              </Sequence>
            );
          })
        : null}
      <Textura frame={frame} />
      <Firma frame={frame} />
      <Subtitulos frame={frame} />
      {conAudio ? <Audio src={staticFile("audio/003-de-quien-es.wav")} /> : null}
    </AbsoluteFill>
  );
};

export const DURACION_003 = T.frames;
export { CREMA };
