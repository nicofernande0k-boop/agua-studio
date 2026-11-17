import "@fontsource/anton/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/800.css";
import "@fontsource/fraunces/400-italic.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";

/**
 * PATRIA EN DISPUTA 004 v3 — previsualización de dirección artística (45 s).
 * Fotos reales «vivas» (paralaje por profundidad, sin alterar contenido),
 * cortes en los tiempos fuertes de «BAILE INoLVIDABLE» (referencia interna).
 */

const FPS = 30;
const CREMA = "#efe6d4";
const ROJO = "#d4162c";
const INICIO = 4.8; // segundo de la canción donde arranca el video
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const sal = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const fr = (cancion: number) => Math.round((cancion - INICIO) * FPS);

type Toma = { id: string; desde: number; hasta: number; fundido?: number };
const TOMAS: Toma[] = [
  { id: "t01", desde: 4.8, hasta: 8.64 },
  { id: "t02", desde: 8.64, hasta: 11.31, fundido: 12 },
  { id: "t03", desde: 11.31, hasta: 13.98, fundido: 14 }, // de la vereda de antes a la calle de hoy
  { id: "t04", desde: 13.98, hasta: 16.63, fundido: 10 },
  { id: "t05", desde: 16.63, hasta: 19.3, fundido: 8 },
  { id: "t06", desde: 19.3, hasta: 21.97, fundido: 18 }, // el reloj de 1937 → el reloj de hoy
  { id: "t07", desde: 21.97, hasta: 24.64, fundido: 12 },
  { id: "t08", desde: 24.64, hasta: 27.31, fundido: 6 },
  { id: "t09", desde: 27.31, hasta: 29.79, fundido: 6 },
  { id: "t10", desde: 29.79, hasta: 32.46 }, // entra la voz de la canción: cortes secos en el tiempo
  { id: "t11", desde: 32.46, hasta: 35.13 },
  { id: "t12", desde: 35.13, hasta: 37.96 },
  { id: "t13", desde: 37.96, hasta: 40.63 },
  { id: "t14", desde: 40.63, hasta: 43.31 },
  { id: "t15", desde: 43.31, hasta: 45.98 },
  { id: "t16", desde: 45.98, hasta: 50.0, fundido: 6 },
];

/** Narración (texto; la voz se graba cuando se apruebe la dirección). */
const NARRACION: { desde: number; hasta: number; texto: string }[] = [
  { desde: 5.4, hasta: 8.5, texto: "Hay un lugar donde el almacenero sabe tu nombre." },
  { desde: 8.9, hasta: 12.6, texto: "Donde la vereda es una excusa para quedarse charlando." },
  { desde: 13.6, hasta: 16.5, texto: "Donde cada esquina guarda el apellido de alguien." },
  { desde: 16.9, hasta: 21.6, texto: "Donde el reloj de la plaza marcó la hora de tus abuelos… y todavía marca la tuya." },
  { desde: 22.3, hasta: 26.6, texto: "Y aunque un día te vayas lejos…" },
];

/** Frases en pantalla durante el verso (una por compás). */
const FRASES: { desde: number; hasta: number; texto: string }[] = [
  { desde: 30.0, hasta: 32.4, texto: "Las fiestas, donde se encuentra todo el pueblo." },
  { desde: 32.6, hasta: 35.1, texto: "La plaza llena, ciento cincuenta años después." },
  { desde: 35.3, hasta: 37.9, texto: "Las manos que levantaron cada calle." },
  { desde: 38.1, hasta: 40.6, texto: "Y los que hoy la siguen andando." },
  { desde: 40.8, hasta: 43.3, texto: "La escuela pública donde aprendimos a leer." },
  { desde: 43.5, hasta: 45.9, texto: "El lago de todas las tardes." },
];

const Fundido: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: frames ? c01(f / frames) : 1 }}>{children}</AbsoluteFill>;
};

/** Narración: tipografía serif cálida, abajo, que respira. */
const Narracion: React.FC<{ t: number }> = ({ t }) => {
  const n = NARRACION.find((x) => t >= x.desde && t < x.hasta);
  if (!n) return null;
  const o = Math.min(c01((t - n.desde) / 0.4), c01((n.hasta - t) / 0.35));
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 1300, textAlign: "center", opacity: o, transform: `translateY(${(1 - sal((t - n.desde) / 0.6)) * 14}px)` }}>
      <div style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 58, lineHeight: 1.22, color: CREMA, textShadow: "0 3px 24px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.8)" }}>{n.texto}</div>
    </div>
  );
};

/** Frases del verso: editoriales, con línea roja, sin animación exagerada. */
const Frase: React.FC<{ t: number }> = ({ t }) => {
  const n = FRASES.find((x) => t >= x.desde && t < x.hasta);
  if (!n) return null;
  const o = Math.min(c01((t - n.desde) / 0.18), c01((n.hasta - t) / 0.2));
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1320, opacity: o }}>
      <div style={{ width: 56, height: 7, backgroundColor: ROJO, marginBottom: 18, transform: `scaleX(${sal((t - n.desde) / 0.3)})`, transformOrigin: "left" }} />
      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 54, lineHeight: 1.12, color: CREMA, letterSpacing: -0.5, textShadow: "0 3px 22px rgba(0,0,0,0.9)" }}>{n.texto}</div>
    </div>
  );
};

/** Golpe de título: «…SIEMPRE VOLVÉS.» y GUAMINÍ, en el último compás de la intro. */
const Titulo: React.FC<{ t: number }> = ({ t }) => {
  const a = t - 27.31;
  if (a < 0 || t > 29.95) return null;
  const k = sal(a / 0.35);
  const o = c01((29.95 - t) / 0.2);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: o }}>
      <div style={{ textAlign: "center", transform: `scale(${1.12 - 0.12 * k})`, opacity: k }}>
        <div style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 64, color: CREMA, textShadow: "0 3px 24px rgba(0,0,0,0.9)" }}>…siempre volvés.</div>
        <div style={{ marginTop: 26, fontFamily: "Anton, sans-serif", fontSize: 210, letterSpacing: 8, color: CREMA, lineHeight: 1, textShadow: "0 10px 60px rgba(0,0,0,0.8)" }}>GUAMINÍ</div>
        <div style={{ width: 120, height: 10, backgroundColor: ROJO, margin: "22px auto 0", transform: `scaleX(${sal((a - 0.2) / 0.4)})` }} />
      </div>
    </AbsoluteFill>
  );
};

function useFuentes() {
  const [listo, setListo] = useState(false);
  const [h] = useState(() => delayRender("Fuentes previa 004"));
  useEffect(() => {
    Promise.all(["400 64px Anton", "800 64px Inter", "italic 400 64px Fraunces"].map((x) => document.fonts.load(x, "ÁÉÍÓÚÑ…")))
      .catch(() => undefined)
      .then(() => {
        setListo(true);
        continueRender(h);
      });
  }, [h]);
  return listo;
}

export const Previa004: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS + INICIO;
  const listo = useFuentes();
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      {TOMAS.map((x, i) => {
        const sig = TOMAS[i + 1];
        const desde = fr(x.desde) - (x.fundido ?? 0);
        const hasta = sig ? fr(sig.desde) : fr(x.hasta);
        return (
          <Sequence key={x.id} from={Math.max(0, desde)} durationInFrames={hasta - Math.max(0, desde)}>
            <Fundido frames={x.fundido ?? 0}>
              <OffthreadVideo src={staticFile(`pd4/vivo/${x.id}.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Fundido>
          </Sequence>
        );
      })}
      {/* Degradé inferior suave para la tipografía (no es textura) */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 48%, rgba(0,0,0,0.35) 62%, rgba(0,0,0,0.78) 100%)" }} />
      {listo ? (
        <>
          <Narracion t={t} />
          <Frase t={t} />
          <Titulo t={t} />
          <div style={{ position: "absolute", top: 120, left: 64, display: "flex", alignItems: "center", gap: 14, opacity: t > 29.8 ? 0.85 : 0 }}>
            <div style={{ width: 36, height: 6, backgroundColor: ROJO }} />
            <div style={{ fontFamily: "Anton, sans-serif", fontSize: 26, letterSpacing: 5, color: CREMA }}>PATRIA EN DISPUTA · 004</div>
          </div>
        </>
      ) : null}
      <Audio src={staticFile("pd4/vivo/cancion-previa.wav")} />
    </AbsoluteFill>
  );
};

export const DURACION_PREVIA_004 = Math.round((50.0 - INICIO) * FPS);
