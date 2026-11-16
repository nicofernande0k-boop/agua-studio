import "@fontsource/anton/400.css";
import { AbsoluteFill } from "remotion";
import { Ciudad, Olvidar, Solos, Subte } from "./tomas/Acto1";
import { Cima, Grietas, Lluvioso, Recuerdo } from "./tomas/Acto2";
import { Companeros, ComedorT, Encuentro, Jovenes, Ronda, Vecinos, Ventana } from "./tomas/Acto3";
import { Carrera, Construir, Mirar, Nosotros } from "./tomas/Acto4";

export const TOMAS: Record<string, React.FC> = {
  Solos, Ciudad, Subte, Olvidar, Lluvioso, Grietas, Recuerdo, Cima,
  Ventana, Vecinos, ComedorT, Companeros, Jovenes, Ronda, Encuentro,
  Carrera, Construir, Mirar, Nosotros,
  NosotrosUnaLinea: () => <Nosotros unaLinea />,
};

/** Previsualización de una toma suelta (solo para desarrollo). */
export const PruebaPD: React.FC<{ toma: string }> = ({ toma }) => {
  const T = TOMAS[toma];
  return <AbsoluteFill style={{ backgroundColor: "#070707" }}>{T ? <T /> : null}</AbsoluteFill>;
};
