#!/usr/bin/env python3
"""
Sintetizador de banda sonora y efectos de AGUA STUDIO.

Genera música instrumental y efectos 100 % por código (numpy): sin samples,
sin descargas y sin material de terceros. Lee:
  - producciones/<id>/tiempos.json   (duración y ventanas de narración)
  - producciones/<id>/sonido.json    (secciones de música y marcas de efectos)
  - producciones/<id>/voz/*.wav      (opcional: locución grabada)

Escribe en producciones/<id>/audio/ (no se versiona):
  musica.wav, efectos.wav, mezcla.wav (48 kHz, estéreo, 16 bits)

Si hay locución, la mezcla la incluye y baja la música mientras se habla.

Uso: python3 scripts/audio/sintetizar.py producciones/001-agua
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000
import argparse

_p = argparse.ArgumentParser(description="Música, efectos y mezcla de AGUA STUDIO")
_p.add_argument("carpeta", nargs="?", default="producciones/001-agua")
_p.add_argument("--tiempos", default="tiempos.json")
_p.add_argument("--sonido", default="sonido.json")
_p.add_argument("--voz", default=None, help="narración completa (se ubica en desfaseVoz de los tiempos)")
_p.add_argument("--salida", default="mezcla.wav")
ARGS = _p.parse_args()
carpeta = Path(ARGS.carpeta)
tiempos = json.loads((carpeta / ARGS.tiempos).read_text())
sonido = json.loads((carpeta / ARGS.sonido).read_text())
DUR = float(tiempos["duracion"])
N = int(DUR * SR)
rng = np.random.default_rng(2025)
t_total = np.arange(N) / SR


# ---------------------------------------------------------------- utilidades
def hz(midi):
    return 440.0 * 2 ** ((np.asarray(midi) - 69) / 12)


def env_adsr(n, a, d, s, r, sr=SR):
    a, d, r = int(a * sr), int(d * sr), int(r * sr)
    e = np.full(n, s, dtype=np.float64)
    a = min(a, n)
    e[:a] = np.linspace(0, 1, a, endpoint=False) if a else e[:a]
    d = min(d, n - a)
    e[a : a + d] = np.linspace(1, s, d, endpoint=False) if d else e[a : a + d]
    r = min(r, n)
    if r:
        e[n - r :] *= np.linspace(1, 0, r)
    return e


def osc(f, n, forma="sin", armonicos=10, fase=0.0):
    t = np.arange(n) / SR
    if forma == "sin":
        return np.sin(2 * np.pi * f * t + fase)
    y = np.zeros(n)
    for k in range(1, armonicos + 1):
        if f * k > SR / 2.2:
            break
        if forma == "saw":
            y += np.sin(2 * np.pi * f * k * t + fase * k) / k
        elif forma == "tri" and k % 2:
            y += ((-1) ** ((k - 1) // 2)) * np.sin(2 * np.pi * f * k * t) / (k * k)
        elif forma == "square" and k % 2:
            y += np.sin(2 * np.pi * f * k * t) / k
    return y


def fft_filtrar(x, bajo=None, alto=None, suave=1.0):
    """Filtro estático en frecuencia (pasa banda suave)."""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if alto:
        g *= 1 / np.sqrt(1 + (f / alto) ** (4 * suave))
    if bajo:
        g *= 1 / np.sqrt(1 + (bajo / np.maximum(f, 1e-3)) ** (4 * suave))
    return np.fft.irfft(X * g, n)


def filtrar_variable(x, corte):
    """Pasa bajos que cambia en el tiempo (STFT). `corte` es un array por muestra."""
    tam, salto = 2048, 512
    ventana = np.hanning(tam)
    pad = np.concatenate([np.zeros(tam), x, np.zeros(tam)])
    out = np.zeros_like(pad)
    norm = np.zeros_like(pad)
    f = np.fft.rfftfreq(tam, 1 / SR)
    for i in range(0, len(pad) - tam, salto):
        c = corte[min(max(i - tam + tam // 2, 0), len(corte) - 1)]
        g = 1 / np.sqrt(1 + (f / max(c, 20)) ** 4)
        seg = np.fft.irfft(np.fft.rfft(pad[i : i + tam] * ventana) * g, tam)
        out[i : i + tam] += seg * ventana
        norm[i : i + tam] += ventana**2
    return (out / np.maximum(norm, 1e-6))[tam : tam + len(x)]


def ruido(n, color="blanco"):
    w = rng.standard_normal(n)
    if color == "marron":
        b = np.cumsum(w)
        b = fft_filtrar(b, bajo=20)
        return b / (np.abs(b).max() + 1e-9)
    if color == "rosa":
        X = np.fft.rfft(w)
        f = np.fft.rfftfreq(n, 1 / SR)
        X[1:] /= np.sqrt(f[1:])
        p = np.fft.irfft(X, n)
        return p / (np.abs(p).max() + 1e-9)
    return w / 4


def pegar(dest, src, t0, nivel=1.0, pan=0.0):
    """Suma `src` (mono) en `dest` (estéreo) desde t0 segundos, con paneo."""
    i = int(t0 * SR)
    if i >= dest.shape[1] or i + len(src) <= 0:
        return
    j = min(dest.shape[1], i + len(src))
    s = src[: j - i] * nivel
    izq = np.cos((pan + 1) * np.pi / 4)
    der = np.sin((pan + 1) * np.pi / 4)
    dest[0, i:j] += s * izq * 1.414
    dest[1, i:j] += s * der * 1.414


def reverb(est, largo=2.6, mezcla=0.28):
    n = int(largo * SR)
    t = np.arange(n) / SR
    salida = np.zeros_like(est)
    for c in range(2):
        ir = rng.standard_normal(n) * np.exp(-t * 3.2)
        ir = fft_filtrar(ir, alto=6000)
        ir /= np.sqrt(np.sum(ir**2))
        L = 1 << int(np.ceil(np.log2(est.shape[1] + n)))
        mojado = np.fft.irfft(np.fft.rfft(est[c], L) * np.fft.rfft(ir, L), L)[: est.shape[1]]
        salida[c] = est[c] * (1 - mezcla) + mojado * mezcla * 1.6
    return salida


# --------------------------------------------------------------- instrumentos
def pad(notas, dur, brillo=1800, nivel=0.12):
    n = int(dur * SR)
    y = np.zeros(n)
    for m in notas:
        for det in (-0.07, 0.0, 0.07):
            y += osc(hz(m + det), n, "saw", 14, fase=rng.uniform(0, 6))
    y = fft_filtrar(y, alto=brillo, bajo=60)
    y *= env_adsr(n, min(1.2, dur * 0.3), 0.5, 0.85, min(1.5, dur * 0.35))
    return y / (len(notas) * 3) * nivel * 4


def cuerdas(notas, dur, brillo=2200, nivel=0.12, ataque=1.6):
    """Ensamble de cuerdas: sierras desafinadas con vibrato lento y ataque suave."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for m in notas:
        for det, fase in ((-0.09, 0.0), (0.0, 1.3), (0.08, 2.1), (0.15, 0.7)):
            f = hz(m + det) * (1 + 0.0035 * np.sin(2 * np.pi * (4.6 + det) * t + fase))
            fase_inst = 2 * np.pi * np.cumsum(f) / SR
            for k in range(1, 9):
                y += np.sin(k * fase_inst + fase * k) / k
    y = fft_filtrar(y, alto=brillo, bajo=70)
    y *= env_adsr(n, min(ataque, dur * 0.4), 0.3, 0.9, min(2.0, dur * 0.4))
    return y / (len(notas) * 4) * nivel * 3


def pluck(m, dur=1.4, nivel=0.25, brillo=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m)
    y = np.sin(2 * np.pi * f * t) + 0.35 * brillo * np.sin(4 * np.pi * f * t) + 0.12 * brillo * np.sin(6 * np.pi * f * t)
    y *= np.exp(-t * 3.2) * np.minimum(1, t / 0.004)
    return y * nivel


def piano(m, dur=2.2, nivel=0.22):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m)
    y = sum(np.sin(2 * np.pi * f * k * (1 + 0.0004 * k * k) * t) * np.exp(-t * (1.6 + k * 0.9)) / k for k in range(1, 7))
    return y * np.minimum(1, t / 0.003) * nivel


def bajo_pulso(m, dur, nivel=0.3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = osc(hz(m), n, "saw", 8)
    y = fft_filtrar(y, alto=420)
    return y * np.exp(-t * 7) * np.minimum(1, t / 0.005) * nivel


def bombo(nivel=0.5, dur=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 50 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * nivel


def timbal(nivel=0.8, dur=2.4, f0=62):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.25 * np.exp(-t * 10))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    y += fft_filtrar(ruido(n), alto=900) * np.exp(-t * 14) * 0.8
    return y * nivel


def tic(nivel=0.15):
    n = int(0.04 * SR)
    t = np.arange(n) / SR
    return fft_filtrar(ruido(n), bajo=2500, alto=7000) * np.exp(-t * 160) * nivel * 4


def campana(m, nivel=0.15, dur=2.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m)
    y = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 2) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 4)
    return y * np.exp(-t * 1.8) * np.minimum(1, t / 0.002) * nivel


# ------------------------------------------------------------------- música
def musica():
    m = np.zeros((2, N))
    for sec in sonido["musica"]:
        a, b, est, nv = sec["desde"], sec["hasta"], sec["estilo"], sec["nivel"]
        d = b - a
        if est == "misterio":
            pegar(m, pad([45, 52, 57, 59], d, brillo=900, nivel=0.16), a, nv)
            pegar(m, osc(hz(33), int(d * SR)) * env_adsr(int(d * SR), 2, 0.1, 1, 0.3) * 0.18, a, nv)
            for k, nota in enumerate([76, 72, 79, 71, 74]):
                pegar(m, campana(nota, 0.09), a + 0.8 + k * 1.55, nv, pan=0.5 * np.sin(k))
        elif est == "tension":
            bpm = 100
            paso = 60 / bpm / 2
            notas = [38, 38, 41, 38, 43, 38, 41, 40]
            k = 0
            t = a
            while t < b - 0.2:
                crece = (t - a) / d
                pegar(m, bajo_pulso(notas[k % 8], 0.4, 0.22 + 0.12 * crece), t, nv)
                t += paso
                k += 1
            pegar(m, pad([50, 53, 57, 58], d, brillo=700, nivel=0.13), a, nv)
            pegar(m, pad([74, 75], d * 0.6, brillo=2400, nivel=0.05), a + d * 0.4, nv)
        elif est == "mecanico":
            bpm = 120
            t = a
            while t < b - 0.1:
                pegar(m, tic(0.12), t, nv, pan=0.3)
                t += 60 / bpm
            for k, acorde in enumerate([[43, 50, 55, 58], [46, 53, 58, 61], [41, 48, 53, 56], [43, 50, 55, 58]]):
                seg = d / 4
                pegar(m, pad(acorde, seg + 0.6, brillo=1100 + k * 300, nivel=0.14), a + k * seg, nv)
                pegar(m, bajo_pulso(acorde[0] - 12, 1.6, 0.35), a + k * seg, nv)
            pegar(m, osc(hz(31), int(d * SR)) * env_adsr(int(d * SR), 3, 0.1, 1, 1) * 0.12, a, nv)
        elif est == "reflexivo":
            prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
            bpm = 72
            negra = 60 / bpm
            t = a + 0.2
            k = 0
            while t < b - 1.0:
                ac = prog[(k // 8) % 4]
                pegar(m, piano(ac[k % 3] + (12 if (k // 3) % 2 else 0), 2.4, 0.16), t, nv, pan=-0.3 + 0.6 * ((k % 3) / 2))
                if k % 8 == 0:
                    pegar(m, pad([ac[0] - 12] + ac, negra * 8 + 0.8, brillo=1300, nivel=0.1), t, nv)
                    pegar(m, piano(ac[0] - 24, 3.0, 0.2), t, nv)
                t += negra / 2
                k += 1
        elif est == "esperanza":
            prog = [[48, 52, 55, 60], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57]]
            bpm = 96
            negra = 60 / bpm
            compas = negra * 4
            k = 0
            t = a
            while t < b - 0.3:
                ac = prog[int((t - a) // compas) % 4]
                pegar(m, pluck(ac[k % 4] + 12, 0.9, 0.12), t, nv, pan=0.35 * np.sin(k))
                if k % 8 == 0:
                    pegar(m, pad(ac, compas + 0.6, brillo=2200, nivel=0.12), t, nv)
                    pegar(m, bombo(0.32), t, nv)
                if k % 8 == 4:
                    pegar(m, bombo(0.22), t, nv)
                t += negra / 2
                k += 1
        elif est == "epico":
            prog = [[41, 48, 53, 57, 60], [43, 50, 55, 59, 62], [45, 52, 57, 60, 64], [48, 55, 60, 64, 67]]
            seg = 3.0
            final = sec.get("final", min(12.0, d - 3.5))
            k = 0
            while k * seg < final - 0.5:
                ac = prog[k % 4]
                crece = min(1.0, k * seg / max(final, 1))
                pegar(m, pad(ac, min(seg + 1.0, final - k * seg + 1.0), brillo=1800 + 1400 * crece, nivel=0.13 + 0.06 * crece), a + k * seg, nv)
                pegar(m, bajo_pulso(ac[0] - 12, 2.5, 0.35), a + k * seg, nv)
                k += 1
            if final < d - 0.3:
                resto = b - (a + final)
                pegar(m, pad([36, 48, 55, 60, 64, 67, 72], resto, brillo=3200, nivel=0.2), a + final, nv)
                pegar(m, campana(84, 0.08, 4), a + final + 0.2, nv, pan=0.4)
                pegar(m, campana(79, 0.08, 4), a + final + 0.5, nv, pan=-0.4)
            for g in sec.get("golpes", []):
                pegar(m, timbal(0.9, 2.6), g, nv)
        elif est == "piano_min":
            # Piano minimalista: notas sueltas, mucho aire.
            frase = sec.get("notas", [62, 65, 69, 67, 65, 64, 62, 57])
            paso = sec.get("paso", 1.6)
            t = a + 0.3
            k = 0
            while t < b - 1.5:
                pegar(m, piano(frase[k % len(frase)], 3.2, 0.2), t, nv, pan=0.25 * np.sin(k))
                if k % 4 == 0:
                    pegar(m, piano(frase[k % len(frase)] - 24, 4.0, 0.16), t, nv)
                t += paso * (1.0 if k % 3 else 1.35)
                k += 1
            pegar(m, cuerdas([38, 45], d, brillo=700, nivel=0.05, ataque=3), a, nv)
        elif est == "cuerdas":
            prog = sec.get("acordes", [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 61]])
            seg = d / len(prog)
            for k, ac in enumerate(prog):
                pegar(m, cuerdas(ac, seg + 1.2, brillo=1500 + 250 * k, nivel=0.12 + 0.015 * k), a + k * seg, nv)
            for k in range(int(d / 2.4)):
                pegar(m, piano(prog[(k * 2 // 4) % len(prog)][2] + 12, 2.6, 0.1), a + 0.6 + k * 2.4, nv, pan=-0.2)
        elif est == "crece":
            prog = sec.get("acordes", [[48, 55, 60, 64], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57]])
            seg = d / len(prog)
            bpm = 84
            corchea = 60 / bpm / 2
            t = a
            k = 0
            while t < b - 0.3:
                ac = prog[min(len(prog) - 1, int((t - a) // seg))]
                crece = (t - a) / d
                pegar(m, piano(ac[k % 4] + 12, 1.4, 0.07 + 0.06 * crece), t, nv, pan=0.3 * np.sin(k))
                t += corchea
                k += 1
            for k, ac in enumerate(prog):
                pegar(m, cuerdas(ac + [ac[2] + 12], seg + 1.0, brillo=1800 + 500 * k, nivel=0.1 + 0.03 * k), a + k * seg, nv)
        elif est == "climax":
            prog = sec.get("acordes", [[41, 48, 53, 57, 60], [43, 50, 55, 59, 62], [45, 52, 57, 60, 64], [48, 55, 60, 64, 67]])
            final = sec.get("final", d - 3)
            seg = final / len(prog)
            for k, ac in enumerate(prog):
                pegar(m, cuerdas(ac + [ac[2] + 12, ac[4] + 12], seg + 1.2, brillo=2400 + 600 * k, nivel=0.14 + 0.03 * k, ataque=1.0), a + k * seg, nv)
                pegar(m, bajo_pulso(ac[0] - 12, 2.8, 0.3), a + k * seg, nv)
            pegar(m, cuerdas([36, 48, 55, 60, 64, 67, 72], b - (a + final), brillo=3000, nivel=0.2, ataque=0.8), a + final, nv)
            for g in sec.get("golpes", []):
                pegar(m, timbal(0.8, 2.6), g, nv)
        elif est == "emotivo":
            prog = [[53, 57, 60], [48, 52, 55], [50, 53, 57], [46, 50, 53]]
            seg = d / 4
            for k, ac in enumerate(prog):
                pegar(m, pad([ac[0] - 12] + ac, seg + 0.8, brillo=1600 + 300 * k, nivel=0.12 + 0.02 * k), a + k * seg, nv)
                for j, nota in enumerate(ac + [ac[1] + 12]):
                    pegar(m, piano(nota + 12, 2.2, 0.13), a + k * seg + j * seg / 4, nv, pan=-0.3 + 0.2 * j)
    # Corte en seco del "silencio repentino" (fin de la música del inicio).
    return m


# ------------------------------------------------------------------ efectos
def fx(tipo, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    if tipo == "ambiente_ciudad":
        y = ruido(n, "marron") * 0.6 + fft_filtrar(ruido(n, "rosa"), bajo=200, alto=1800) * 0.15
        for k in range(int(dur / 1.8)):
            c = int((0.4 + k * 1.8 + rng.uniform(0, 0.8)) * SR)
            w = int(1.2 * SR)
            if c + w < n:
                y[c : c + w] += fft_filtrar(ruido(w), bajo=150, alto=900) * np.hanning(w) * 1.2
        return y * env_adsr(n, 0.5, 0.1, 1, 0.8) * 0.5
    if tipo in ("whoosh", "whoosh_grave", "reverso", "convergen"):
        base = ruido(n, "rosa")
        lo, hi = (200, 5000) if tipo != "whoosh_grave" else (60, 1500)
        corte = lo + (hi - lo) * np.sin(np.pi * np.linspace(0, 1, n)) ** 2
        if tipo in ("reverso", "convergen"):
            corte = lo + (hi - lo) * np.linspace(0, 1, n) ** 2
        y = filtrar_variable(base, corte)
        e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5 if tipo not in ("reverso", "convergen") else np.linspace(0, 1, n) ** 2
        if tipo == "convergen":
            y += sum(np.sin(2 * np.pi * hz(m) * t) * np.linspace(0, 1, n) ** 3 * 0.08 for m in (84, 88, 91))
        return y * e
    if tipo == "chirrido_canilla":
        f = 900 + 500 * np.sin(np.pi * t / dur) + 80 * np.sin(2 * np.pi * 23 * t)
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + fft_filtrar(ruido(n), bajo=1500, alto=5000) * 0.5
        return y * env_adsr(n, 0.05, 0.1, 0.7, 0.1) * 0.6
    if tipo == "tos_canieria":
        y = np.zeros(n)
        for c in (0.0, 0.16, 0.28, 0.45):
            i = int(c * SR)
            w = min(int(0.12 * SR), n - i)
            tt = np.arange(w) / SR
            y[i : i + w] += fft_filtrar(ruido(w), bajo=150, alto=1400) * np.exp(-tt * 25) * 2.5
            y[i : i + w] += np.sin(2 * np.pi * 95 * tt) * np.exp(-tt * 30) * 0.6
        return y
    if tipo == "gota":
        f = 900 + 1400 * (1 - np.exp(-t * 40))
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18) * np.minimum(1, t / 0.002) * 0.8
    if tipo in ("agua_fluye", "agua_vuelve", "fuga"):
        base = fft_filtrar(ruido(n), bajo=300, alto=4000 if tipo != "fuga" else 9000)
        mod = 0.6 + 0.4 * np.sin(2 * np.pi * 3.3 * t) * np.sin(2 * np.pi * 0.7 * t)
        e = env_adsr(n, 0.4 if tipo != "agua_vuelve" else dur * 0.8, 0.1, 1, 0.6)
        return base * mod * e * (1.6 if tipo == "fuga" else 2.2)
    if tipo == "agua_se_va":
        base = ruido(n, "rosa")
        corte = 3000 * np.exp(-t / (dur * 0.45)) + 120
        y = filtrar_variable(base, corte)
        for k in range(14):
            c = int(rng.uniform(0, dur * 0.85) * SR)
            w = int(0.18 * SR)
            if c + w < n:
                tt = np.arange(w) / SR
                y[c : c + w] += np.sin(2 * np.pi * np.cumsum(260 + 300 * np.exp(-tt * 12)) / SR) * np.exp(-tt * 14) * 0.35
        return y * env_adsr(n, 0.2, 0.1, 1, dur * 0.4)
    if tipo == "pasos":
        y = np.zeros(n)
        for k in range(int(dur * 9)):
            c = rng.uniform(0, dur - 0.05)
            w = int(0.05 * SR)
            pegar_mono(y, fft_filtrar(ruido(w), bajo=200, alto=2500) * np.exp(-np.arange(w) / SR * 60) * 1.3, c)
        return y * env_adsr(n, 0.4, 0.1, 1, 0.5)
    if tipo == "tren":
        base = filtrar_variable(ruido(n, "marron") * 2 + ruido(n) * 0.3, 300 + 2500 * np.sin(np.pi * np.linspace(0, 1, n)) ** 2)
        clac = np.zeros(n)
        for k in range(int(dur * 6)):
            pegar_mono(clac, fft_filtrar(ruido(int(0.04 * SR)), bajo=400, alto=3000) * 1.5, k / 6)
        return (base + clac) * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.2
    if tipo == "grieta":
        y = fft_filtrar(ruido(n, "marron"), alto=200) * 3 * np.linspace(0.3, 1, n)
        for k in range(10):
            c = rng.uniform(0, dur * 0.8)
            w = int(0.07 * SR)
            pegar_mono(y, fft_filtrar(ruido(w), bajo=800, alto=6000) * np.exp(-np.arange(w) / SR * 40) * 1.2, c)
        return y * env_adsr(n, 0.3, 0.1, 1, 0.8)
    if tipo == "platos":
        y = np.zeros(n)
        for k in range(int(dur * 3)):
            pegar_mono(y, campana(rng.integers(88, 98), 0.12, 0.3), rng.uniform(0, dur - 0.3))
        return y + fft_filtrar(ruido(n, "rosa"), bajo=300, alto=2500) * 0.15
    if tipo == "viento":
        return filtrar_variable(ruido(n, "rosa"), 400 + 600 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.15 * t))) * env_adsr(n, dur * 0.3, 0.1, 1, dur * 0.3)
    if tipo == "lluvia":
        base = fft_filtrar(ruido(n), bajo=500, alto=7000) * 1.4
        for k in range(int(dur * 40)):
            c = int(rng.uniform(0, dur - 0.02) * SR)
            w = int(0.012 * SR)
            if c + w < n:
                base[c : c + w] += rng.standard_normal(w) * np.hanning(w) * 0.6
        return base * env_adsr(n, 0.25, 0.1, 1, 0.4)
    if tipo == "tono_sala":
        # Silencio "habitado": casi imperceptible, evita el cero digital absoluto.
        return fft_filtrar(ruido(n, "marron"), alto=400) * env_adsr(n, 0.3, 0.1, 1, 0.4) * 0.05
    if tipo == "ambiente_se_apaga":
        y = ruido(n, "marron") * 0.6
        return y * np.linspace(1, 0, n) ** 1.5 * 0.5
    if tipo == "rumor_grave":
        y = fft_filtrar(ruido(n, "marron"), alto=180) * 2.5 + np.sin(2 * np.pi * 38 * t) * 0.3
        return y * env_adsr(n, dur * 0.6, 0.1, 1, 0.3)
    if tipo in ("impacto", "impacto_final"):
        y = timbal(1.0, dur, 48 if tipo == "impacto_final" else 58) + fft_filtrar(ruido(n), alto=3000) * np.exp(-t * 6) * 0.6
        return y
    if tipo == "timbal":
        y = np.zeros(n)
        for c, nv in ((0.0, 0.9), (0.45, 0.6), (0.7, 1.0)):
            pegar_mono(y, timbal(nv, dur - c), c)
        return y
    if tipo == "monedas":
        y = np.zeros(n)
        for k in range(int(dur * 4)):
            c = rng.uniform(0, dur - 0.3)
            pegar_mono(y, campana(rng.integers(96, 104), 0.25, 0.3), c)
            pegar_mono(y, campana(rng.integers(100, 108), 0.15, 0.25), c + 0.01)
            if k % 2:
                w = int(0.08 * SR)
                pegar_mono(y, fft_filtrar(ruido(w), bajo=2000, alto=8000) * np.hanning(w) * 1.5, rng.uniform(0, dur - 0.1))
        return y
    if tipo == "golpe_metal":
        y = campana(55, 0.6, dur)[:n] + campana(62, 0.3, dur)[:n] + fft_filtrar(ruido(n), alto=2000) * np.exp(-t * 25)
        return y
    if tipo == "valvula_cierra" or tipo == "valvula_abre":
        y = np.zeros(n)
        paso = 0.11
        for k in range(int(dur / paso)):
            pegar_mono(y, tic(0.5), k * paso)
            pegar_mono(y, campana(70 + (k % 3), 0.05, 0.15), k * paso)
        chirr = np.sin(2 * np.pi * np.cumsum(300 + 120 * np.sin(2 * np.pi * 1.5 * t)) / SR) * 0.12
        return y + chirr * env_adsr(n, 0.2, 0.1, 1, 0.3)
    if tipo == "pops":
        y = np.zeros(n)
        for k in range(18):
            c = k * dur / 18
            w = int(0.12 * SR)
            tt = np.arange(w) / SR
            pegar_mono(y, np.sin(2 * np.pi * np.cumsum(500 + 900 * np.exp(-tt * 50)) / SR) * np.exp(-tt * 30) * 0.5, c)
        return y
    if tipo == "papeles":
        y = np.zeros(n)
        for k in range(6):
            c = k * dur / 6
            w = int(0.35 * SR)
            pegar_mono(y, fft_filtrar(ruido(w), bajo=1500, alto=7000) * np.hanning(w) * 1.6, c)
            pegar_mono(y, bombo(0.25, 0.25), c + 0.32)
        return y
    if tipo == "herramientas":
        y = np.zeros(n)
        for k in range(int(dur / 0.14)):
            c = k * 0.14 + rng.uniform(0, 0.03)
            pegar_mono(y, campana(rng.choice([86, 89, 93]), 0.18, 0.2), c)
            pegar_mono(y, tic(0.3), c)
        return y
    if tipo == "brillo":
        y = sum(np.sin(2 * np.pi * hz(m) * t + 3 * np.sin(2 * np.pi * 0.3 * t)) for m in (79, 83, 86, 91)) * 0.06
        return y * env_adsr(n, dur * 0.4, 0.1, 1, dur * 0.4)
    return np.zeros(n)


def pegar_mono(dest, src, t0):
    i = int(t0 * SR)
    j = min(len(dest), i + len(src))
    if i < len(dest):
        dest[i:j] += src[: j - i]


def efectos():
    e = np.zeros((2, N))
    for c in sonido["efectos"]:
        y = fx(c["tipo"], c["dur"])
        pan = {"monedas": 0.3, "herramientas": -0.2, "whoosh": 0.0}.get(c["tipo"], 0.0)
        pegar(e, y, c["t"], c["nivel"], pan)
    return e


# -------------------------------------------------------------------- mezcla
def leer_wav(p):
    with wave.open(str(p)) as w:
        sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
        datos = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64) / 32768
    datos = datos.reshape(-1, ch).mean(axis=1)
    if sr != SR:
        x = np.linspace(0, len(datos) - 1, int(len(datos) * SR / sr))
        datos = np.interp(x, np.arange(len(datos)), datos)
    return datos


def escribir_wav(p, est):
    est = np.clip(est, -1, 1)
    datos = (est.T * 32767).astype(np.int16)
    with wave.open(str(p), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(datos.tobytes())


def normalizar(est, pico=0.89):
    return est * (pico / (np.abs(est).max() + 1e-9))


def main():
    salida = carpeta / "audio"
    salida.mkdir(exist_ok=True)
    m = reverb(musica(), 2.8, 0.3)
    e = reverb(efectos(), 1.6, 0.18)

    voz = np.zeros((2, N))
    hay_voz = False
    if ARGS.voz:
        import subprocess
        crudo = subprocess.run(["ffmpeg", "-v", "error", "-i", str(carpeta / ARGS.voz), "-ac", "1", "-ar", str(SR), "-f", "f64le", "-"], capture_output=True, check=True).stdout
        v = np.frombuffer(crudo, dtype=np.float64)
        activo = np.abs(v) > 0.02
        rms_activo = np.sqrt(np.mean(v[activo] ** 2)) if activo.any() else 0.1
        v = v * (0.11 / max(rms_activo, 1e-6))
        pegar(voz, v / 1.414, float(tiempos.get("desfaseVoz", 0.0)), 1.0)
        hay_voz = True
    else:
        # Locución por frases (opcional): voz/e1-1.wav, voz/e2-1.wav, ...
        guion = json.loads((carpeta / "guion.json").read_text())
        for esc in tiempos["escenas"]:
            g = next((x for x in guion["escenas"] if x["id"] == esc["id"]), None)
            if not g:
                continue
            for k, frase in enumerate(g["narracion"]):
                p = carpeta / "voz" / f"{esc['id']}-{k + 1}.wav"
                if p.exists():
                    pegar(voz, leer_wav(p), esc["inicio"] + frase["inicio"], 1.0)
                    hay_voz = True

    # Ducking: la música y los efectos bajan según la energía real de la voz.
    ducking = np.ones(N)
    ducking_fx = np.ones(N)
    if hay_voz:
        ventana = int(0.05 * SR)
        energia = np.convolve(np.abs(voz[0]) + np.abs(voz[1]), np.ones(ventana) / ventana, mode="same")
        energia = np.clip(energia / (np.percentile(energia[energia > 1e-4], 90) + 1e-9), 0, 1)
        suave = int(0.35 * SR)
        energia = np.convolve(energia, np.ones(suave) / suave, mode="same")
        energia = np.clip(energia * 1.6, 0, 1)
        ducking = 1 - 0.86 * energia
        ducking_fx = 1 - 0.7 * energia

    def rms(x):
        return np.sqrt(np.mean(x**2)) + 1e-9

    m = m * (float(sonido.get("rms_musica", 0.045)) / rms(m))
    e = e * (0.02 / rms(e))
    mezcla = m * ducking + e * ducking_fx + voz
    escribir_wav(salida / "musica.wav", normalizar(m, 0.7))
    escribir_wav(salida / "efectos.wav", normalizar(e, 0.7))
    escala = 0.89 / (np.abs(mezcla).max() + 1e-9)
    escribir_wav(salida / ARGS.salida, mezcla * escala)
    if hay_voz:
        # Pistas por separado (misma escala) para medir la relación voz/fondo.
        escribir_wav(salida / ARGS.salida.replace(".wav", "-voz.wav"), voz * escala)
        escribir_wav(salida / ARGS.salida.replace(".wav", "-fondo.wav"), (m * ducking + e * ducking_fx) * escala)
    print(f"Audio generado en {salida} · {DUR} s · locución: {'sí' if hay_voz else 'no (pendiente)'}")


if __name__ == "__main__":
    main()
