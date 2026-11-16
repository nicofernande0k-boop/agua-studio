#!/usr/bin/env python3
"""
PATRIA EN DISPUTA — alinea una narración ya grabada (p. ej. ElevenLabs) con el guion.

No modifica el audio: lo ubica en el video con un desfase inicial y saca los
tiempos de cada palabra con Whisper. La ortografía sale del guion.

Entrada:  <prod>/locucion.json (guion por frases)  +  <prod>/voz/<archivo>
Salida:   <prod>/tiempos.json  y  <prod>/subtitulos.srt

Uso: python alinear_mp3.py <prod> <archivo_voz> [palabras_whisper.json] [desfase] [cola]
"""
import difflib
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

prod = Path(sys.argv[1])
voz = prod / "voz" / sys.argv[2]
cache = Path(sys.argv[3]) if len(sys.argv) > 3 else None
DESFASE = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
COLA = float(sys.argv[5]) if len(sys.argv) > 5 else 3.6
FPS = 30
loc = json.loads((prod / "locucion.json").read_text())

if cache and cache.exists():
    detect = json.loads(cache.read_text())
else:
    import numpy as np
    from faster_whisper import WhisperModel

    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(voz), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    segs, _ = WhisperModel("medium", compute_type="int8").transcribe(np.frombuffer(pcm, np.float32), language="es", word_timestamps=True)
    detect = [{"w": w.word.strip(), "s": w.start, "e": w.end} for s in segs for w in s.words]
    if cache:
        cache.write_text(json.dumps(detect, ensure_ascii=False))

dur_voz = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(voz)], capture_output=True, text=True, check=True).stdout)


def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    return re.sub(r"[^a-zñ0-9]", "", "".join(c for c in w if unicodedata.category(c) != "Mn"))


guion = []  # (texto, frase, acto)
frases_txt = []
k = 0
for acto in loc["actos"]:
    for fr in acto["frases"]:
        k += 1
        frases_txt.append((k, acto["id"], fr["texto"]))
        guion += [(w, k) for w in fr["texto"].split()]

A = [norm(w) for w, _ in guion]
B = [norm(d["w"]) for d in detect]
tiempos = [None] * len(guion)
for blk in difflib.SequenceMatcher(None, A, B, autojunk=False).get_matching_blocks():
    for j in range(blk.size):
        tiempos[blk.a + j] = (detect[blk.b + j]["s"], detect[blk.b + j]["e"])
faltan = [guion[i][0] for i, t in enumerate(tiempos) if t is None]
print(f"Palabras del guion: {len(guion)} · detectadas: {len(B)} · sin coincidencia: {len(faltan)} {faltan}")
assert len(faltan) <= 6, "La narración no coincide con el guion"
# Interpolación para las que no coincidieron.
for i, t in enumerate(tiempos):
    if t is None:
        a = next((tiempos[j][1] for j in range(i - 1, -1, -1) if tiempos[j]), 0.0)
        b = next((tiempos[j][0] for j in range(i + 1, len(tiempos)) if tiempos[j]), dur_voz)
        tiempos[i] = (a + 0.02, max(a + 0.1, b - 0.02))

# Bordes de frase: Whisper a veces pega el inicio de una frase al final de la
# anterior. Se corrigen con la energía real del audio (el silencio entre ambas).
import numpy as np

_pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(voz), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
_a = np.frombuffer(_pcm, np.float32)
_v = 160  # 10 ms
_rms = np.sqrt(np.convolve(_a ** 2, np.ones(_v) / _v, mode="same"))[::_v]
_umbral = max(0.006, np.percentile(_rms, 20) * 2.5)
for i in range(1, len(guion)):
    if guion[i][1] == guion[i - 1][1]:
        continue
    (s0, e0), (s1, e1) = tiempos[i - 1], tiempos[i]
    a, b = int(max(s0 + 0.1, e0 - 0.6) * 100), int(min(e1 - 0.05, s1 + 0.6) * 100)
    mejor, ini = (0, 0, 0), None
    for j in range(a, b + 1):
        bajo = j < len(_rms) and _rms[j] < _umbral
        if bajo and ini is None:
            ini = j
        if (not bajo or j == b) and ini is not None:
            if j - ini > mejor[0]:
                mejor = (j - ini, ini, j)
            ini = None
    if mejor[0] >= 12:  # silencio de al menos 120 ms
        tiempos[i - 1] = (s0, min(e0, mejor[1] / 100 + 0.04) if e0 > mejor[1] / 100 else e0)
        tiempos[i] = (max(s1, mejor[2] / 100 - 0.03), e1)

palabras = [{"texto": w, "inicio": round(DESFASE + s, 3), "fin": round(DESFASE + max(e, s + 0.08), 3), "frase": fk} for (w, fk), (s, e) in zip(guion, tiempos)]
for i in range(1, len(palabras)):
    if palabras[i]["inicio"] < palabras[i - 1]["fin"]:
        palabras[i - 1]["fin"] = palabras[i]["inicio"]
frases = []
for fk, acto, texto in frases_txt:
    ps = [p for p in palabras if p["frase"] == fk]
    frases.append({"k": fk, "acto": acto, "texto": texto, "inicio": ps[0]["inicio"], "fin": ps[-1]["fin"]})

# Subtítulos: hasta 2 líneas de 34 caracteres, cortes en puntuación y pausas.
MAX_LINEA = 34


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


bloques, actual = [], []
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
    assert len(b["lineas"]) <= 2 and all(len(l) <= MAX_LINEA + 6 for l in b["lineas"]), b["lineas"]

total = max(DESFASE + dur_voz, palabras[-1]["fin"] + COLA)
res = {"id": loc["id"], "titulo": loc["titulo"], "fps": FPS, "duracion": round(total, 3), "frames": int(round(total * FPS)), "desfaseVoz": DESFASE,
       "frases": frases, "palabras": palabras, "bloques": salida}
(prod / "tiempos.json").write_text(json.dumps(res, ensure_ascii=False, indent=1) + "\n")


def hms(s):
    ms = int(round(s * 1000))
    return f"{ms // 3600000:02d}:{ms % 3600000 // 60000:02d}:{ms % 60000 // 1000:02d},{ms % 1000:03d}"


(prod / "subtitulos.srt").write_text("\n".join(f"{i + 1}\n{hms(b['inicio'])} --> {hms(b['salida'])}\n" + "\n".join(b["lineas"]) + "\n" for i, b in enumerate(salida)))
for f in frases:
    print(f"{f['k']:02d} {f['inicio']:7.2f}-{f['fin']:7.2f} {f['texto'][:60]}")
print(f"Video: {total:.2f} s ({res['frames']} fotogramas) · voz {dur_voz:.2f} s desde {DESFASE} s · {len(salida)} subtítulos")
