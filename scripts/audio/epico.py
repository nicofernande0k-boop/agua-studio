#!/usr/bin/env python3
"""
PATRIA EN DISPUTA — banda sonora épica original, sintetizada por código.

Música de tráiler documental (sin samples ni material de terceros): golpes
de taiko y sub, «braams» de metales graves, ostinato de cuerdas, risers,
latidos, coro sintético y un golpe final. Todo se ubica según los tiempos
reales de la voz (tiempos.json: frases y palabras), así cada golpe cae
donde tiene que caer.

Uso:
  python epico.py <carpeta_produccion> [--voz voz/archivo.mp3] [--salida mezcla-final.wav]

Salidas (en <carpeta>/audio/): musica.wav, mezcla-final.wav y, con voz,
mezcla-final-voz.wav / mezcla-final-fondo.wav (para medir la relación voz/fondo).
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
ap.add_argument("--semilla", type=int, default=3)
A = ap.parse_args()
carpeta = Path(A.carpeta)
T = json.loads((carpeta / A.tiempos).read_text())
DUR = T["duracion"]
N = int(DUR * SR) + SR
rng = np.random.default_rng(A.semilla)
F = {f["k"]: f for f in T["frases"]}
PAL = T["palabras"]


def palabras(k):
    return [p for p in PAL if p["frase"] == k]


ini = lambda k: F[k]["inicio"]
fin = lambda k: F[k]["fin"]


# ───────────────────────── utilidades de síntesis ─────────────────────────
def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def t_(d):
    return np.arange(int(d * SR)) / SR


def filtro(x, tipo, f, orden=2):
    if tipo == "bp":
        sos = butter(orden, [max(20, f[0]), min(SR / 2 - 100, f[1])], "bandpass", fs=SR, output="sos")
    else:
        sos = butter(orden, min(f, SR / 2 - 100), tipo, fs=SR, output="sos")
    return sosfilt(sos, x)


def sierra(f, d, fase=None):
    t = t_(d)
    ph = (f * t + (rng.random() if fase is None else fase)) % 1.0
    return 2 * ph - 1


def env(n, a, r, sostener=1.0):
    e = np.ones(n) * sostener
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 1.5 * sostener
    if nr < n:
        e[-nr:] *= np.linspace(1, 0, nr) ** 1.6
    return e


def caida(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def barrido_lp(x, cortes, curva):
    """Filtro pasabajos variable: mezcla de versiones fijas según la curva (0..1)."""
    capas = [filtro(x, "low", c) for c in cortes]
    pos = np.clip(curva, 0, 1) * (len(capas) - 1)
    out = np.zeros_like(x)
    for i in range(len(capas)):
        peso = np.clip(1 - np.abs(pos - i), 0, 1)
        out += capas[i] * peso
    return out


def estereo(x, ancho=0.0, pan=0.0):
    """Mono → estéreo con paneo y un leve ensanchamiento (retardo de Haas)."""
    d = int(0.012 * SR * ancho)
    l = x.copy()
    r = np.concatenate([np.zeros(d), x[: len(x) - d]]) if d else x.copy()
    gl, gr = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
    return np.vstack([l * gl, r * gr])


def pegar(dest, src, t0, nivel=1.0):
    if src.ndim == 1:
        src = estereo(src)
    i0 = int(round(t0 * SR))
    if i0 < 0:
        src = src[:, -i0:]
        i0 = 0
    i1 = min(dest.shape[1], i0 + src.shape[1])
    if i1 > i0:
        dest[:, i0:i1] += src[:, : i1 - i0] * nivel


def reverb(x, largo=3.2, mezcla=0.3, brillo=5000):
    n = int(largo * SR)
    ir = []
    for _ in range(2):
        r = rng.standard_normal(n) * np.exp(-np.arange(n) / (largo / 6.9 * SR))
        r = filtro(r, "low", brillo)
        r[: int(0.012 * SR)] = 0
        ir.append(r / np.sqrt(np.sum(r ** 2)))
    hum = np.vstack([fftconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)])
    return x * (1 - mezcla) + hum * mezcla * 1.4


# ───────────────────────────── instrumentos ─────────────────────────────
def taiko(nivel=1.0, f0=52.0):
    d = 1.6
    t = t_(d)
    f = f0 * (1 + 1.3 * np.exp(-t * 28))
    cuerpo = np.sin(2 * np.pi * np.cumsum(f) / SR) * caida(len(t), 0.42)
    piel = filtro(rng.standard_normal(len(t)), "bp", (90, 1400)) * caida(len(t), 0.05) * 0.9
    x = np.tanh((cuerpo * 1.1 + piel) * 1.6)
    return x * nivel * 0.9


def sub(nivel=1.0, f1=62, f2=28, d=2.2):
    t = t_(d)
    f = f2 + (f1 - f2) * np.exp(-t * 3.2)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * caida(len(t), 0.75) * nivel


def platillo(nivel=0.3, d=3.0):
    x = filtro(rng.standard_normal(int(d * SR)), "high", 4500) * caida(int(d * SR), 0.7)
    return estereo(x * nivel, ancho=1.0)


def braam(raiz=38, d=2.6, nivel=1.0, abre=0.35):
    """Metales graves de tráiler: sierras desafinadas, filtro que se abre y satura."""
    x = np.zeros(int(d * SR))
    for m in (raiz, raiz + 12, raiz + 19):
        for k in range(5):
            x += sierra(hz(m) * 2 ** ((k - 2) * 9 / 1200), d) * (0.6 if m == raiz + 19 else 1.0)
    t = t_(d)
    curva = np.clip(t / abre, 0, 1) ** 0.6 * np.exp(-np.maximum(0, t - abre) * 0.9)
    x = barrido_lp(x / 12, [140, 380, 900, 2000], curva)
    x = np.tanh(x * 2.4) * env(len(x), 0.03, 0.9)
    return estereo(x * nivel, ancho=0.8)


def golpe(nivel=1.0, grande=False, raiz=38):
    out = np.zeros((2, int(4.0 * SR)))
    pegar(out, taiko(1.0), 0)
    pegar(out, sub(0.9 if grande else 0.6), 0)
    pegar(out, platillo(0.18 if grande else 0.07), 0)
    pegar(out, braam(raiz, 3.4 if grande else 1.6, 0.75 if grande else 0.42), 0)
    if grande:
        for k, dt in enumerate((0.0, 0.011, 0.023)):
            pegar(out, taiko(0.6, 46 + 7 * k), dt)
    return out * nivel


def cuerda_corta(m, d=0.16, nivel=0.25, brillo=2600):
    x = sum(sierra(hz(m) * 2 ** (c / 1200), d + 0.25) for c in (-7, 0, 6))
    x = filtro(x / 3, "low", brillo) * env(int((d + 0.25) * SR), 0.006, 0.22)
    return x * nivel


def ostinato(dest, desde, hasta, bpm, acordes, intensidad):
    """Cuerdas en semicorcheas sobre una progresión; intensidad(t) entre 0 y 1."""
    paso = 60 / bpm / 4
    patron = [0, 0, 12, 0, 7, 0, 12, 7, 0, 0, 12, 0, 10, 7, 12, 7]
    t, i = desde, 0
    while t < hasta - 0.05:
        compas = int((t - desde) / (paso * 16))
        raiz = acordes[compas % len(acordes)]
        v = intensidad(t)
        acento = 1.0 if i % 4 == 0 else 0.7
        n = cuerda_corta(raiz + patron[i % 16], nivel=0.22 * v * acento, brillo=1400 + 2600 * v)
        pegar(dest, estereo(n, ancho=0.6, pan=-0.25), t)
        pegar(dest, estereo(cuerda_corta(raiz + patron[i % 16] - 12, nivel=0.16 * v * acento, brillo=900), pan=0.2), t)
        if i % 8 == 0 and v > 0.45:
            pegar(dest, taiko(0.42 * v, 58), t)
        if i % 16 == 10 and v > 0.7:
            pegar(dest, taiko(0.3 * v, 66), t)
        t += paso
        i += 1


def colchon(acorde, d, nivel=0.12, brillo=1600, ataque=1.2, coro=False):
    x = np.zeros(int(d * SR))
    for m in acorde:
        for c in (-6, 0, 5):
            x += sierra(hz(m) * 2 ** (c / 1200), d)
    x /= 3 * len(acorde)
    if coro:  # formantes de una «a» abierta
        x = 0.9 * filtro(x, "bp", (600, 900)) + 0.6 * filtro(x, "bp", (1050, 1350)) + 0.25 * filtro(x, "bp", (2400, 2900))
    else:
        x = filtro(x, "low", brillo)
    return estereo(x * env(len(x), ataque, min(1.5, d / 2)) * nivel, ancho=1.0)


def riser(d, nivel=0.35):
    t = t_(d)
    curva = (t / d) ** 2.2
    ruido_ = barrido_lp(rng.standard_normal(len(t)), [500, 1500, 4000, 9000], curva) * curva
    f = 110 * 2 ** (2.5 * t / d)
    tono = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.25 * curva
    return estereo((ruido_ * 0.6 + filtro(tono, "low", 3000)) * nivel, ancho=1.0)


def latido(nivel=0.5):
    out = np.zeros(int(0.9 * SR))
    for dt, v in ((0, 1.0), (0.22, 0.7)):
        s = sub(v, 70, 40, 0.5)
        i = int(dt * SR)
        out[i : i + len(s)] += s[: len(out) - i]
    return out * nivel


def piano_grave(m, d=3.0, nivel=0.3):
    t = t_(d)
    x = sum(np.sin(2 * np.pi * hz(m) * h * t) * (0.6 ** (h - 1)) * np.exp(-t * (0.9 + h * 0.5)) for h in range(1, 7))
    return x * env(len(t), 0.004, 0.4) * nivel


def tic(nivel=0.08):
    x = filtro(rng.standard_normal(int(0.03 * SR)), "bp", (2500, 6000)) * caida(int(0.03 * SR), 0.004)
    return x * nivel


# ───────────────────────────── partitura ─────────────────────────────
# Re menor. Progresión del ostinato: Re – Si♭ – Fa – Do (i – VI – III – VII).
RE, SIB, FA, DO = 50, 46, 53, 48
musica = np.zeros((2, N))   # cama: se atenúa cuando habla la voz
golpes = np.zeros((2, N))   # golpes y acentos: casi no se atenúan

# 1 · GANCHO — impacto en el fotograma 0 y un golpe por recurso.
pegar(golpes, golpe(1.0, grande=True), 0.0)
recursos = palabras(1)[1:]  # petróleo, gas, litio, agua, tierra
for j, p in enumerate(recursos):
    pegar(golpes, golpe(0.55 + 0.1 * j, grande=(j == len(recursos) - 1), raiz=38 + [0, 3, 5, 7, 0][j]), p["inicio"] - 0.02)
# Pregunta: dron grave + latido + reloj.
d2 = fin(2) - ini(2) + 0.6
pegar(musica, colchon([38, 45], d2, 0.10, 500, 0.3), ini(2) - 0.2)
for k in range(int(d2 / 0.5)):
    pegar(golpes, tic(0.05), ini(2) + k * 0.5)
pegar(golpes, latido(0.55), ini(2) + 0.1)
pegar(golpes, latido(0.55), ini(2) + 1.3)
# Golpe de título justo al terminar la pregunta, precedido por un riser corto.
t_titulo = fin(2) + 0.22
pegar(golpes, riser(1.0, 0.28), t_titulo - 1.0)
pegar(golpes, golpe(1.0, grande=True), t_titulo)

# 2 · RIQUEZA — ostinato que crece.
r0, r1 = ini(3) - 0.25, ini(8) - 0.3
ostinato(musica, r0, r1, 100, [RE, SIB, FA, DO], lambda t: 0.45 + 0.45 * (t - r0) / (r1 - r0))
pegar(musica, colchon([RE - 12, RE - 5], r1 - r0, 0.08, 700, 1.0), r0)
for k in (4, 5, 6, 7):
    pegar(golpes, taiko(0.55), ini(k) - 0.03)
pegar(golpes, riser(1.4, 0.22), r1 - 1.4)

# 3 · PARADOJA — se cae todo: piano grave y latido.
p0 = ini(8) - 0.3
pegar(golpes, sub(0.7, 50, 25, 2.5), p0)
for j, m in enumerate([38, 41, 45, 43, 38]):
    pegar(musica, estereo(piano_grave(m, 3.2, 0.26), pan=-0.1), p0 + 0.2 + j * 1.6)
for k in range(4):
    pegar(golpes, latido(0.4), p0 + 0.6 + k * 1.9)
pegar(musica, colchon([38, 50, 53, 57], fin(10) - p0 + 0.5, 0.06, 1200, 2.0), p0)
# «Es de quién es.» → golpe y medio segundo de silencio.
pegar(golpes, golpe(0.95, grande=True, raiz=36), fin(10) + 0.12)

# 4 · DISPUTA — preguntas con golpes, intensidad creciente.
d0, d1 = ini(11) - 0.2, ini(16) - 0.15
ostinato(musica, d0, d1, 112, [RE, FA, SIB, DO], lambda t: 0.55 + 0.4 * (t - d0) / (d1 - d0))
pegar(musica, colchon([RE - 12, RE - 5, RE], d1 - d0, 0.07, 900, 1.5), d0)
for j, k in enumerate(range(11, 16)):
    pegar(golpes, golpe(0.45 + 0.08 * j, raiz=38 + j), ini(k) - 0.03)
pegar(golpes, riser(ini(16) - ini(15), 0.26), ini(15))
# «Empresas. Nación. Provincias. Comunidades.» — cuatro golpes iguales.
for p in palabras(16):
    pegar(golpes, golpe(0.8, grande=False, raiz=38), p["inicio"] - 0.02)
# «Todos disputan lo mismo: quién decide, y quién se beneficia.» — ostinato a fondo y riser al clímax.
c0, c1 = ini(17) - 0.1, fin(17) + 0.05
ostinato(musica, c0, c1, 124, [RE, SIB], lambda t: 0.85 + 0.15 * (t - c0) / (c1 - c0))
pegar(golpes, riser(c1 - c0, 0.34), c0)
pegar(golpes, golpe(1.0, grande=True), c1 + 0.02)

# 5 · CIERRE — coro y cuerdas largas; crece hasta el golpe final.
k0 = ini(18) - 0.25
pegar(musica, colchon([38, 50, 53, 57], ini(20) - k0, 0.11, 1800, 1.8, coro=True), k0)
pegar(musica, colchon([34, 46, 50, 53], ini(20) - k0, 0.07, 1400, 2.0), k0 + 0.5)
pegar(golpes, latido(0.35), ini(18) + 0.4)
f0, f1 = ini(20) - 0.2, fin(21) + 0.05
pegar(musica, colchon([38, 45, 50, 53, 57], f1 - f0 + 0.3, 0.12, 2600, 1.2, coro=True), f0)
ostinato(musica, f0, f1, 100, [RE, SIB, FA, DO], lambda t: 0.4 + 0.5 * (t - f0) / (f1 - f0))
for k in range(int((f1 - f0) / 0.6)):
    pegar(golpes, taiko(0.25 + 0.5 * k / max(1, (f1 - f0) / 0.6), 60), f0 + k * 0.6)
pegar(golpes, riser(1.6, 0.3), f1 - 1.6)
# Golpe final y acorde que queda sonando (Re mayor: la pregunta se resuelve en decisión).
pegar(golpes, golpe(1.15, grande=True, raiz=38), f1)
pegar(musica, colchon([38, 50, 54, 57, 62], DUR - f1 + 0.5, 0.16, 2200, 0.6, coro=True), f1 + 0.1)
pegar(golpes, estereo(piano_grave(74, 4.0, 0.18), ancho=1.0), f1 + 0.6)

# ───────────────────────────── mezcla ─────────────────────────────
musica = reverb(musica, 3.4, 0.32)
golpes = reverb(golpes, 2.6, 0.22, brillo=3500)
# Hueco de presencia para la voz (1,5–4 kHz) en toda la música.
def hueco(x, g=0.5):
    banda = np.vstack([filtro(c, "bp", (1500, 4200)) for c in x])
    return x - banda * g
musica, golpes = hueco(musica, 0.55), hueco(golpes, 0.35)


def rms(x):
    return np.sqrt(np.mean(x ** 2)) + 1e-9


voz = np.zeros((2, N))
if A.voz:
    crudo = subprocess.run(["ffmpeg", "-v", "error", "-i", str(carpeta / A.voz), "-ac", "1", "-ar", str(SR), "-f", "f64le", "-"], capture_output=True, check=True).stdout
    v = np.frombuffer(crudo, dtype=np.float64)
    act = np.abs(v) > 0.02
    v = v * (0.12 / max(np.sqrt(np.mean(v[act] ** 2)) if act.any() else 0.1, 1e-6))
    pegar(voz, estereo(v), float(T.get("desfaseVoz", 0.0)))
    energia = np.convolve(np.abs(voz[0]), np.ones(int(0.04 * SR)) / int(0.04 * SR), mode="same")
    energia = np.clip(energia / (np.percentile(energia[energia > 1e-4], 90) + 1e-9), 0, 1)
    energia = np.clip(np.convolve(energia, np.ones(int(0.3 * SR)) / int(0.3 * SR), mode="same") * 1.7, 0, 1)
    duck_m, duck_g = 1 - 0.8 * energia, 1 - 0.45 * energia
else:
    # Sin voz: atenuación según los tiempos de las palabras (para previsualizar).
    e = np.zeros(N)
    for p in PAL:
        e[int(p["inicio"] * SR) : int(p["fin"] * SR)] = 1
    e = np.clip(np.convolve(e, np.ones(int(0.3 * SR)) / int(0.3 * SR), mode="same") * 1.5, 0, 1)
    duck_m, duck_g = 1 - 0.8 * e, 1 - 0.45 * e

musica *= 0.05 / rms(musica)
golpes *= 0.06 / rms(golpes)
fondo = musica * duck_m + golpes * duck_g
mezcla = np.tanh((fondo + voz) * 1.05) / 1.05
salida = carpeta / "audio"
salida.mkdir(exist_ok=True)


def escribir(p, x, escala):
    x = np.clip(x[:, : int(DUR * SR)] * escala, -1, 1)
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
print(f"Banda sonora épica: {DUR:.1f} s · voz: {'sí' if A.voz else 'no (previsualización)'} → {salida / A.salida}")
