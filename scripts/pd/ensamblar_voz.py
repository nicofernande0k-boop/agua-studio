#!/usr/bin/env python3
"""
PATRIA EN DISPUTA — ensambla la narración y sincroniza los subtítulos.

Entrada:  producciones/<id>/locucion.json  +  carpeta con frases/NN.wav
Salida:   producciones/<id>/voz/narracion.wav   (48 kHz mono)
          producciones/<id>/tiempos.json        (frases, palabras, bloques)
          producciones/<id>/subtitulos.srt

Los tiempos de cada palabra salen del audio real (Whisper con marcas por
palabra sobre cada frase); la ortografía sale del guion, nunca de la
transcripción.

Uso: python ensamblar_voz.py <carpeta_produccion> <carpeta_frases> <carpeta_modelos_whisper>
"""
import json
import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

SR = 48000
prod = Path(sys.argv[1])
frases_dir = Path(sys.argv[2])
modelo = WhisperModel("medium", device="cpu", compute_type="int8", download_root=sys.argv[3])
loc = json.loads((prod / "locucion.json").read_text())
FPS = 30


def leer(p):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(pcm, dtype=np.float32).copy()


def tiempos_palabras(audio, texto):
    """Inicio/fin de cada palabra del guion dentro de la frase."""
    a16 = audio[:: SR // 16000]
    segs, _ = modelo.transcribe(a16, language="es", word_timestamps=True, initial_prompt=texto)
    detectadas = [(w.start, w.end) for s in segs for w in s.words]
    guion = texto.split()
    dur = len(audio) / SR
    if len(detectadas) == len(guion):
        return detectadas
    # Si la cantidad no coincide, reparto el tiempo de la voz real por largo de palabra.
    ini = detectadas[0][0] if detectadas else 0.0
    fin = detectadas[-1][1] if detectadas else dur
    pesos = np.array([len(re.sub(r"[^\wáéíóúñü]", "", w, flags=re.I)) + 1.5 for w in guion], dtype=float)
    cortes = ini + (fin - ini) * np.concatenate([[0], np.cumsum(pesos) / pesos.sum()])
    return [(cortes[i], cortes[i + 1] - 0.03) for i in range(len(guion))]


pista = [np.zeros(int(loc["inicio"] * SR), dtype=np.float32)]
t = loc["inicio"]
frases, palabras = [], []
k = 0
for acto in loc["actos"]:
    for fr in acto["frases"]:
        k += 1
        audio = leer(frases_dir / f"{k:02d}.wav")
        dur = len(audio) / SR
        for (i0, i1), w in zip(tiempos_palabras(audio, fr["texto"]), fr["texto"].split()):
            palabras.append({"texto": w, "inicio": round(t + i0, 3), "fin": round(t + max(i1, i0 + 0.08), 3), "frase": k})
        frases.append({"k": k, "acto": acto["id"], "texto": fr["texto"], "inicio": round(t, 3), "fin": round(t + dur, 3)})
        pista.append(audio)
        t += dur
        pista.append(np.zeros(int(fr["pausa"] * SR), dtype=np.float32))
        t += fr["pausa"]
        print(f"{k:02d} {frases[-1]['inicio']:7.2f}-{frases[-1]['fin']:7.2f} {fr['texto'][:60]}", flush=True)

total = t + loc["final"]
pista.append(np.zeros(int(loc["final"] * SR), dtype=np.float32))
voz = np.concatenate(pista)
voz = voz / (np.abs(voz).max() + 1e-9) * 0.89
(prod / "voz").mkdir(exist_ok=True)
with wave.open(str(prod / "voz" / "narracion.wav"), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((voz * 32767).astype(np.int16).tobytes())

# Sin superposiciones entre palabras.
for i in range(1, len(palabras)):
    if palabras[i]["inicio"] < palabras[i - 1]["fin"]:
        palabras[i - 1]["fin"] = palabras[i]["inicio"]

# Subtítulos: hasta 2 líneas de 34 caracteres, cortes en puntuación y pausas.
MAX_LINEA = 34
bloques = []
actual = []


def largo(ids):
    return len(" ".join(palabras[i]["texto"] for i in ids))


def lineas(ids):
    texto = [palabras[i]["texto"] for i in ids]
    if len(" ".join(texto)) <= MAX_LINEA:
        return [" ".join(texto)]
    mejor = None
    for c in range(1, len(texto)):
        a, b = " ".join(texto[:c]), " ".join(texto[c:])
        if len(a) <= MAX_LINEA and len(b) <= MAX_LINEA:
            d = abs(len(a) - len(b)) - (6 if texto[c - 1][-1] in ",.;:" else 0)
            if mejor is None or d < mejor[0]:
                mejor = (d, [a, b])
    return mejor[1] if mejor else [" ".join(texto)]


for i, p in enumerate(palabras):
    sig = palabras[i + 1] if i + 1 < len(palabras) else None
    if actual and (largo(actual + [i]) > 2 * MAX_LINEA - 4 or palabras[actual[-1]]["frase"] != p["frase"]):
        bloques.append(actual)
        actual = []
    actual.append(i)
    fin_frase = p["texto"][-1] in ".?!…" or not sig or sig["frase"] != p["frase"]
    pausa = sig and sig["inicio"] - p["fin"] > 0.45
    if fin_frase or (p["texto"][-1] in ",;:" and largo(actual) > 22) or pausa:
        bloques.append(actual)
        actual = []
if actual:
    bloques.append(actual)

salida = []
for j, ids in enumerate(bloques):
    ini = palabras[ids[0]]["inicio"] - 0.05
    fin = palabras[ids[-1]]["fin"]
    sig = bloques[j + 1] if j + 1 < len(bloques) else None
    tope = palabras[sig[0]]["inicio"] - 0.08 if sig else fin + 0.8
    salida.append({"palabras": ids, "inicio": round(max(ini, salida[-1]["salida"] + 0.01 if salida else 0), 3), "fin": round(fin, 3), "salida": round(min(fin + 0.45, tope), 3), "lineas": lineas(ids)})

for b in salida:
    assert all(len(l) <= MAX_LINEA + 6 for l in b["lineas"]), b["lineas"]
    assert len(b["lineas"]) <= 2, b["lineas"]

resultado = {"id": loc["id"], "titulo": loc["titulo"], "fps": FPS, "duracion": round(total, 3), "frames": int(round(total * FPS)), "frases": frases, "palabras": palabras, "bloques": salida}
(prod / "tiempos.json").write_text(json.dumps(resultado, ensure_ascii=False, indent=1) + "\n")


def hms(s):
    ms = int(round(s * 1000))
    return f"{ms // 3600000:02d}:{ms % 3600000 // 60000:02d}:{ms % 60000 // 1000:02d},{ms % 1000:03d}"


srt = "\n".join(f"{i + 1}\n{hms(b['inicio'])} --> {hms(b['salida'])}\n" + "\n".join(b["lineas"]) + "\n" for i, b in enumerate(salida))
(prod / "subtitulos.srt").write_text(srt)
print(f"Narración: {total:.2f} s · {len(frases)} frases · {len(palabras)} palabras · {len(salida)} subtítulos")
