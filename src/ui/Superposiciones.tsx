import { AbsoluteFill, interpolate, spring } from "remotion";
import { clamp01 } from "../lib/anim";

/**
 * Capas 2D sobre la animación: subtítulos, títulos de escena, cierre,
 * fundidos, viñeta y marca. Pensadas para 1080 × 1920 y para no chocar con
 * los controles de Instagram/TikTok (zona inferior y columna derecha).
 */

export interface Palabra {
  texto: string;
  inicio: number;
  fin: number;
  destacada: boolean;
}
export interface Bloque {
  palabras: number[];
  inicio: number;
  fin: number;
  salida: number;
}

const FUENTE = "Inter, sans-serif";
const CELESTE = "#7fd8ff";

/** Subtítulos por bloques; la palabra que se dice "salta" y las clave se destacan. */
export const Subtitulos: React.FC<{ t: number; fps: number; palabras: Palabra[]; bloques: Bloque[] }> = ({ t, fps, palabras, bloques }) => {
  const b = bloques.find((x) => t >= x.inicio - 0.05 && t < x.salida);
  if (!b) return null;
  const entrada = clamp01((t - (b.inicio - 0.05)) / 0.18);
  const salida = clamp01((b.salida - t) / 0.12);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 1150,
          left: 500,
          maxWidth: 860,
          width: "max-content",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "6px 22px",
          opacity: Math.min(entrada, salida),
          transform: `translateX(-50%) translateY(${(1 - entrada) * 24}px)`,
          fontFamily: FUENTE,
          fontWeight: 800,
          fontSize: 74,
          lineHeight: 1.12,
          letterSpacing: -1.5,
          textAlign: "center",
          background: "rgba(8,16,28,0.5)",
          borderRadius: 28,
          padding: "14px 26px 18px",
          boxSizing: "border-box",
          backdropFilter: "blur(2px)",
        }}
      >
        {b.palabras.map((i) => {
          const p = palabras[i];
          const dicha = t >= p.inicio;
          const activa = t >= p.inicio && t < p.fin + 0.06;
          const pop = activa ? spring({ frame: Math.round((t - p.inicio) * fps), fps, config: { damping: 12, stiffness: 220 } }) : 0;
          const escala = 1 + 0.12 * pop * (1 - clamp01((t - p.inicio) / 0.5));
          const texto = p.destacada ? p.texto.toUpperCase() : p.texto;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                color: p.destacada ? CELESTE : "#ffffff",
                opacity: dicha ? 1 : 0.42,
                transform: `scale(${escala})`,
                textShadow: "0 4px 0 rgba(0,0,0,0.55), 0 0 24px rgba(0,0,0,0.65)",
                WebkitTextStroke: "2px rgba(10,18,30,0.55)",
              }}
            >
              {texto}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Título de capítulo al comienzo de cada escena. */
export const TituloEscena: React.FC<{ frame: number; fps: number; numero: number; titulo: string; dura?: number; grande?: boolean }> = ({
  frame,
  fps,
  numero,
  titulo,
  dura = 2.8,
  grande = false,
}) => {
  const fin = dura * fps;
  if (frame > fin + 12) return null;
  const s = spring({ frame: frame - 4, fps, config: { damping: 16, stiffness: 120 } });
  const out = interpolate(frame, [fin, fin + 12], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineas = titulo.split(" ");
  const mitad = Math.ceil(lineas.length / 2);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: grande ? 360 : 250,
          left: 70,
          right: 70,
          textAlign: "center",
          fontFamily: FUENTE,
          opacity: s * out,
          transform: `translateY(${(1 - s) * -40}px)`,
        }}
      >
        {!grande ? (
          <div
            style={{
              display: "inline-block",
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: 6,
              color: "#0f2236",
              background: CELESTE,
              padding: "8px 18px",
              borderRadius: 10,
              marginBottom: 18,
            }}
          >
            {String(numero).padStart(2, "0")}
          </div>
        ) : null}
        <div
          style={{
            fontWeight: 800,
            fontSize: grande ? 108 : 70,
            lineHeight: 1.02,
            letterSpacing: grande ? -3 : -1.5,
            color: "#ffffff",
            textShadow: "0 6px 30px rgba(0,0,0,0.55), 0 3px 0 rgba(0,0,0,0.35)",
          }}
        >
          {grande ? (
            <>
              <div>{lineas.slice(0, 3).join(" ")}</div>
              <div style={{ color: CELESTE }}>{lineas.slice(3).join(" ")}</div>
            </>
          ) : (
            <>
              <div>{lineas.slice(0, mitad).join(" ")}</div>
              <div>{lineas.slice(mitad).join(" ")}</div>
            </>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Texto final grande y contundente. */
export const CierreFinal: React.FC<{ frame: number; fps: number; texto: string }> = ({ frame, fps, texto }) => {
  if (frame < 0) return null;
  const [l1, l2] = texto.split("\n");
  const a = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const b = spring({ frame: frame - 14, fps, config: { damping: 12, stiffness: 120 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none" }}>
      <div style={{ fontFamily: FUENTE, fontWeight: 800, textAlign: "center", lineHeight: 1.0, marginTop: -120 }}>
        <div
          style={{
            fontSize: 118,
            letterSpacing: -3,
            color: "#ffffff",
            opacity: a,
            transform: `scale(${interpolate(a, [0, 1], [0.86, 1])})`,
            textShadow: "0 8px 40px rgba(0,0,0,0.6)",
          }}
        >
          {partirCierre(l1).map((x, i) => (
            <div key={i}>{x}</div>
          ))}
        </div>
        <div
          style={{
            marginTop: 34,
            fontSize: 136,
            letterSpacing: -4,
            color: CELESTE,
            opacity: b,
            transform: `translateY(${(1 - b) * 50}px) scale(${interpolate(b, [0, 1], [1.2, 1])})`,
            textShadow: "0 0 60px rgba(79,195,255,0.65), 0 8px 40px rgba(0,0,0,0.6)",
          }}
        >
          {l2}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** «EL AGUA NO SE VENDE.» → «EL AGUA» / «NO SE VENDE.» */
function partirCierre(linea: string) {
  const p = linea.split(" ");
  if (p.length <= 3) return [linea];
  return [p.slice(0, 2).join(" "), p.slice(2).join(" ")];
}

export const Fundido: React.FC<{ color: string; opacidad: number }> = ({ color, opacidad }) =>
  opacidad > 0.001 ? <AbsoluteFill style={{ backgroundColor: color, opacity: opacidad, pointerEvents: "none" }} /> : null;

export const Vineta: React.FC<{ fuerza?: number }> = ({ fuerza = 0.38 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,${fuerza}) 100%)`,
    }}
  />
);

export const Marca: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "flex-start", padding: "120px 70px", pointerEvents: "none" }}>
    <div style={{ fontFamily: FUENTE, fontWeight: 600, fontSize: 30, letterSpacing: 6, color: "rgba(255,255,255,0.85)", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
      AGUA STUDIO
    </div>
  </AbsoluteFill>
);
