import "@fontsource/inter/800.css";
import "@fontsource/inter/600.css";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Mundo } from "../three/Mundo";
import { clamp01, muestrearCamara } from "../lib/anim";
import { CAMARA, PISO, T } from "./escena";

/**
 * Demo de 8 segundos: «¿Y si mañana no tenés agua?».
 * Ciudad → techo → baño → canilla seca → piso → cañerías vacías.
 */
export const AguaDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#bfdcee" }}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{ fov: 32, near: 0.05, far: 700, position: [0, 50, 50] }}
      >
        <Mundo frame={frame} fps={fps} />
      </ThreeCanvas>
      <PasoBajoTierra frame={frame} />
      <Vineta />
      <Titulo frame={frame} fps={fps} />
      <Marca />
    </AbsoluteFill>
  );
};

const Vineta: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: "radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)",
    }}
  />
);

const Titulo: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const inicio = T.titulo[0];
  if (frame < inicio) return null;
  const entrada = (desfase: number) =>
    spring({ frame: frame - inicio - desfase, fps, config: { damping: 14, stiffness: 140, mass: 0.7 } });
  const linea = (texto: string, desfase: number, color: string) => {
    const s = entrada(desfase);
    return (
      <div
        style={{
          transform: `translateY(${interpolate(s, [0, 1], [60, 0])}px) scale(${interpolate(s, [0, 1], [0.92, 1])})`,
          opacity: s,
          color,
        }}
      >
        {texto}
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 300, pointerEvents: "none" }}>
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          fontSize: 104,
          lineHeight: 1.02,
          letterSpacing: -3,
          textAlign: "center",
          textShadow: "0 6px 30px rgba(0,0,0,0.55)",
        }}
      >
        {linea("¿Y si mañana", 0, "#ffffff")}
        {linea("no tenés agua?", 5, "#7fd8ff")}
      </div>
    </AbsoluteFill>
  );
};

const Marca: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "flex-start", padding: "120px 70px", pointerEvents: "none" }}>
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 600,
        fontSize: 30,
        letterSpacing: 6,
        color: "rgba(255,255,255,0.85)",
        textShadow: "0 2px 10px rgba(0,0,0,0.5)",
      }}
    >
      AGUA STUDIO
    </div>
  </AbsoluteFill>
);

/** Fundido breve a oscuro mientras la cámara atraviesa el piso y la tierra. */
const PasoBajoTierra: React.FC<{ frame: number }> = ({ frame }) => {
  const y = muestrearCamara(CAMARA, frame).pos[1];
  const opacidad = clamp01(1 - Math.abs(y - PISO / 2) / 0.55);
  if (opacidad <= 0) return null;
  return <AbsoluteFill style={{ backgroundColor: "#140d08", opacity: opacidad, pointerEvents: "none" }} />;
};
