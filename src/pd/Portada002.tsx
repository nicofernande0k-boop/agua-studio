import "@fontsource/anton/400.css";
import "@fontsource/inter/800.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { CREMA, HiloRojo, ROJO, Toma3D } from "./Escena";
import { Multitud, manoDerecha, type Persona } from "./Multitud";
import { U, useCamara } from "./tomas/comun";

/** Portada oficial del episodio 002 (imagen fija 1080 × 1920). */
export const Portada002: React.FC = () => {
  const [listo, setListo] = useState(false);
  const [h] = useState(() => delayRender("Fuentes portada"));
  useEffect(() => {
    Promise.all(["400 64px Anton", "800 64px Inter"].map((x) => document.fonts.load(x))).then(() => {
      setListo(true);
      continueRender(h);
    });
  }, [h]);
  const camara = useCamara([U(0, [2.0, 3.6, 10.5], [0.5, -0.6, 0], 30), U(1, [2.0, 3.6, 10.5], [0.5, -0.6, 0], 30)]);
  const persona: Persona = { p: [0, 0, 0], rumbo: 0.35, cabeza: 0.45, manoD: 0.12, codo: 0.1, tono: 0.55 };
  const mano = manoDerecha(persona);
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      <Toma3D
        camara={camara}
        temblor={0}
        ambiente={() => ({ niebla: [8, 30], relleno: 0.04 })}
        luces={() => [{ pos: [0.2, 11, 0.4], apunta: [0, 0, 0], intensidad: 220, angulo: 0.17, penumbra: 0.35, color: "#f4ece0", cono: 0.14 }]}
      >
        {() => (
          <>
            <Multitud personas={[persona]} />
            <HiloRojo puntos={[mano, [mano[0] + 0.1, 0.4, mano[2] + 0.15], [mano[0] + 0.5, 0.02, mano[2] + 0.7], [mano[0] + 1.6, 0.01, mano[2] + 1.4], [mano[0] + 3.5, 0.01, mano[2] + 1.9]]} grosor={0.02} />
          </>
        )}
      </Toma3D>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,5,5,0.85) 0%, rgba(5,5,5,0) 18%, rgba(5,5,5,0) 50%, rgba(5,5,5,0.9) 66%, #050505 100%)" }} />
      {listo ? (
        <AbsoluteFill style={{ fontFamily: "Anton, sans-serif", color: CREMA }}>
          <div style={{ position: "absolute", top: 110, left: 80, right: 80, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ width: 46, height: 8, backgroundColor: ROJO }} />
              <div style={{ fontSize: 40, letterSpacing: 6 }}>PATRIA EN DISPUTA</div>
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: 6, color: ROJO }}>EPISODIO 002</div>
          </div>
          <div style={{ position: "absolute", left: 80, right: 80, bottom: 170, lineHeight: 0.98 }}>
            <div style={{ fontSize: 150, letterSpacing: 1 }}>¿CUÁNDO</div>
            <div style={{ fontSize: 150, letterSpacing: 1 }}>DEJAMOS DE</div>
            <div style={{ fontSize: 150, letterSpacing: 1 }}>PENSAR EN</div>
            <div style={{ fontSize: 150, letterSpacing: 1, color: ROJO }}>NOSOTROS?</div>
            <div style={{ marginTop: 40, width: 120, height: 8, backgroundColor: CREMA }} />
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
