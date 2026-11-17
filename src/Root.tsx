import { Composition } from "remotion";
import { AguaDemo } from "./demo/AguaDemo";
import { ALTO, ANCHO, DURACION, FPS } from "./demo/escena";
import { Produccion001 } from "./producciones/agua001/Produccion";
import tiempos001 from "../producciones/001-agua/tiempos.json";
import tiempos001n from "../producciones/001-agua/tiempos-narrada.json";
import { Produccion001Narrada } from "./producciones/agua001n/Produccion";
import { PruebaPD } from "./pd/Prueba";
import { DURACION_003, Episodio003 } from "./pd3/Episodio003";
import { Portada003 } from "./pd3/Portada003";
import { DURACION_002, DURACION_002_DEFINITIVA, Episodio002, Episodio002Definitiva } from "./pd/Episodio002";
import { Portada002 } from "./pd/Portada002";

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
    <Composition id="PD002Prueba" component={PruebaPD} durationInFrames={180} fps={30} width={ANCHO} height={ALTO} defaultProps={{ toma: "Solos" }} />
    <Composition id="PD002" component={Episodio002} durationInFrames={DURACION_002} fps={30} width={ANCHO} height={ALTO} defaultProps={{ conAudio: false }} />
    <Composition id="PD002Definitiva" component={Episodio002Definitiva} durationInFrames={DURACION_002_DEFINITIVA} fps={30} width={ANCHO} height={ALTO} defaultProps={{ conAudio: false }} />
    <Composition id="PD003" component={Episodio003} durationInFrames={DURACION_003} fps={30} width={ANCHO} height={ALTO} defaultProps={{ conAudio: false }} />
    <Composition id="PD003Portada" component={Portada003} durationInFrames={1} fps={30} width={ANCHO} height={ALTO} />
    <Composition id="PD002Portada" component={Portada002} durationInFrames={1} fps={30} width={ANCHO} height={ALTO} />
  </>
);
