#!/usr/bin/env python3
"""
PATRIA EN DISPUTA — banda sonora emotiva original (episodio 004 y similares).

Piano íntimo → cuerdas → violonchelo → percusión → orquesta, sincronizado con
las frases reales de la voz (tiempos.json con «acto» por frase). Todo
sintetizado por código: sin samples ni material de terceros.

Uso: python emotivo.py <carpeta> [--voz voz/archivo.mp3] [--salida mezcla-final.wav]
"""
import argparse
import json
import subprocess
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
ap = argparse.ArgumentParser()
ap.add_argument("carpeta")
ap.add_argument("--tiempos", default="tiempos.json")
ap.add_argument("--voz", default=None)
ap.add_argument("--salida", default="mezcla-final.wav")
A = ap.parse_args()
carpeta = Path(A.carpeta)
T = json.loads((carpeta / A.tiempos).read_text())
DUR = T["duracion"]
N = int((DUR + 1) * SR)
rng = np.random.default_rng(7)
F = {f["k"]: f for f in T["frases"]}
ini = lambda k: F[k]["inicio"]
fin = lambda k: F[k]["fin"]
pal = lambda k: [p for p in T["palabras"] if p["frase"] == k]
actos = {}
for f in T["frases"]:
    actos.setdefault(f["acto"], []).append(f["k"])
A0 = lambda a: ini(actos[a][0])
A1 = lambda a: fin(actos[a][-1])


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def filtro(x, tipo, f, orden=2):
    if tipo == "bp":
        sos = butter(orden, [f[0], f[1]], "bandpass", fs=SR, output="sos")
    else:
        sos = butter(orden, min(f, SR / 2 - 200), tipo, fs=SR, output="sos")
    return sosfilt(sos, x)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(n, a, r):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 1.4
    if nr < n:
        e[-nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e


def pegar(dest, x, t0, nivel=1.0, pan=0.0):
    if x.ndim == 1:
        x = np.vstack([x * np.sqrt(0.5 * (1 - pan)), x * np.sqrt(0.5 * (1 + pan))])
    i0 = int(t0 * SR)
    if i0 < 0:
        x, i0 = x[:, -i0:], 0
    i1 = min(dest.shape[1], i0 + x.shape[1])
    if i1 > i0:
        dest[:, i0:i1] += x[:, : i1 - i0] * nivel


# ───────────────────────── instrumentos ─────────────────────────
def piano(m, d=4.0, vel=0.6):
    """Piano: parciales levemente inarmónicos, dos cuerdas por nota y martillo."""
    f0 = hz(m)
    t = t_(d)
    x = np.zeros(len(t))
    B = 0.00035
    brillo = 0.55 + 0.45 * vel
    for h in range(1, 11):
        fh = f0 * h * np.sqrt(1 + B * h * h)
        if fh > 9000:
            break
        amp = (1 / h ** 1.25) * (brillo ** (h - 1))
        dec = np.exp(-t * (0.55 + 0.35 * h) * (f0 / 260) ** 0.35)
        for det in (-0.6, 0.6):
            x += amp * dec * np.sin(2 * np.pi * fh * (1 + det / 1200 * 1.0) * t + rng.random() * 6.28)
    golpe = filtro(rng.standard_normal(len(t)), "low", 2500) * np.exp(-t * 90) * 0.15
    x = (x / 3 + golpe) * vel * env(len(t), 0.002, 0.35)
    return x


def cuerdas(acorde, d, nivel=0.1, ataque=1.5, brillo=2400):
    t = t_(d)
    out = np.zeros((2, len(t)))
    for j, m in enumerate(acorde):
        for k in range(4):
            vib = 1 + 0.0035 * np.sin(2 * np.pi * (5.0 + 0.4 * k) * t + rng.random() * 6.28)
            fase = np.cumsum(hz(m) * vib * 2 ** ((k - 1.5) * 4 / 1200)) / SR
            s = 2 * (fase % 1.0) - 1
            pan = ((j + k) % 4 - 1.5) / 2.2
            pegar(out, s, 0, 1.0, pan)
    out = np.vstack([filtro(c, "low", brillo) for c in out])
    return out * env(len(t), ataque, min(2.0, d * 0.4)) * nivel / len(acorde)


def chelo(notas, nivel=0.12):
    """Línea de violonchelo: lista de (t, midi, duración) relativa."""
    total = max(t0 + d for t0, _, d in notas) + 1
    out = np.zeros(int(total * SR))
    for t0, m, d in notas:
        t = t_(d + 0.6)
        vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip(t / 0.6, 0, 1)
        fase = np.cumsum(hz(m) * vib) / SR
        s = (2 * (fase % 1) - 1) + 0.5 * (2 * ((2 * fase) % 1) - 1)
        s = filtro(s, "low", 1500) * env(len(t), 0.25, 0.6)
        i = int(t0 * SR)
        out[i : i + len(s)] += s[: len(out) - i]
    return out * nivel


def metales(acorde, d, nivel=0.08):
    t = t_(d)
    x = np.zeros(len(t))
    for m in acorde:
        for k in (-3, 0, 3):
            fase = np.cumsum(hz(m) * 2 ** (k / 1200) * np.ones(len(t))) / SR
            x += 2 * (fase % 1) - 1
    x = filtro(x / (3 * len(acorde)), "low", 1100) * env(len(t), 1.2, 1.5)
    return np.tanh(x * 1.6) * nivel


def timbal(m=38, nivel=0.5, d=2.5):
    t = t_(d)
    f = hz(m) * (1 + 0.06 * np.exp(-t * 20))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * np.exp(-t * 3)
    golpe = filtro(rng.standard_normal(len(t)), "bp", (80, 900)) * np.exp(-t * 30) * 0.4
    return (x * np.exp(-t * 1.8) + golpe) * nivel


def redoble(d, nivel=0.3, m=38):
    out = np.zeros(int((d + 2) * SR))
    n = int(d / 0.07)
    for i in range(n):
        v = nivel * (0.25 + 0.75 * (i / max(1, n - 1)) ** 2)
        s = timbal(m, v, 0.8)
        j = int(i * 0.07 * SR)
        out[j : j + len(s)] += s[: len(out) - j]
    return out


def reverb(x, largo=3.0, mezcla=0.32):
    n = int(largo * SR)
    out = []
    for c in range(2):
        r = rng.standard_normal(n) * np.exp(-np.arange(n) / (largo / 6.9 * SR))
        r = filtro(r, "low", 6000)
        r[: int(0.015 * SR)] = 0
        r /= np.sqrt(np.sum(r ** 2))
        out.append(fftconvolve(x[c], r)[: x.shape[1]])
    return x * (1 - mezcla) + np.vstack(out) * mezcla * 1.3


# ───────────────────────── partitura ─────────────────────────
D, Bm, G, Am, Em, Fsm = [50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61], [40, 47, 52, 55], [42, 49, 54, 57]
A_ = [45, 52, 57, 61]
TEMA = [66, 64, 62, 57]  # el «tema del pueblo»: fa#–mi–re–la
mus = np.zeros((2, N))


def arpegios(desde, hasta, prog, paso=2.4, vel=0.42, figura=(0, 2, 1, 3, 2, 1)):
    t, i = desde, 0
    while t < hasta - 0.3:
        ac = prog[i % len(prog)]
        pegar(mus, piano(ac[0] - 12, 4.5, vel * 0.9), t, 1.0, -0.2)
        sub = paso / len(figura)
        for j, n in enumerate(figura):
            if t + j * sub < hasta:
                pegar(mus, piano(ac[n] + 12, 3.2, vel * (0.75 if j else 0.95)), t + j * sub, 1.0, 0.15)
        t += paso
        i += 1


def tema(t0, vel=0.55, paso=0.62, octava=0):
    for j, m in enumerate(TEMA):
        pegar(mus, piano(m + octava, 4.5 if j == 3 else 3.0, vel), t0 + j * paso, 1.0, 0.1)


# 1 · Gancho: el tema arranca en el primer instante, piano solo.
tema(0.02, 0.6)
arpegios(2.6, A1("gancho") + 0.6, [D, Bm, G, A_], 2.6, 0.36)
pegar(mus, cuerdas([38, 50], A1("gancho") - ini(2) + 2, 0.06, 1.2, 900), ini(2) - 0.2)
pegar(mus, timbal(38, 0.25), ini(2) - 0.05)

# 2 · Pueblo: arpegios cálidos y colchón de cuerdas.
p0, p1 = A0("pueblo") - 0.4, A1("pueblo") + 0.6
arpegios(p0, p1, [G, D, Em, A_], 2.4, 0.4)
pegar(mus, cuerdas([50, 57, 62, 66], p1 - p0, 0.07, 2.5, 1800), p0)

# 3 · Historia: entra el violonchelo; timbales en 1876 y 1937.
h0, h1 = A0("historia") - 0.4, A1("historia") + 0.8
arpegios(h0, h1, [Bm, G, D, A_], 2.4, 0.36)
largo = (h1 - h0)
for j, ac in enumerate([Bm, G, D, A_] * 6):
    tj = h0 + j * 2.4
    if tj > h1:
        break
    pegar(mus, cuerdas(ac, 2.8, 0.08 + 0.04 * (tj - h0) / largo, 0.8, 2000), tj)
linea = []
for j, m in enumerate([47, 43, 50, 45, 47, 52, 50, 49, 47, 43, 45, 38]):
    tj = j * 2.4
    if h0 + tj > h1 - 1:
        break
    linea.append((tj, m, 2.2))
pegar(mus, chelo(linea, 0.11), h0, 1.0, -0.3)
for k in actos["historia"]:
    if "mil ochocientos" in F[k]["texto"] or "Salamone" in F[k]["texto"]:
        pegar(mus, timbal(38, 0.42), ini(k) - 0.05)
    if "nombres" in F[k]["texto"]:  # «Muchos de sus nombres…»: se aquieta
        pegar(mus, cuerdas([50, 57, 62, 66, 69], fin(k) - ini(k) + 2, 0.08, 1.5, 1400), ini(k) - 0.2)

# 4 · Solidaridad: color menor en 1985, se resuelve en «el pueblo se defendió».
s0, s1 = A0("solidaridad") - 0.4, A1("solidaridad") + 0.8
k85 = actos["solidaridad"][0]
y_def = next((p["inicio"] for p in pal(k85) if p["texto"] == "Y"), fin(k85) - 1.5)
pegar(mus, cuerdas(Bm, y_def - s0 + 0.5, 0.12, 0.6, 1600), s0)
pegar(mus, cuerdas(Em, y_def - s0 + 0.5, 0.06, 0.6, 1200), s0 + 1.2)
pegar(mus, timbal(35, 0.5), s0 + 0.1)
pegar(mus, cuerdas(D, s1 - y_def + 1, 0.15, 0.4, 2600), y_def - 0.05)
pegar(mus, timbal(38, 0.55), y_def - 0.05)
for b in np.arange(y_def, s1, 60 / 72):
    pegar(mus, timbal(38, 0.12, 1.2), b)
arpegios(y_def, s1, [D, G, Bm, A_], 2.5, 0.38)

# 5 · Estado: ostinato de cuerdas que sostiene, piano adelante.
e0, e1 = A0("estado") - 0.4, A1("estado") + 0.8
corch = 60 / 72 / 2
t = e0
i = 0
prog = [G, D, Bm, A_]
while t < e1:
    ac = prog[int((t - e0) / 3.33) % 4]
    v = 0.05 + 0.04 * (t - e0) / (e1 - e0)
    pegar(mus, cuerdas([ac[0], ac[0] + 12] if i % 2 == 0 else [ac[2]], corch * 1.6, v, 0.03, 2200), t)
    t += corch
    i += 1
arpegios(e0, e1, prog, 3.33, 0.34, (0, 2, 3))
pegar(mus, cuerdas([50, 57, 62, 66], e1 - e0, 0.08, 2.0, 1800), e0)

# 6 · Desafíos: piano y chelo solos; «Y el pueblo sigue» abre el crecimiento final.
d0, d1 = A0("desafios") - 0.4, A1("desafios")
k_sigue = actos["desafios"][-1]
arpegios(d0, ini(k_sigue), [Bm, G, Em, A_], 2.6, 0.32)
pegar(mus, chelo([(0, 47, 2.4), (2.6, 43, 2.4), (5.2, 40, 2.4), (7.8, 45, 3.0)], 0.12), d0, 1.0, -0.3)
pegar(mus, cuerdas([45, 52, 57, 61, 64], fin(k_sigue) - ini(k_sigue) + 2.5, 0.12, 1.2, 2600), ini(k_sigue) - 0.2)
pegar(mus, redoble(fin(k_sigue) - ini(k_sigue) + 1.0, 0.22), ini(k_sigue) - 0.2)

# 7 · Cierre: clímax orquestal en «la memoria de los abuelos…», piano solo al final.
c = actos["cierre"]
c0 = ini(c[0]) - 0.3
clim0, clim1 = ini(c[1]) - 0.25, fin(c[1]) + 0.6
pegar(mus, timbal(38, 0.6), c0)
pegar(mus, cuerdas(D, clim0 - c0 + 0.5, 0.14, 0.8, 2600), c0)
for j, ac in enumerate([D, Bm, G, A_, D]):
    tj = clim0 + j * (clim1 - clim0) / 4.2
    if tj < clim1:
        pegar(mus, cuerdas([m + 12 for m in ac] + ac, (clim1 - clim0) / 4 + 1.5, 0.2, 0.3, 3400), tj)
        pegar(mus, metales(ac[:3], (clim1 - clim0) / 4 + 1.2, 0.09), tj)
        pegar(mus, timbal(38 if j % 2 == 0 else 33, 0.55), tj)
        pegar(mus, piano(ac[0] - 12, 4.0, 0.7), tj)
tema(clim0 + 0.1, 0.62, 0.9, 12)
pegar(mus, cuerdas([50, 57, 62, 66, 69], fin(c[2]) - clim1 + 2, 0.12, 0.3, 2000), clim1 - 0.2)
# Última frase: el tema, piano solo; la nota final se apaga y queda el silencio.
tema(ini(c[3]) - 0.1, 0.5, 0.75)
pegar(mus, piano(38, 4.0, 0.3), fin(c[3]) + 0.25, 1.0)
pegar(mus, piano(62, 4.0, 0.25), fin(c[3]) + 0.25, 1.0)

# ───────────────────────── mezcla ─────────────────────────
mus = reverb(mus, 3.2, 0.34)
# Hueco de presencia para la voz
banda = np.vstack([filtro(ch, "bp", (1500, 4200)) for ch in mus])
mus = mus - banda * 0.45
# Silencio final real: fundido de la música a cero 2,5 s después de la última nota.
cola = int((fin(c[3]) + 2.2) * SR)
if cola < N:
    lf = int(1.0 * SR)
    mus[:, cola : cola + lf] *= np.linspace(1, 0, min(lf, N - cola))
    mus[:, cola + lf :] = 0

voz = np.zeros((2, N))
if A.voz:
    crudo = subprocess.run(["ffmpeg", "-v", "error", "-i", str(carpeta / A.voz), "-ac", "1", "-ar", str(SR), "-f", "f64le", "-"], capture_output=True, check=True).stdout
    v = np.frombuffer(crudo, dtype=np.float64)
    act = np.abs(v) > 0.02
    v = v * (0.12 / max(np.sqrt(np.mean(v[act] ** 2)) if act.any() else 0.1, 1e-6))
    pegar(voz, v, float(T.get("desfaseVoz", 0.0)))
    e = np.abs(voz[0])
else:
    e = np.zeros(N)
    for p in T["palabras"]:
        e[int(p["inicio"] * SR) : int(p["fin"] * SR)] = 0.1
ven = int(0.04 * SR)
e = np.convolve(e, np.ones(ven) / ven, mode="same")
e = np.clip(e / (np.percentile(e[e > 1e-4], 90) + 1e-9), 0, 1)
e = np.clip(np.convolve(e, np.ones(int(0.35 * SR)) / int(0.35 * SR), mode="same") * 1.7, 0, 1)
mus *= 0.04 / (np.sqrt(np.mean(mus ** 2)) + 1e-9)
fondo = mus * (1 - 0.78 * e)
mezcla = fondo + voz
salida = carpeta / "audio"
salida.mkdir(exist_ok=True)


def escribir(p, x, esc):
    x = np.clip(x[:, : int(DUR * SR)] * esc, -1, 1)
    with wave.open(str(p), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x.T * 32767).astype(np.int16).tobytes())


esc = 0.89 / (np.abs(mezcla).max() + 1e-9)
escribir(salida / "musica.wav", fondo, 0.89 / (np.abs(fondo).max() + 1e-9))
escribir(salida / A.salida, mezcla, esc)
if A.voz:
    escribir(salida / A.salida.replace(".wav", "-voz.wav"), voz, esc)
    escribir(salida / A.salida.replace(".wav", "-fondo.wav"), fondo, esc)
print(f"Banda sonora emotiva: {DUR:.1f} s · voz: {'sí' if A.voz else 'no (previsualización)'} → {salida / A.salida}")
