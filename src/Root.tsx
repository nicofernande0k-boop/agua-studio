import { Composition } from "remotion";
import { AguaDemo } from "./demo/AguaDemo";
import { ALTO, ANCHO, DURACION, FPS } from "./demo/escena";
import { Produccion001 } from "./producciones/agua001/Produccion";
import tiempos001 from "../producciones/001-agua/tiempos.json";
import tiempos001n from "../producciones/001-agua/tiempos-narrada.json";
import { Produccion001Narrada } from "./producciones/agua001n/Produccion";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="AguaDemo" component={AguaDemo} durationInFrames={DURACION} fps={FPS} width={ANCHO} height={ALTO} />
    <Composition
      id="Produccion001"
      component={Produccion001}
      durationInFrames={tiempos001.frames}
      fps={tiempos001.fps}
      width={ANCHO}
      height={ALTO}
      defaultProps={{ conAudio: false }}
    />
    <Composition
      id="Produccion001Narrada"
      component={Produccion001Narrada}
      durationInFrames={tiempos001n.frames}
      fps={tiempos001n.fps}
      width={ANCHO}
      height={ALTO}
      defaultProps={{ conAudio: false }}
    />
  </>
);
