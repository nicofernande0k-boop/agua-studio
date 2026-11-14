#!/usr/bin/env node
/**
 * Temporizador de guion de AGUA STUDIO.
 *
 * Lee producciones/<id>/guion.json y genera, en la misma carpeta:
 *   - tiempos.json        tiempos de escenas, palabras y bloques de subtítulos
 *   - subtitulos.srt      subtítulos para subir a redes o editar
 *   - guia-locucion.md    guion segmentado con marcas de tiempo para grabar la voz
 *
 * Mientras no haya narración grabada, la duración de cada palabra se estima
 * con un modelo simple de habla rioplatense (≈ 3 palabras por segundo más
 * pausas por puntuación). Cuando exista el audio, se puede recalibrar
 * editando los "inicio" del guion o reemplazando tiempos.json.
 *
 * Uso: node scripts/temporizar.mjs producciones/001-agua
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const carpeta = process.argv[2] ?? "producciones/001-agua";
const guion = JSON.parse(readFileSync(join(carpeta, "guion.json"), "utf8"));
const fps = guion.fps;

// Modelo de duración (segundos).
const BASE = 0.11;
const POR_LETRA = 0.052;
const PAUSA = { ",": 0.24, ".": 0.0, ":": 0.32, ";": 0.3, "?": 0.0, "!": 0.0 };

const normalizar = (p) =>
  p.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]/g, "");
const letras = (p) => {
  const limpio = p.replace(/[¿?¡!.,:;"«»—]/g, "");
  const dicha = guion.dichas?.[limpio] ?? limpio;
  return dicha.replace(/\s/g, "").length;
};
const destacadas = new Set((guion.destacadas ?? []).map(normalizar));

const escenas = [];
const palabras = [];
const bloques = [];
const avisos = [];
let cursor = 0;

for (const [ie, e] of guion.escenas.entries()) {
  const inicioEscena = cursor;
  const duracionFrames = Math.round(e.duracion * fps);
  let finAnterior = -Infinity;
  for (const frase of e.narracion) {
    if (frase.inicio < finAnterior + 0.15) avisos.push(`${e.id}: la frase «${frase.texto.slice(0, 30)}…» empieza antes de que termine la anterior.`);
    let t = frase.inicio;
    const tokens = frase.texto.split(/\s+/).filter(Boolean);
    const indices = [];
    for (const tok of tokens) {
      const dur = BASE + POR_LETRA * letras(tok);
      const fin = t + dur;
      indices.push(palabras.length);
      palabras.push({
        texto: tok,
        inicio: +(inicioEscena + t).toFixed(3),
        fin: +(inicioEscena + fin).toFixed(3),
        escena: e.id,
        destacada: destacadas.has(normalizar(tok)),
      });
      const signo = tok.at(-1);
      t = fin + (PAUSA[signo] ?? 0);
    }
    finAnterior = t;
    // Bloques de subtítulos: cortes en puntuación o cada ~5 palabras / 30 caracteres.
    let actual = [];
    let largo = 0;
    const cerrar = () => {
      if (!actual.length) return;
      bloques.push({ palabras: actual, inicio: palabras[actual[0]].inicio, fin: palabras[actual.at(-1)].fin, escena: e.id });
      actual = [];
      largo = 0;
    };
    for (const i of indices) {
      const tok = palabras[i].texto;
      if (actual.length && (actual.length >= 5 || largo + tok.length > 28)) cerrar();
      actual.push(i);
      largo += tok.length + 1;
      if (/[,.:;?!]$/.test(tok)) cerrar();
    }
    cerrar();
  }
  const limite = e.cierre ? e.cierre.inicio : e.duracion - 0.4;
  if (finAnterior > limite) avisos.push(`${e.id}: la narración termina en ${finAnterior.toFixed(2)} s y la escena permite hasta ${limite.toFixed(2)} s.`);
  escenas.push({
    id: e.id,
    indice: ie + 1,
    titulo: e.titulo,
    inicio: inicioEscena,
    duracion: e.duracion,
    desde: Math.round(inicioEscena * fps),
    frames: duracionFrames,
    finNarracion: +(inicioEscena + finAnterior).toFixed(3),
    cierre: e.cierre ? { inicio: +(inicioEscena + e.cierre.inicio).toFixed(3), texto: e.cierre.texto } : null,
  });
  cursor += e.duracion;
}

// Los subtítulos se mantienen en pantalla hasta el siguiente bloque (máx. +0,6 s).
for (let i = 0; i < bloques.length; i++) {
  const sig = bloques[i + 1];
  const extra = Math.min(0.6, sig ? sig.inicio - bloques[i].fin - 0.05 : 0.6);
  bloques[i].salida = +(bloques[i].fin + Math.max(0.1, extra)).toFixed(3);
}

const total = cursor;
const salida = { id: guion.id, titulo: guion.titulo, fps, duracion: total, frames: Math.round(total * fps), escenas, palabras, bloques, estimado: true };
writeFileSync(join(carpeta, "tiempos.json"), JSON.stringify(salida, null, 2) + "\n");

const hms = (s) => {
  const ms = Math.round(s * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${ss},${String(ms % 1000).padStart(3, "0")}`;
};
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${(s % 60).toFixed(1).padStart(4, "0")}`;

const srt = bloques
  .map((b, i) => `${i + 1}\n${hms(b.inicio)} --> ${hms(b.salida)}\n${b.palabras.map((k) => palabras[k].texto).join(" ")}\n`)
  .join("\n");
writeFileSync(join(carpeta, "subtitulos.srt"), srt);

let md = `# Guía de locución — ${guion.titulo}\n\n`;
md += `Duración total: **${total} s** (${salida.frames} fotogramas a ${fps} fps). Tiempos **estimados**: recalibrar al grabar.\n\n`;
md += `Voz: masculina, rioplatense, joven-adulta, tono documental y cercano. Más intensidad hacia el final.\n\n`;
md += `Grabar cada frase como archivo separado (\`voz/e1-1.wav\`, \`voz/e1-2.wav\`, …), 48 kHz, mono, sin música.\n\n`;
for (const e of escenas) {
  const g = guion.escenas.find((x) => x.id === e.id);
  md += `## Escena ${e.indice} — ${e.titulo}  \n\`${mmss(e.inicio)} → ${mmss(e.inicio + e.duracion)}\`\n\n`;
  md += `| Archivo | Entra en | Dura (aprox.) | Texto |\n| --- | --- | --- | --- |\n`;
  g.narracion.forEach((f, i) => {
    const ps = palabras.filter((p) => p.escena === e.id);
    const desde = e.inicio + f.inicio;
    const hasta = Math.max(...ps.filter((p) => p.inicio >= desde - 1e-6 && p.inicio < desde + 60).slice(0, f.texto.split(/\s+/).length).map((p) => p.fin));
    md += `| \`voz/${e.id}-${i + 1}.wav\` | ${mmss(desde)} | ${(hasta - desde).toFixed(1)} s | ${f.texto} |\n`;
  });
  if (e.cierre) md += `\nTexto final en pantalla desde ${mmss(e.cierre.inicio)}: **${e.cierre.texto.replace("\n", " ")}** (sin locución).\n`;
  md += "\n";
}
writeFileSync(join(carpeta, "guia-locucion.md"), md);

console.log(`Duración total: ${total} s · ${salida.frames} fotogramas · ${palabras.length} palabras`);
for (const e of escenas) {
  console.log(`  ${e.id}  ${mmss(e.inicio)}–${mmss(e.inicio + e.duracion)}  narración hasta ${mmss(e.finNarracion)}  ${e.titulo}`);
}
if (avisos.length) {
  console.log("\nAVISOS:");
  for (const a of avisos) console.log("  - " + a);
  process.exitCode = 1;
} else console.log("\nSin superposiciones: cada frase entra después de la anterior y antes del final de su escena.");
