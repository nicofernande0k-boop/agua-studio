import { Config } from "@remotion/cli/config";

/**
 * Configuración de render de AGUA STUDIO.
 *
 * - "swangle" (ANGLE + SwiftShader) permite WebGL sin placa de video (como en GitHub
 *   Actions y en los contenedores de Claude Code).
 * - REMOTION_BROWSER_EXECUTABLE permite usar un Chrome ya instalado cuando la
 *   red no deja descargar el de Remotion. Si no está definida, Remotion
 *   descarga su propio navegador.
 */
Config.setChromiumOpenGlRenderer("swangle");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
Config.setConcurrency(Number(process.env.REMOTION_CONCURRENCY) || null);
Config.setTimeoutInMilliseconds(120000);
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
