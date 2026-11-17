import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import mapa from "../pd/datos/argentina.json";

/**
 * PATRIA EN DISPUTA — piezas gráficas del episodio 003.
 * Fotografía documental real con movimiento de cámara, tipografía editorial,
 * cifras que cuentan, mapa vectorial y pictogramas. Negro, rojo y crema.
 */

export const NEGRO = "#050505";
export const ROJO = "#d4162c";
export const CREMA = "#efe6d4";
export const FPS = 30;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const suave = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
export const salida = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

/* ─────────────────────────── Fotografía ─────────────────────────── */

export interface Movimiento {
  /** Escala inicial y final. */
  zoom?: [number, number];
  /** Punto de interés (0..1) al principio y al final. */
  foco?: [[number, number], [number, number]];
  /** Giro leve en grados. */
  giro?: [number, number];
}

/**
 * Foto a pantalla completa con movimiento de cámara continuo, gradación
 * documental (contraste, color contenido) y degradés para el texto.
 */
export const Foto: React.FC<{
  src: string;
  dur: number;
  mov?: Movimiento;
  bn?: number;
  oscuro?: number;
  rojo?: number;
}> = ({ src, dur, mov = {}, bn = 0, oscuro = 0.35, rojo = 0 }) => {
  const f = useCurrentFrame();
  const u = clamp01(f / Math.max(1, dur));
  const [z0, z1] = mov.zoom ?? [1.08, 1.22];
  const [[x0, y0], [x1, y1]] = mov.foco ?? [
    [0.5, 0.5],
    [0.5, 0.5],
  ];
  const [g0, g1] = mov.giro ?? [0, 0];
  const e = suave(u * 0.85 + 0.15 * u);
  const z = z0 + (z1 - z0) * e;
  const fx = x0 + (x1 - x0) * e;
  const fy = y0 + (y1 - y0) * e;
  // Impacto de entrada: 1,5 % extra que se asienta en 6 fotogramas.
  const golpe = 1 + 0.035 * Math.exp(-f / 3);
  return (
    <AbsoluteFill style={{ backgroundColor: NEGRO, overflow: "hidden" }}>
      <Img
        src={staticFile(`pd3/${src}.jpg`)}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${fx * 100}% ${fy * 100}%`,
          transform: `scale(${z * golpe}) rotate(${g0 + (g1 - g0) * e}deg)`,
          transformOrigin: `${fx * 100}% ${fy * 100}%`,
          filter: `contrast(1.14) saturate(${0.78 - bn * 0.78}) brightness(${0.92 - bn * 0.08})`,
        }}
      />
      {rojo > 0 ? <AbsoluteFill style={{ backgroundColor: ROJO, mixBlendMode: "multiply", opacity: rojo }} /> : null}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(5,5,5,${0.55 + oscuro * 0.3}) 0%, rgba(5,5,5,${oscuro * 0.4}) 28%, rgba(5,5,5,${oscuro * 0.35}) 62%, rgba(5,5,5,${0.6 + oscuro * 0.3}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/* ─────────────────────────── Tipografía ─────────────────────────── */

/** Palabra gigante que entra de golpe (escala + desenfoque de movimiento). */
export const Golpe: React.FC<{ texto: string; top?: number; tam?: number; color?: string; desde?: number; linea?: boolean }> = ({
  texto,
  top = 760,
  tam = 230,
  color = CREMA,
  desde = 0,
  linea = true,
}) => {
  const f = useCurrentFrame() - desde;
  if (f < 0) return null;
  const k = salida(f / 5);
  const s = 1.45 - 0.45 * k;
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center" }}>
      <div
        style={{
          display: "inline-block",
          fontFamily: "Anton, sans-serif",
          fontSize: tam,
          lineHeight: 0.95,
          color,
          letterSpacing: 2,
          transform: `scale(${s})`,
          filter: `blur(${(1 - k) * 10}px)`,
          opacity: clamp01(f / 2),
          textShadow: "0 10px 50px rgba(0,0,0,0.65)",
        }}
      >
        {texto}
      </div>
      {linea ? (
        <div style={{ width: 150, height: 12, backgroundColor: ROJO, margin: "26px auto 0", transform: `scaleX(${salida((f - 3) / 7)})` }} />
      ) : null}
    </div>
  );
};

/** Rótulo pequeño en mayúsculas espaciadas (etiquetas y fuentes). */
export const Rotulo: React.FC<{ texto: string; top: number; tam?: number; color?: string; desde?: number; opacidad?: number; ancho?: number }> = ({
  texto,
  top,
  tam = 34,
  color = CREMA,
  desde = 0,
  opacidad = 1,
  ancho = 880,
}) => {
  const f = useCurrentFrame() - desde;
  if (f < 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: (1080 - ancho) / 2,
        width: ancho,
        textAlign: "center",
        fontFamily: "Inter, sans-serif",
        fontWeight: 800,
        fontSize: tam,
        letterSpacing: tam * 0.16,
        lineHeight: 1.3,
        color,
        opacity: clamp01(f / 6) * opacidad,
        transform: `translateY(${(1 - salida(f / 8)) * 18}px)`,
        textShadow: "0 2px 18px rgba(0,0,0,0.8)",
      }}
    >
      {texto}
    </div>
  );
};

/** Ordinal editorial: «2.º» con la «o» volada y subrayada. */
export const ordinal = (n: number) => (
  <>
    {Math.max(1, Math.round(n))}
    <span style={{ fontSize: "0.42em", verticalAlign: "0.95em", marginLeft: "0.04em", borderBottom: "0.06em solid currentColor", lineHeight: 1 }}>o</span>
  </>
);

/** Cifra que cuenta hasta su valor, con etiqueta y fuente. */
export const Dato: React.FC<{
  valor: number;
  formato: (n: number) => React.ReactNode;
  etiqueta: string;
  fuente: string;
  top?: number;
  desde?: number;
  dur?: number;
  color?: string;
  tam?: number;
}> = ({ valor, formato, etiqueta, fuente, top = 560, desde = 0, dur = 22, color = CREMA, tam = 300 }) => {
  const f = useCurrentFrame() - desde;
  if (f < 0) return null;
  const k = salida(f / dur);
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center" }}>
      <div
        style={{
          fontFamily: "Anton, sans-serif",
          fontSize: tam,
          lineHeight: 1,
          color,
          transform: `scale(${1.25 - 0.25 * salida(f / 6)})`,
          opacity: clamp01(f / 3),
          fontVariantNumeric: "tabular-nums",
          textShadow: "0 12px 60px rgba(0,0,0,0.7)",
        }}
      >
        {formato(valor * k)}
      </div>
      <div style={{ width: 120, height: 10, backgroundColor: ROJO, margin: "18px auto 26px", transform: `scaleX(${salida((f - 4) / 8)})` }} />
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          fontSize: 40,
          letterSpacing: 5,
          lineHeight: 1.25,
          color: CREMA,
          opacity: clamp01((f - 6) / 6),
          padding: "0 90px",
          textShadow: "0 2px 18px rgba(0,0,0,0.9)",
        }}
      >
        {etiqueta}
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          fontSize: 25,
          letterSpacing: 3,
          color: CREMA,
          opacity: 0.72 * clamp01((f - 10) / 8),
          textShadow: "0 2px 12px rgba(0,0,0,0.9)",
        }}
      >
        {fuente}
      </div>
    </div>
  );
};

/** Pregunta roja de la sección «disputa»: entra golpeando y queda arriba. */
export const Pregunta: React.FC<{ texto: string; desde?: number; top?: number }> = ({ texto, desde = 0, top = 250 }) => {
  const f = useCurrentFrame() - desde;
  if (f < 0) return null;
  const k = salida(f / 6);
  return (
    <div style={{ position: "absolute", top, left: 60, right: 60, textAlign: "left" }}>
      <div style={{ width: 90, height: 10, backgroundColor: ROJO, marginBottom: 22, transform: `scaleX(${k})`, transformOrigin: "left" }} />
      <div
        style={{
          fontFamily: "Anton, sans-serif",
          fontSize: 132,
          lineHeight: 1,
          color: CREMA,
          transform: `translateX(${(1 - k) * -40}px)`,
          opacity: clamp01(f / 3),
          textShadow: "0 8px 40px rgba(0,0,0,0.75)",
        }}
      >
        {texto}
      </div>
    </div>
  );
};

/* ─────────────────────────── Mapa ─────────────────────────── */

interface Prov {
  nombre: string;
  anillos: number[][][];
}
const PROVS = (mapa as unknown as { provincias: Prov[]; ancho: number }).provincias;
const ANCHO_MAPA = (mapa as unknown as { ancho: number }).ancho;

function caminos(p: Prov) {
  return p.anillos.map((a) => "M" + a.map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`).join("L") + "Z").join("");
}
const CAMINOS = PROVS.map((p) => ({ nombre: p.nombre, d: caminos(p) }));

/**
 * Mapa de Argentina (con Islas Malvinas). `dibuja` traza el contorno, `relleno`
 * pinta todas las provincias de crema, `resaltar` enciende algunas en rojo.
 */
export const Mapa: React.FC<{
  alto?: number;
  top?: number;
  dibuja?: number;
  relleno?: number;
  resaltar?: string[];
  enciende?: number;
  orden?: number;
  zoom?: number;
  foco?: [number, number];
  opacidad?: number;
}> = ({ alto = 1250, top = 330, dibuja = 1, relleno = 0, resaltar = [], enciende = 1, orden = 0, zoom = 1, foco = [0.5, 0.5], opacidad = 1 }) => {
  const ancho = alto * ANCHO_MAPA;
  return (
    <div style={{ position: "absolute", top, left: (1080 - ancho) / 2, width: ancho, height: alto, opacity: opacidad }}>
      <svg
        viewBox={`0 0 ${ANCHO_MAPA} 1`}
        width={ancho}
        height={alto}
        style={{ overflow: "visible", transform: `scale(${zoom})`, transformOrigin: `${foco[0] * 100}% ${foco[1] * 100}%` }}
      >
        <defs>
          <filter id="brillo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.006" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {CAMINOS.map((c, i) => {
          const rojo = resaltar.includes(c.nombre);
          // Relleno escalonado de norte a sur cuando `orden` > 0.
          const r = orden > 0 ? clamp01(relleno * 1.6 - (i / CAMINOS.length) * 0.6) : relleno;
          return (
            <path
              key={c.nombre}
              d={c.d}
              pathLength={1}
              fill={rojo ? ROJO : CREMA}
              fillOpacity={rojo ? 0.9 * enciende : r * 0.88}
              stroke={rojo && enciende > 0.5 ? "#ff5a6a" : CREMA}
              strokeWidth={0.0022}
              strokeOpacity={0.9}
              strokeDasharray={1}
              strokeDashoffset={1 - dibuja}
              filter={rojo ? "url(#brillo)" : undefined}
            />
          );
        })}
      </svg>
    </div>
  );
};

/* ─────────────────────────── Pictogramas ─────────────────────────── */

const Nene: React.FC<{ color: string; tam: number }> = ({ color, tam }) => (
  <svg width={tam} height={tam * 1.7} viewBox="0 0 10 17">
    <circle cx="5" cy="2.6" r="2.4" fill={color} />
    <path d="M1.4 6.2 Q5 4.8 8.6 6.2 L8 11.2 L6.6 11.2 L6.4 16.6 L5.4 16.6 L5 12.2 L4.6 16.6 L3.6 16.6 L3.4 11.2 L2 11.2 Z" fill={color} />
  </svg>
);

/** Grilla de 20 chicos: `rojos` se encienden en rojo uno a uno. */
export const Chicos: React.FC<{ rojos: number; progreso: number; top?: number }> = ({ rojos, progreso, top = 420 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top, left: 140, right: 140, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "26px 34px" }}>
      {Array.from({ length: 20 }, (_, i) => {
        const aparece = clamp01((f - i * 0.8) / 5);
        const rojo = i < rojos && progreso * rojos > i;
        return (
          <div key={i} style={{ opacity: aparece, transform: `translateY(${(1 - aparece) * 20}px)` }}>
            <Nene color={rojo ? ROJO : CREMA} tam={84} />
          </div>
        );
      })}
    </div>
  );
};

/** «1 DE CADA 3»: tres personas, una en rojo. */
export const UnoDeTres: React.FC<{ desde?: number; top?: number }> = ({ desde = 0, top = 560 }) => {
  const f = useCurrentFrame() - desde;
  if (f < 0) return null;
  const k = salida(f / 6);
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 70, marginBottom: 40 }}>
        {[0, 1, 2].map((i) => {
          const a = clamp01((f - i * 3) / 5);
          return (
            <div key={i} style={{ opacity: a, transform: `scale(${1.3 - 0.3 * a})` }}>
              <Nene color={i === 2 && f > 12 ? ROJO : CREMA} tam={150} />
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily: "Anton, sans-serif", fontSize: 170, color: CREMA, lineHeight: 1, transform: `scale(${1.3 - 0.3 * k})`, opacity: k, textShadow: "0 10px 50px rgba(0,0,0,0.7)" }}>
        1 DE CADA <span style={{ color: ROJO }}>3</span>
      </div>
      <div style={{ marginTop: 18, fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 38, letterSpacing: 6, color: CREMA, opacity: clamp01((f - 8) / 6) }}>
        ARGENTINOS ES POBRE
      </div>
      <div style={{ marginTop: 14, padding: "0 110px", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 24, letterSpacing: 2, lineHeight: 1.4, color: CREMA, opacity: 0.7 * clamp01((f - 12) / 6) }}>
        POBREZA: 32,3 % DE LAS PERSONAS · INDEC, 1.er SEMESTRE 2026
      </div>
    </div>
  );
};

/** Barra de regalías: 100 % del valor contra lo que cobra la provincia. */
export const Regalias: React.FC<{ desde?: number; top?: number }> = ({ desde = 0, top = 640 }) => {
  const f = useCurrentFrame() - desde;
  if (f < 0) return null;
  const llena = salida(f / 18);
  const roja = salida((f - 16) / 12);
  return (
    <div style={{ position: "absolute", top, left: 110, right: 110 }}>
      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 30, letterSpacing: 5, color: CREMA, marginBottom: 16, opacity: clamp01(f / 6) }}>
        VALOR DEL MINERAL EN BOCA DE MINA
      </div>
      <div style={{ height: 70, backgroundColor: "rgba(239,230,212,0.16)", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, width: `${llena * 100}%`, backgroundColor: CREMA, opacity: 0.85 }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${roja * 5}%`, backgroundColor: ROJO, boxShadow: "0 0 30px rgba(212,22,44,0.9)" }} />
      </div>
      <div style={{ marginTop: 40, textAlign: "center", fontFamily: "Anton, sans-serif", fontSize: 250, lineHeight: 1, color: ROJO, opacity: roja, transform: `scale(${1.25 - 0.25 * roja})` }}>
        3–5 %
      </div>
      <div style={{ textAlign: "center", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 38, letterSpacing: 5, color: CREMA, marginTop: 16, opacity: clamp01((f - 24) / 6) }}>
        TOPE DE REGALÍAS PARA LA PROVINCIA
      </div>
      <div style={{ textAlign: "center", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 25, letterSpacing: 3, color: CREMA, marginTop: 18, opacity: 0.72 * clamp01((f - 30) / 6) }}>
        LEY 24.196, ART. 22 · HASTA 5 % SOLO EN PROYECTOS NUEVOS (LEY 27.743)
      </div>
    </div>
  );
};

/** Cita de la Constitución (art. 124). */
export const Cita: React.FC<{ desde?: number; top?: number }> = ({ desde = 0, top = 560 }) => {
  const f = useCurrentFrame() - desde;
  if (f < 0) return null;
  const palabras = "«Corresponde a las provincias el dominio originario de los recursos naturales existentes en su territorio.»".split(" ");
  return (
    <div style={{ position: "absolute", top, left: 100, right: 100 }}>
      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 30, letterSpacing: 6, color: ROJO, marginBottom: 26, opacity: clamp01(f / 5) }}>
        CONSTITUCIÓN NACIONAL · ART. 124
      </div>
      <div style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 66, lineHeight: 1.22, color: CREMA, textShadow: "0 4px 30px rgba(0,0,0,0.85)" }}>
        {palabras.map((w, i) => (
          <span key={i} style={{ opacity: clamp01((f - 4 - i * 1.6) / 4), color: /provincias|recursos|naturales/.test(w) ? "#ffd9d0" : CREMA }}>
            {w}{" "}
          </span>
        ))}
      </div>
    </div>
  );
};

/** Grano de película (SVG) y viñeta. */
export const Textura: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse 85% 70% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)" }} />
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.13 }}>
      <svg width="1080" height="1920">
        <filter id="grano3">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 89} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter="url(#grano3)" />
      </svg>
    </AbsoluteFill>
  </>
);

/** Destello de corte (crema → transparente) para los golpes. */
export const Destello: React.FC<{ fuerza?: number }> = ({ fuerza = 0.55 }) => {
  const f = useCurrentFrame();
  const o = fuerza * Math.exp(-f / 2.2);
  if (o < 0.01) return null;
  return <AbsoluteFill style={{ backgroundColor: CREMA, opacity: o, mixBlendMode: "screen" }} />;
};

export { interpolate, spring };
