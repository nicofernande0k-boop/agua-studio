#!/usr/bin/env python3
"""
Especial 17 de noviembre — arma el montaje sobre el audio aportado (voz + música, sin tocar).

- Recorta el audio antes de la cola musical y de la placa de TikTok, con fundido, y lo normaliza a −14 LUFS.
- Detecta los cortes del video aportado y extrae cada toma en vertical (sin la marca de agua) o en encuadre completo.
- Ajusta cada corte al ataque musical más cercano (±0,15 s).
- Fotos de archivo: «fotos vivas» con paralaje por profundidad (scripts del episodio anterior).
- Escribe montaje.json para src/esp/Especial17N.tsx.

Uso: montar17n.py <prod> <audio.mp3> <video.mp4> <palabras.json> <py_depth> <dir_depth>
"""
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
import numpy as np

prod, AUD, VID, PALS, PY, DEP = sys.argv[1:7]
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUB = os.path.join(RAIZ, "public")
CLIPS = os.path.join(PUB, "esp", "clips")
FOTOS = os.path.join(PUB, "mil", "fotos")
os.makedirs(CLIPS, exist_ok=True)
os.makedirs(os.path.join(PUB, "esp", "audio"), exist_ok=True)
FPS, W, H = 30, 1080, 1920
P = json.load(open(os.path.join(prod, "plan.json")))
FIN = P["fin_audio"]
FRAMES = int(round(FIN * FPS))


def run(c):
    return subprocess.run(c, capture_output=True, text=True, check=True)


# ── Audio: recorte, fundido, −14 LUFS ─────────────────────────────────
wav = os.path.join(PUB, "esp", "audio", "especial.wav")
fo = P["fundido_audio"]
base = f"atrim=0:{FIN},afade=t=out:st={FIN - fo}:d={fo}"
m = run(["ffmpeg", "-nostdin", "-hide_banner", "-i", AUD, "-af", base + ",ebur128=framelog=quiet", "-f", "null", "-"]).stderr
lufs = float(m.split("I:")[-1].split("LUFS")[0])
g = -14.0 - lufs
run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", AUD, "-af", f"{base},volume={g:.2f}dB,alimiter=limit=0.95:level=false", "-ar", "48000", "-ac", "2", wav])
print(f"audio {FIN:.1f}s · {lufs:.1f} LUFS → −14 ({g:+.1f} dB)")

# ── Ataques musicales para ajustar los cortes ─────────────────────────
a = np.frombuffer(subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", AUD, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout, np.float32)
hop, n = 256, 1024
fr = np.lib.stride_tricks.sliding_window_view(a, n)[::hop] * np.hanning(n)
S = np.log1p(np.abs(np.fft.rfft(fr, axis=1)) * 10)
flux = np.r_[0, np.maximum(0, np.diff(S, axis=0)).sum(1)]
ffps = 16000 / hop


def ajustar(t):
    i0, i1 = int((t - 0.15) * ffps), int((t + 0.15) * ffps)
    if t < 0.5 or i0 < 0:
        return t
    seg = flux[i0:i1]
    j = int(np.argmax(seg))
    return (i0 + j) / ffps if seg[j] > np.percentile(flux, 85) else t


# ── Tomas del video aportado ──────────────────────────────────────────
out = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", VID, "-vf", "scale=256:-1,select='gt(scene,0.25)',metadata=print", "-an", "-f", "null", "-"], capture_output=True, text=True).stderr
cortes = [0.0] + [float(x.split("pts_time:")[1].split()[0]) for x in out.splitlines() if "pts_time:" in x] + [196.6]
s = []
for x in cortes:
    if not s or x - s[-1] >= 0.5:
        s.append(x)
TOMAS_V = [(x, y) for x, y in zip(s, s[1:]) if y - x >= 0.7]

plan = P["tomas"]
t0s = [ajustar(t[0]) for t in plan]
t0s[0] = 0.0
trab_v, trab_f, salida, usadas = [], [], [], set()
for j, (t, fuente, o) in enumerate(plan):
    assert fuente not in usadas, f"repetida: {fuente}"
    usadas.add(fuente)
    ini = t0s[j]
    fin = t0s[j + 1] if j + 1 < len(plan) else FIN
    fd = o.get("fundido", 0) / FPS
    dur = fin - ini + fd + 0.2
    cid = f"e{j:02d}"
    reg = {"id": cid, "desde": round(ini * FPS), "hasta": round(fin * FPS), "fuente": fuente}
    for c in ("ep", "lluvia", "fundido", "grande"):
        if c in o:
            reg[{"ep": "epigrafe"}.get(c, c)] = o[c]
    if "grande_desde" in o:
        reg["grande_desde"] = round(o["grande_desde"] * FPS)
    if fuente.startswith("v:"):
        a0, a1 = TOMAS_V[int(fuente[2:])]
        trab_v.append((cid, a0 + 0.07, a1 - 0.07, dur, o.get("x", 0.5), o.get("marco", False)))
        reg.update(tipo="doc" if o.get("marco") else "video", ancho=896, alto=576)
    else:
        nombre = fuente[2:]
        trab_f.append((cid, nombre, dur, o.get("r", [0.5, 0.5, 1.0]), o.get("doc", False)))
        reg["tipo"] = "doc" if o.get("doc") else "foto"
    reg["clip"] = f"esp/clips/{cid}.mp4"
    salida.append(reg)


def hacer_v(x):
    cid, a0, a1, dur, cx, marco = x
    L = a1 - a0
    sp = min(1.0, L / dur)
    if marco:
        geo = "crop=896:576:12:0,scale=1080:694:flags=lanczos"
    else:
        x0 = int(min(max(cx * 1024 - 162, 0), 1024 - 324 - 250))  # lejos de la marca de agua (abajo a la derecha)
        x0 = max(0, x0)
        geo = f"crop=324:576:{x0}:0,scale=1080:1920:flags=lanczos,unsharp=5:5:0.6"
    if sp < 0.999:
        ini = a0
        tempo = f"setpts=PTS/{max(sp, 0.42):.4f},minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1,"
    else:
        ini = a0 + (L - dur) * 0.3
        tempo = "fps=30,"
    vf = f"{tempo}{geo},tpad=stop_mode=clone:stop_duration={dur:.2f},eq=contrast=1.04:saturation=1.03"
    r = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{ini:.3f}", "-t", f"{L:.3f}", "-i", VID, "-vf", vf, "-t", f"{dur:.2f}", "-an",
                        "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", os.path.join(CLIPS, cid + ".mp4")], capture_output=True, text=True)
    return f"{cid} v {sp:.2f}x {r.stderr[-120:]}"


def hacer_f(x):
    cid, nombre, dur, (cx, cy, hr), doc = x
    from PIL import Image
    dep = os.path.join(DEP, "depth", os.path.splitext(nombre)[0] + ".png")
    if doc:
        w, h = Image.open(os.path.join(FOTOS, nombre)).size
        ww = int(W * 0.9) // 2 * 2; hh = int(ww * h / w) // 2 * 2
        dims, rec = (ww, hh), (0.5, 0.5, 1.0)
    else:
        dims, rec = (W, H), (cx, cy, hr)
    mov = (1.03, 1.12, 0.0, 0.0, 0.05)
    r = subprocess.run([PY, os.path.join(DEP, "paralaje.py"), os.path.join(FOTOS, nombre), dep, os.path.join(CLIPS, cid + ".mp4"), f"{dur:.2f}",
                        str(dims[0]), str(dims[1]), *map(str, rec), *map(str, mov)], capture_output=True, text=True)
    return f"{cid} f {nombre} {r.stderr[-120:]}", dims


faltan = sorted({x[1] for x in trab_f if not os.path.exists(os.path.join(DEP, "depth", os.path.splitext(x[1])[0] + ".png"))})
if faltan:
    subprocess.run([PY, os.path.join(DEP, "profundidad.py"), os.path.join(DEP, "depth")] + [os.path.join(FOTOS, n) for n in faltan], check=True)
with ThreadPoolExecutor(4) as ex:
    for r in ex.map(hacer_f, trab_f):
        print(r[0].strip(), flush=True)
with ThreadPoolExecutor(6) as ex:
    for r in ex.map(hacer_v, trab_v):
        print(r.strip(), flush=True)

# Proporciones de las fotos «documento»
from PIL import Image
for reg in salida:
    if reg["tipo"] == "doc" and reg["fuente"].startswith("f:"):
        w, h = Image.open(os.path.join(FOTOS, reg["fuente"][2:])).size
        reg["ancho"], reg["alto"] = w, h

# ── Subtítulos ────────────────────────────────────────────────────────
json.dump({"fps": FPS, "frames": FRAMES, "placa": round(P["placa"] * FPS), "tomas": salida}, open(os.path.join(prod, "montaje.json"), "w"), ensure_ascii=False, indent=1)
print("tomas:", len(salida), "· cuadros:", FRAMES)
