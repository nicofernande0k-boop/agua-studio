import "@fontsource/anton/400.css";
import "@fontsource/inter/800.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, Img, continueRender, delayRender, staticFile } from "remotion";
import { CREMA, Mapa, NEGRO, ROJO } from "./Piezas";

/** Portada 9:16 del episodio 003: piletas de litio reales, el mapa en rojo y la pregunta. */
export const Portada003: React.FC = () => {
  const [listo, setListo] = useState(false);
  const [h] = useState(() => delayRender("Fuentes portada 003"));
  useEffect(() => {
    Promise.all(["400 64px Anton", "800 64px Inter"].map((x) => document.fonts.load(x, "¿ÉÚ?")))
      .catch(() => undefined)
      .then(() => {
        setListo(true);
        continueRender(h);
      });
  }, [h]);
  return (
    <AbsoluteFill style={{ backgroundColor: NEGRO }}>
      <Img
        src={staticFile("pd3/litio-estanques.jpg")}
        style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", objectPosition: "38% 42%", transform: "scale(1.55)", transformOrigin: "38% 42%", filter: "contrast(1.15) saturate(0.7) brightness(0.8)" }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.35) 34%, rgba(5,5,5,0.35) 52%, rgba(5,5,5,0.95) 78%, #050505 100%)" }} />
      <Mapa alto={860} top={220} resaltar={[]} relleno={0} dibuja={1} opacidad={0.55} />
      {listo ? (
        <>
          <div style={{ position: "absolute", top: 120, left: 70, display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 54, height: 8, backgroundColor: ROJO }} />
            <div style={{ fontFamily: "Anton, sans-serif", fontSize: 40, letterSpacing: 7, color: CREMA }}>PATRIA EN DISPUTA</div>
          </div>
          <div style={{ position: "absolute", top: 1010, left: 60, right: 60, fontFamily: "Anton, sans-serif", color: CREMA, fontSize: 178, lineHeight: 0.98, whiteSpace: "nowrap", textShadow: "0 12px 60px rgba(0,0,0,0.8)" }}>
            ¿DE QUIÉN
            <br />
            ES LA
            <br />
            <span style={{ color: ROJO }}>ARGENTINA?</span>
          </div>
          <div style={{ position: "absolute", top: 1590, left: 66, right: 66, fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 34, letterSpacing: 5, color: CREMA, lineHeight: 1.4 }}>
            PETRÓLEO · GAS · LITIO · AGUA · TIERRA
          </div>
          <div style={{ position: "absolute", top: 1710, left: 66, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 36, height: 6, backgroundColor: ROJO }} />
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: 8, color: CREMA, opacity: 0.85 }}>EPISODIO 003</div>
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
