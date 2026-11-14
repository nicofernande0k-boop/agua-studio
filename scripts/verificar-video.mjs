#!/usr/bin/env node
/**
 * Verifica que un MP4 final cumpla lo pedido: H.264, 1080×1920, 30 fps,
 * cantidad exacta de fotogramas, audio AAC y duración igual al guion.
 * Sale con error si algo no coincide (así el workflow no publica un video roto).
 *
 * Uso: node scripts/verificar-video.mjs <video.mp4> <tiempos.json>
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const [video, rutaTiempos] = process.argv.slice(2);
const t = JSON.parse(readFileSync(rutaTiempos, "utf8"));
const info = JSON.parse(
  execFileSync("ffprobe", ["-v", "error", "-count_packets", "-show_streams", "-show_format", "-of", "json", video], { encoding: "utf8" }),
);
const v = info.streams.find((x) => x.codec_type === "video");
const a = info.streams.find((x) => x.codec_type === "audio");
const dur = Number(info.format.duration);
const escalaCompleta = process.env.ESCALA === undefined || process.env.ESCALA === "1";

const chequeos = [
  ["Códec de video", v?.codec_name, v?.codec_name === "h264"],
  ["Resolución", `${v?.width}×${v?.height}`, !escalaCompleta || (v?.width === 1080 && v?.height === 1920)],
  ["Fotogramas por segundo", v?.r_frame_rate, v?.r_frame_rate === `${t.fps}/1`],
  ["Fotogramas", `${v?.nb_read_packets} (esperados ${t.frames})`, Number(v?.nb_read_packets) === t.frames],
  ["Audio", a ? `${a.codec_name} ${a.sample_rate} Hz ${a.channels} canales` : "sin audio", a?.codec_name === "aac"],
  ["Duración", `${dur.toFixed(2)} s (guion ${t.duracion} s)`, Math.abs(dur - t.duracion) < 0.15],
  ["Tamaño", `${(Number(info.format.size) / 1e6).toFixed(1)} MB`, Number(info.format.size) > 1e6],
];

console.log("| Chequeo | Valor | OK |\n| --- | --- | --- |");
for (const [nombre, valor, ok] of chequeos) console.log(`| ${nombre} | ${valor} | ${ok ? "✅" : "❌"} |`);
if (chequeos.some(([, , ok]) => !ok)) {
  console.error("El video no pasó la verificación.");
  process.exit(1);
}
