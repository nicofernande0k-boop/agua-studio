#!/usr/bin/env node
/**
 * Alinea los subtítulos con la voz grabada.
 *
 * Lee producciones/<id>/narrada.json, la transcripción de Whisper (tiempo por
 * palabra) y el audio de la voz. Ajusta cada palabra contra los silencios
 * reales del audio (Whisper a veces "estira" una palabra sobre la pausa
 * anterior) y genera tiempos-narrada.json + subtitulos-narrada.srt.
 *
 * Reglas de los subtítulos:
 *  - bloques cortos: corte en puntuación, en pausas de más de 0,35 s o a las
 *    5 palabras / 30 caracteres;
 *  - cada bloque aparece con su primera palabra y se va antes del siguiente:
 *    nunca hay dos bloques en pantalla.
 *
 * Uso: node scripts/alinear-voz.mjs producciones/001-agua
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const carpeta = process.argv[2] ?? "producciones/001-agua";
const cfg = JSON.parse(readFileSync(join(carpeta, "narrada.json"), "utf8"));
const tr = JSON.parse(readFileSync(join(carpeta, cfg.transcripcion), "utf8"));
const fps = cfg.fps;
const D = cfg.desfase;

// Silencios reales de la voz (ffmpeg escribe el informe en stderr).
const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", join(carpeta, cfg.voz), "-af", "silencedetect=noise=-38dB:d=0.18", "-f", "null", "-"], { encoding: "utf8" });
const salida = r.stderr || "";
const silencios = [];
const re = /silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g;
let m;
while ((m = re.exec(salida))) silencios.push([Number(m[1]), Number(m[2])]);

const normalizar = (p) => p.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]/g, "");
const destacadas = new Set(cfg.destacadas.map(normalizar));

const crudas = tr.segmentos.flatMap((s) => s.palabras);
const palabras = crudas.map((w, i) => {
  let ini = w.i;
  let fin = w.f;
  for (const [a, b] of silencios) {
    if (ini >= a - 0.02 && ini < b) ini = Math.min(b, fin - 0.08);
    if (fin > a && fin <= b + 0.02 && a > ini) fin = Math.max(a, ini + 0.08);
  }
  const t = cfg.correcciones[String(i)] ?? w.p;
  return { texto: t, inicio: +(ini + D).toFixed(3), fin: +(fin + D).toFixed(3), destacada: destacadas.has(normalizar(t)) };
});
// Sin superposiciones entre palabras.
for (let i = 1; i < palabras.length; i++) if (palabras[i].inicio < palabras[i - 1].fin) palabras[i].inicio = palabras[i - 1].fin;

// Comienzo del cierre: la frase final se muestra como título, no como subtítulo.
const frase = cfg.cierre.desdePalabra.split(" ");
let iCierre = palabras.length;
for (let i = palabras.length - frase.length; i >= 0; i--) {
  if (frase.every((f, k) => normalizar(palabras[i + k].texto) === normalizar(f))) {
    iCierre = i;
    break;
  }
}

// Bloques de subtítulos.
const bloques = [];
let actual = [];
let largo = 0;
const cerrar = () => {
  if (actual.length) bloques.push({ palabras: actual, inicio: palabras[actual[0]].inicio, fin: palabras[actual.at(-1)].fin });
  actual = [];
  largo = 0;
};
for (let i = 0; i < iCierre; i++) {
  const p = palabras[i];
  const pausa = actual.length ? p.inicio - palabras[actual.at(-1)].fin : 0;
  // Una palabra que cierra la frase no queda sola en el bloque siguiente.
  const siguiente = palabras[i + 1];
  const cierraFrase = /[,.:;?!]$/.test(p.texto) || !siguiente || i + 1 === iCierre || siguiente.inicio - p.fin > 0.35;
  const lleno = cierraFrase ? actual.length >= 6 || largo + p.texto.length > 36 : actual.length >= 5 || largo + p.texto.length > 30;
  if (actual.length && (lleno || pausa > 0.35)) cerrar();
  actual.push(i);
  largo += p.texto.length + 1;
  if (/[,.:;?!]$/.test(p.texto)) cerrar();
}
cerrar();
for (let i = 0; i < bloques.length; i++) {
  const sig = bloques[i + 1];
  const tope = sig ? sig.inicio - 0.06 : bloques[i].fin + 0.6;
  bloques[i].salida = +Math.min(bloques[i].fin + 0.35, tope).toFixed(3);
  bloques[i].inicio = +Math.max(bloques[i].inicio - 0.05, i ? bloques[i - 1].salida + 0.01 : 0).toFixed(3);
  if (bloques[i].salida <= bloques[i].inicio) throw new Error(`Bloque ${i} sin duración`);
}

// Actos.
let desde = 0;
const escenas = cfg.actos.map((a, i) => {
  const hasta = Math.round(a.hasta * fps);
  const e = { id: a.id, indice: i + 1, titulo: a.titulo, inicio: desde / fps, duracion: (hasta - desde) / fps, desde, frames: hasta - desde };
  desde = hasta;
  return e;
});
const total = Math.round(cfg.duracion * fps);
if (desde !== total) throw new Error(`Los actos suman ${desde} fotogramas y la duración es ${total}`);
const ultima = palabras.at(-1);
if (ultima.fin > cfg.duracion - 3) throw new Error("La pantalla final dura menos de 3 s");

const cierre = {
  palabras: palabras.slice(iCierre).map((p) => ({ texto: p.texto, inicio: p.inicio, fin: p.fin })),
  defiende: cfg.cierre.defiende,
  texto: cfg.cierre.texto,
};
const salidaJson = { id: cfg.id, titulo: cfg.titulo, fps, duracion: cfg.duracion, frames: total, desfaseVoz: D, escenas, palabras, bloques, cierre, estimado: false };
writeFileSync(join(carpeta, "tiempos-narrada.json"), JSON.stringify(salidaJson, null, 1) + "\n");

const hms = (s) => {
  const ms = Math.round(s * 1000);
  return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0")}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
};
const srt = [
  ...bloques.map((b) => ({ a: b.inicio, b: b.salida, t: b.palabras.map((k) => palabras[k].texto).join(" ") })),
  { a: cierre.palabras[0].inicio, b: cfg.duracion, t: cfg.cierre.texto.replace("\n", " ") },
]
  .map((x, i) => `${i + 1}\n${hms(x.a)} --> ${hms(x.b)}\n${x.t}\n`)
  .join("\n");
writeFileSync(join(carpeta, "subtitulos-narrada.srt"), srt);

console.log(`Voz: ${palabras.length} palabras · ${bloques.length} bloques · ${silencios.length} silencios detectados`);
console.log(`Video: ${cfg.duracion} s (${total} fotogramas). Voz termina en ${ultima.fin.toFixed(2)} s → pantalla final ${(cfg.duracion - ultima.fin).toFixed(2)} s`);
for (const e of escenas) console.log(`  ${e.id} ${e.inicio.toFixed(1)}–${(e.inicio + e.duracion).toFixed(1)} s  ${e.titulo}`);
