#!/usr/bin/env python3
"""
Día de la Militancia — banda sonora: «Five Armies» (Kevin MacLeod, CC BY 4.0) editada sobre la voz,
con lluvia, multitud y bombos de ambiente, y la voz arriba de todo.

- La música se corta a silencio antes del regreso (solo lluvia) y vuelve desde su sección de tensión.
- Se ajusta el tramo central para que el clímax de la música caiga en «Y a los que todavía no saben…».

Uso: audio.py <prod> <musica.mp3> <salida.wav> [voz.mp3]
"""
import json, subprocess, sys, wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
prod, mus_p, out_p = sys.argv[1], sys.argv[2], sys.argv[3]
voz_p = sys.argv[4] if len(sys.argv) > 4 else None
T = json.load(open(f"{prod}/tiempos.json"))
F = {f["k"]: f for f in T["frases"]}
DUR = T["duracion"]
N = int(DUR * SR)
rng = np.random.default_rng(17)


def leer(p, ch=2):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).T.copy()


def fil(x, tipo, f, o=2):
    sos = butter(o, f, tipo, fs=SR, output="sos")
    return sosfilt(sos, x)


mus = leer(mus_p)
musica = np.zeros((2, N))


def pegar(dst, src, t0, g=1.0, fi=0.0, fo=0.0):
    i0 = int(t0 * SR)
    src = src.copy()
    n = src.shape[-1]
    if fi > 0:
        k = min(n, int(fi * SR)); src[..., :k] *= np.linspace(0, 1, k)
    if fo > 0:
        k = min(n, int(fo * SR)); src[..., n - k:] *= np.linspace(1, 0, k)
    i1 = min(dst.shape[-1], i0 + n)
    if i1 > i0:
        dst[..., i0:i1] += src[..., : i1 - i0] * g


def tramo(a, b):
    return mus[:, int(a * SR):int(b * SR)]


# ── Edición de la música ─────────────────────────────────────────────
t_silencio = F[16]["inicio"] - 1.2       # antes de «El 17 de noviembre de 1972…»
t_vuelve = F[18]["inicio"] - 0.4         # «Y detrás de ese regreso…»
t_climax = F[39]["inicio"] - 0.2         # «Y a los que todavía no saben…»
pegar(musica, tramo(0, t_silencio + 1.5), 0, 1.0, 0, 1.5)
# Vuelve desde la sección de tensión (60 s) y llega al clímax (113 s) justo en t_climax.
DESDE_B, CLIMAX = 60.0, 113.0
largo_b = CLIMAX - DESDE_B
sobra = (t_vuelve + largo_b) - t_climax
if sobra > 0:
    # Se saltea un tramo central de energía pareja (crossfade de 1 s).
    corte = 82.0
    pegar(musica, tramo(DESDE_B, corte + 0.5), t_vuelve, 1.0, 2.0, 1.0)
    pegar(musica, tramo(corte + sobra - 0.5, CLIMAX + 60), t_vuelve + (corte - DESDE_B) - 0.5, 1.0, 1.0, 0)
else:
    pegar(musica, tramo(DESDE_B + sobra, CLIMAX + 60), t_vuelve, 1.0, 2.0, 0)
# Final: fundido en los últimos 2,5 s del video.
k = int(2.5 * SR); musica[:, N - k:] *= np.linspace(1, 0, k)

# ── Ambiente ─────────────────────────────────────────────────────────
amb = np.zeros((2, N))


def lluvia(d, g):
    n = int(d * SR)
    base = fil(rng.standard_normal((2, n)), "bandpass", [700, 9000]) * 0.25
    gotas = np.zeros((2, n))
    for _ in range(int(d * 220)):
        i = rng.integers(0, n - 400); c = rng.integers(0, 2)
        gotas[c, i:i + 400] += rng.standard_normal(400) * np.exp(-np.arange(400) / 40) * rng.uniform(0.2, 1)
    gotas = fil(gotas, "highpass", 1500) * 0.35
    return (base + gotas) * g


def multitud(d, g, crece=False):
    n = int(d * SR)
    x = np.zeros((2, n))
    for f0 in (350, 600, 900, 1300, 2000):
        v = fil(rng.standard_normal((2, n)), "bandpass", [f0 * 0.7, f0 * 1.4])
        mod = np.interp(np.arange(n), np.linspace(0, n, max(2, int(d * 3))), rng.uniform(0.4, 1.0, max(2, int(d * 3))))
        x += v * mod
    env = np.linspace(0.3, 1, n) ** 1.5 if crece else np.ones(n)
    return x / 5 * env * g


def bombo(g):
    t = np.arange(int(0.6 * SR)) / SR
    s = np.sin(2 * np.pi * (55 + 40 * np.exp(-t * 25)) * t) * np.exp(-t * 7) + fil(rng.standard_normal(len(t)), "lowpass", 900) * np.exp(-t * 40) * 0.3
    return np.vstack([s, s]) * g


r0 = F[16]["inicio"] - 1.0
pegar(amb, lluvia(F[17]["fin"] - r0 + 2.5, 0.09), r0, 1, 1.0, 2.0)                   # Ezeiza bajo la lluvia
pegar(amb, lluvia(F[2]["fin"] - F[2]["inicio"] + 2, 0.04), F[2]["inicio"] - 0.5, 1, 0.6, 1.2)  # «caminan bajo la lluvia»
pegar(amb, multitud(F[22]["fin"] - F[19]["inicio"] + 1.5, 0.05), F[19]["inicio"] - 0.4, 1, 0.5, 1.0)
pegar(amb, multitud(DUR - F[39]["inicio"], 0.07, True), F[39]["inicio"] - 0.5, 1, 1.5, 3.0)
# Bombos en «Hoy… frente a…» (a tempo de la música, ~112 pulsos por minuto)
b = 60 / 112.35
t = F[28]["inicio"]
while t < F[35]["fin"]:
    pegar(amb, bombo(0.16), t); pegar(amb, bombo(0.1), t + b * 1.5)
    t += b * 2

# ── Voz y mezcla ─────────────────────────────────────────────────────
voz = np.zeros((2, N))
if voz_p:
    v = leer(voz_p, 1)[0]
    act = np.abs(v) > 0.02
    v = v * (0.12 / max(np.sqrt(np.mean(v[act] ** 2)), 1e-6))
    pegar(voz, np.vstack([v, v]) / 1.414, float(T.get("desfaseVoz", 0)))
    e = np.abs(voz[0])
else:
    e = np.zeros(N)
    for p in T["palabras"]:
        e[int(p["inicio"] * SR):int(p["fin"] * SR)] = 0.1
w = int(0.04 * SR); e = np.convolve(e, np.ones(w) / w, "same")
e = np.clip(e / (np.percentile(e[e > 1e-4], 90) + 1e-9), 0, 1)
e = np.clip(np.convolve(e, np.ones(int(0.3 * SR)) / int(0.3 * SR), "same") * 1.6, 0, 1)
rms = lambda x: np.sqrt(np.mean(x ** 2)) + 1e-9
musica *= 0.06 / rms(musica)
# hueco de presencia para la voz
musica = musica - np.vstack([fil(c, "bandpass", [1500, 4200]) for c in musica]) * 0.35
fondo = musica * (1 - 0.6 * e) + amb * (1 - 0.4 * e)
mezcla = fondo + voz
esc = 0.89 / (np.abs(mezcla).max() + 1e-9)


def escribir(p, x):
    x = np.clip(x * esc, -1, 1)
    with wave.open(p, "wb") as wv:
        wv.setnchannels(2); wv.setsampwidth(2); wv.setframerate(SR)
        wv.writeframes((x.T * 32767).astype(np.int16).tobytes())


escribir(out_p, mezcla)
if voz_p:
    escribir(out_p.replace(".wav", "-voz.wav"), voz); escribir(out_p.replace(".wav", "-fondo.wav"), fondo)
print(f"mezcla {DUR:.1f} s · silencio en {t_silencio:.1f}s · vuelve {t_vuelve:.1f}s · clímax {t_climax:.1f}s (salto {max(0, sobra):.1f}s)")
