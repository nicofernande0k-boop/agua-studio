#!/usr/bin/env python3
"""004 v4 — biblioteca de tomas (1920×1080, 30 fps, color cálido), 7 s cada una, generadas en paralelo.
Uso: biblioteca.py <video_recorrido> <salida> <py_depth> <dir_depth>"""
import os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
VID, OUT, PY, DEP = sys.argv[1:5]
PD4 = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "public", "pd4")
os.makedirs(OUT, exist_ok=True)
W, H, L = 1920, 1080, 7.0
COLOR = "eq=contrast=1.07:saturation=1.16:gamma=0.96,colorbalance=rs=0.06:gs=0.02:bs=-0.07:rm=0.05:bm=-0.05:rh=0.04:bh=-0.06,curves=all='0/0.025 0.5/0.52 1/0.96'"
ARCHIVO = "format=gray,format=yuv420p,colorchannelmixer=.97:0:0:0:.87:0:0:0:.72:0:0:0,eq=contrast=1.06,unsharp=5:5:0.4"
# recorrido: segundo de inicio, velocidad (lento = cinematográfico)
V = [30, 100, 121, 201, 256, 286, 321, 441, 470, 581, 660, 780, 820, 900, 1020, 1102, 1180, 1300, 488, 346, 622, 924, 144, 1003, 1258, 61, 1078, 182, 699, 236, 1200, 242, 757, 862, 530, 961, 1041, 636, 150, 2, 1121, 402, 562, 801, 1162, 982, 700]
F = ["C02", "C03", "C19", "C14", "C16", "C17", "C04", "C07", "C15", "C05", "C01", "C10", "C18", "C20", "C11", "C12", "IMG_5818", "C09", "C08", "C06"]
Hh = ["IMG_5811", "IMG_5812", "IMG_5813", "IMG_5814", "IMG_5815", "IMG_5816", "IMG_5817", "IMG_5819", "IMG_5820"]


def run(c):
    r = subprocess.run(c, capture_output=True, text=True)
    return r.stderr[-200:] if r.returncode else ""


def video(s):
    o = os.path.join(OUT, f"v{s}.mp4")
    if os.path.exists(o): return o
    vel = 0.72
    e = run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", str(s), "-t", f"{L * vel + 0.3:.2f}", "-i", VID, "-vf",
             f"setpts=PTS/{vel},framerate=fps=30:interp_start=0:interp_end=255,scale={W}:{H}:flags=lanczos,{COLOR}",
             "-t", str(L), "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "13", "-pix_fmt", "yuv420p", o])
    return o + " " + e


def foto(n, hist):
    o = os.path.join(OUT, f"{n}.mp4")
    if os.path.exists(o): return o
    img = os.path.join(PD4, n + ".jpg")
    dep = os.path.join(DEP, "depth", n + ".png")
    if not os.path.exists(dep):
        run([PY, os.path.join(DEP, "profundidad.py"), os.path.join(DEP, "depth"), img])
    crudo = o.replace(".mp4", "_p.mp4")
    i = abs(hash(n)) % 4
    z = [(1.0, 1.09), (1.09, 1.0), (1.02, 1.1), (1.1, 1.03)][i]
    dx = [0.03, -0.03, 0.0, 0.02][i]
    e = run([PY, os.path.join(DEP, "paralaje.py"), img, dep, crudo, str(L), str(W), str(H), "0.5", "0.5", "1.0", str(z[0]), str(z[1]), str(dx), "0.0", "0.06"])
    e += run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", crudo, "-vf", ARCHIVO if hist else COLOR, "-c:v", "libx264", "-preset", "veryfast", "-crf", "13", "-pix_fmt", "yuv420p", o])
    if os.path.exists(crudo): os.remove(crudo)
    return o + " " + e


tareas = [(video, (s,)) for s in V] + [(foto, (n, False)) for n in F] + [(foto, (n, True)) for n in Hh]
with ThreadPoolExecutor(6) as ex:
    for r in ex.map(lambda t: t[0](*t[1]), tareas):
        print(r.strip(), flush=True)
print("biblioteca lista")
