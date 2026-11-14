import { Composition } from "remotion";
import { AguaDemo } from "./demo/AguaDemo";
import { ALTO, ANCHO, DURACION, FPS } from "./demo/escena";

export const RemotionRoot: React.FC = () => (
  <Composition id="AguaDemo" component={AguaDemo} durationInFrames={DURACION} fps={FPS} width={ANCHO} height={ALTO} />
);
