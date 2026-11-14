#!/usr/bin/env node
/**
 * Renderiza fotogramas sueltos de una composición reutilizando un solo
 * navegador (mucho más rápido que un `remotion still` por cuadro).
 *
 * Uso: node scripts/fotogramas.mjs <composición> <salida/> <escala> <f1,f2,...>
 * Ejemplo: node scripts/fotogramas.mjs Produccion001 out/fotos 0.3 0,120,360
 */
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";

const [id = "Produccion001", salida = "out/fotos", escala = "0.3", lista = "0"] = process.argv.slice(2);
mkdirSync(salida, { recursive: true });
const serveUrl = process.env.REMOTION_BUNDLE ?? (await bundle({ entryPoint: path.resolve("src/index.ts") }));
const browser = await openBrowser("chrome", {
  browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE ?? null,
  chromiumOptions: { gl: "swangle" },
});
const composition = await selectComposition({ serveUrl, id, puppeteerInstance: browser, chromiumOptions: { gl: "swangle" } });
for (const f of lista.split(",").map(Number)) {
  const output = path.join(salida, `f${String(f).padStart(5, "0")}.jpg`);
  await renderStill({
    composition, serveUrl, frame: f, output, scale: Number(escala), imageFormat: "jpeg", jpegQuality: 85,
    puppeteerInstance: browser, chromiumOptions: { gl: "swangle" }, timeoutInMilliseconds: 120000,
  });
  console.log("ok", output);
}
await browser.close({ silent: true });
