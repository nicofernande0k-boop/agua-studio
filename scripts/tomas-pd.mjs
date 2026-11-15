// Renderiza fotogramas de tomas sueltas de PD002Prueba con props distintas, reusando un navegador.
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import { mkdirSync } from "node:fs";
const [salida, escala, ...pedidos] = process.argv.slice(2); // pedidos: Toma:0.1,0.5,0.9
mkdirSync(salida, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE ?? null, chromiumOptions: { gl: "swangle" } });
for (const p of pedidos) {
  const [toma, us] = p.split(":");
  const inputProps = { toma };
  const comp = await selectComposition({ serveUrl, id: "PD002Prueba", inputProps, puppeteerInstance: browser, chromiumOptions: { gl: "swangle" } });
  for (const u of us.split(",").map(Number)) {
    const frame = Math.round(u * (comp.durationInFrames - 1));
    await renderStill({ composition: comp, serveUrl, frame, inputProps, output: path.join(salida, `${toma}-${String(Math.round(u * 100)).padStart(3, "0")}.jpg`), scale: Number(escala), imageFormat: "jpeg", jpegQuality: 85, puppeteerInstance: browser, chromiumOptions: { gl: "swangle" }, timeoutInMilliseconds: 120000 });
  }
  console.log("ok", toma);
}
await browser.close({ silent: true });
