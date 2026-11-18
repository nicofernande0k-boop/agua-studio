#!/usr/bin/env python3
"""
PATRIA EN DISPUTA 004 v4 — «GUAMINÍ. Hay lugares de los que nunca nos vamos.»
Película horizontal 16:9 (1920×1080) armada sobre la narración y la grilla de «BAILE INoLVIDABLE» (90 BPM),
que corre entera desde el segundo 0 (así coincide si se agrega la canción desde la plataforma).

Uso: montaje.py <narracion.mp3> <frases.json> <biblioteca> <cancion.wav> <trabajo> <salida_con_cancion> <salida_sin_cancion>
frases.json: [{"inicio": s, "fin": s, "texto": "..."}] en tiempos de la narración.
"""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

VOZ, FRA, BIB, CAN, TR, OUT_C, OUT_S = sys.argv[1:8]
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.makedirs(os.path.join(TR, "txt"), exist_ok=True)
W, H, FPS = 1920, 1080, 30
TIEMPO, FASE = 0.6665, 0.59
BAR = 4 * TIEMPO
beat = lambda t: FASE + round((t - FASE) / TIEMPO) * TIEMPO
OFF = FASE + 3 * BAR + 0.75           # la voz entra después de la apertura (piano, archivo, título)
EXPLOSION = 85.9                      # entra la salsa


def run(c):
    r = subprocess.run(c, capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(r.stderr[-800:])
    return r


frases = json.load(open(FRA))
vlen = float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", VOZ]).stdout)
fin_voz = OFF + frases[-1]["fin"]
FINAL = beat(fin_voz + 10.0)          # ~10 s de música sola y montaje épico
DUR = FINAL + 8.0                     # atardecer sobre el lago + texto de cierre
print(f"voz {vlen:.1f}s · termina en {fin_voz:.1f} · final {FINAL:.1f} · duración {DUR:.1f}")

# ── Cinco movimientos: límites en tiempo de película ───────────────────
tot = frases[-1]["fin"]
cuotas = [0.22, 0.18, 0.22, 0.22, 0.16]
lim, acc = [], 0
if os.environ.get("LIMITES"):          # frases donde empieza cada movimiento (según el contenido del texto)
    lim = [beat(OFF + frases[int(i)]["inicio"] - 0.3) for i in os.environ["LIMITES"].split(",")]
else:
  for c in cuotas[:-1]:
    acc += c
    obj = acc * tot
    f = min(frases, key=lambda x: abs(x["inicio"] - obj))   # el límite cae en el comienzo de una frase
    lim.append(beat(OFF + f["inicio"] - 0.3))
# la Alegría arranca con la salsa: si hace falta, la canción saltea compases enteros
# (en un tiempo fuerte, bajo la narración) para que la explosión caiga justo ahí.
SALTO, PUNTO = 0.0, 0.0
if lim[0] < EXPLOSION - BAR:
    n = round((EXPLOSION - lim[0]) / BAR)
    SALTO = n * BAR
    lim[0] = EXPLOSION - SALTO
    PUNTO = FASE + 4 * BAR             # salto a los ~11 s de la canción (bajo la voz)
elif lim[0] < EXPLOSION + 25:
    lim[0] = EXPLOSION
print(f"salto de la canción: {SALTO:.2f}s en {PUNTO:.2f}s · alegría en {lim[0]:.1f}")
MOV = [(OFF, lim[0]), (lim[0], lim[1]), (lim[1], lim[2]), (lim[2], lim[3]), (lim[3], FINAL)]
print("movimientos", [(round(a, 1), round(b, 1)) for a, b in MOV])

# ── Repertorio por movimiento (sin repetir) ────────────────────────────
# h = archivo histórico; par = (antes, ahora) con fundido largo
APERTURA = [("IMG_5812", 0.0), ("v488", FASE + BAR)]
POOL = [
    ["IMG_5815", "IMG_5811", ("IMG_5819", "v346"), "IMG_5813", "IMG_5814", "IMG_5816", ("IMG_5820", "C10"), "IMG_5817", "v1078", "v1258", "C04"],
    ["C16", "C17", "C14", "v924", "C19", "v622", "C03", "C07", "v144", "v530", "v150", "v30", "v100"],
    ["C05", "v61", "C15", "v1003", "v182", "C01", "v699", "v2", "v1121", "v402"],
    ["C18", "C20", "v236", "C11", "v1200", "C12", "v242", "IMG_5818", "v121", "C09", "v201", "v562", "v256", "v286", "v757", "v780", "v862", "v660", "v820"],
    ["C08", "v961", "v1041", "v801", "v1162", "v982", "v700", "v321", "v441", "v470", "v581", "v900", "v1020", "v1102", "v1180", "v1300"],
]
usados = {x for p in POOL for y in p for x in (y if isinstance(y, tuple) else (y,))} | {"IMG_5812", "v488", "v636", "C02"}
sobrantes = sorted(os.path.splitext(f)[0] for f in os.listdir(BIB) if f.endswith(".mp4") and os.path.splitext(f)[0] not in usados)
POOL[4] += [x for x in sobrantes if x.startswith("v")] + [x for x in sobrantes if not x.startswith("v") and not x.startswith("IMG")]
print("sobrantes al final:", sobrantes)
LARGO = [2.0, 1.0, 1.0, 1.5, 0.5]     # compases por toma
FUNDIDO = [0.9, 0.0, 0.25, 0.2, 0.0]
CIERRE = [("v636", FINAL - 2 * BAR), ("C02", FINAL)]

tomas = [(APERTURA[0][0], 0.0, 1.4), (APERTURA[1][0], APERTURA[1][1], 1.4)]
for m, (a, b) in enumerate(MOV):
    if m == 4:
        b = FINAL - 2 * BAR
    pool = list(POOL[m])
    t, k = a, 0
    while t < b - 0.6:
        largo = LARGO[m] * BAR
        if m == 1 and t >= EXPLOSION - SALTO:
            largo = 0.5 * BAR if t < EXPLOSION - SALTO + 4 * BAR else BAR
        if m == 4:
            largo = max(0.5 * BAR, BAR * (1 - k / 12))
        item = pool.pop(0) if pool else None
        if item is None:
            break
        if isinstance(item, tuple):
            tomas.append((item[0], t, FUNDIDO[m] or 0.8)); t += BAR * 1.0
            tomas.append((item[1], t, 1.3)); t += BAR * 1.5
        else:
            tomas.append((item, t, FUNDIDO[m] if k else 0.7)); t += largo
        k += 1
    if t < b - 0.6:  # si faltan tomas, se estira la última
        pass
tomas.append((CIERRE[0][0], CIERRE[0][1], 0.6))
tomas.append((CIERRE[1][0], CIERRE[1][1], 1.6))
# limpiar: los inicios deben crecer
lim_t = []
for n, ini, fd in tomas:
    if lim_t and ini <= lim_t[-1][1] + 0.4:
        continue
    lim_t.append((n, ini, fd))
tomas = lim_t
nombres = [n for n, _, _ in tomas]
assert len(nombres) == len(set(nombres)), "toma repetida"
print("tomas", len(tomas))

# ── Textos ─────────────────────────────────────────────────────────────
NM = os.path.join(RAIZ, "node_modules", "@fontsource")
SERIF = os.path.join(NM, "fraunces", "files", "fraunces-latin-400-italic.woff")
ANTON = os.path.join(NM, "anton", "files", "anton-latin-400-normal.woff")
INTER = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
INTER_L = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"
CREMA = (242, 234, 218)


def png(nombre, lineas, sombra=18):
    im = Image.new("RGBA", (W, H)); so = Image.new("RGBA", (W, H))
    dt, ds = ImageDraw.Draw(im), ImageDraw.Draw(so)
    for tx, fu, tam, y, col, esp in lineas:
        f = ImageFont.truetype(fu, tam)
        anchos = [dt.textlength(ch, font=f) for ch in tx]
        total = sum(anchos) + esp * (len(tx) - 1)
        x = (W - total) / 2
        for ch, a in zip(tx, anchos):
            ds.text((x, y + 4), ch, font=f, fill=(0, 0, 0, 190)); dt.text((x, y), ch, font=f, fill=col)
            x += a + esp
    im = Image.alpha_composite(so.filter(ImageFilter.GaussianBlur(sombra)), im)
    x0, y0, x1, y1 = im.getbbox(); x0 -= x0 % 2; y0 -= y0 % 2
    x1 += (x1 - x0) % 2; y1 += (y1 - y0) % 2
    p = os.path.join(TR, "txt", nombre); im.crop((x0, y0, x1, y1)).save(p)
    return p, x0, y0


capas = []
# Título de apertura, elegante, sobre la laguna
t_tit = FASE + BAR + 0.6
capas.append((png("titulo.png", [("GUAMINÍ", ANTON, 190, 400, CREMA + (255,), 34)]), t_tit, OFF - 0.3, 1.2))
capas.append((png("titulo2.png", [("Hay lugares de los que nunca nos vamos.", SERIF, 50, 640, CREMA + (235,), 0)]), t_tit + 1.4, OFF - 0.3, 1.0))
# Subtítulos de la narración (discretos)
for i, fr in enumerate(frases):
    tx = fr["texto"].strip()
    f = ImageFont.truetype(INTER_L, 40)
    pal, lin, cur = tx.split(), [], ""
    for p_ in pal:
        if f.getlength((cur + " " + p_).strip()) > 1300:
            lin.append(cur); cur = p_
        else:
            cur = (cur + " " + p_).strip()
    lin.append(cur)
    y0 = 930 - 54 * (len(lin) - 1)
    a, b = OFF + fr["inicio"] - 0.05, OFF + fr["fin"] + 0.35
    if i + 1 < len(frases):
        b = min(b, OFF + frases[i + 1]["inicio"] - 0.05)
    capas.append((png(f"s{i:02d}.png", [(l, INTER_L, 40, y0 + 54 * n, CREMA + (255,), 0) for n, l in enumerate(lin)], sombra=10), a, b, 0.15))
# Cierre
c0 = FINAL + 1.6
capas.append((png("c1.png", [("GUAMINÍ", ANTON, 170, 330, CREMA + (255,), 30)]), c0, DUR, 1.2))
capas.append((png("c2.png", [("1876 — 2026", INTER, 46, 560, CREMA + (255,), 8)]), c0 + 0.9, DUR, 1.0))
capas.append((png("c3.png", [("150 AÑOS DE HISTORIA", INTER, 34, 640, (212, 22, 44, 255), 10)]), c0 + 1.6, DUR, 1.0))
capas.append((png("c4.png", [("Hay lugares de los que nunca nos vamos.", SERIF, 58, 740, CREMA + (255,), 0)]), c0 + 2.6, DUR, 1.2))
capas.append((png("c5.png", [("PATRIA EN DISPUTA", INTER, 22, 1000, CREMA + (190,), 7)], sombra=6), c0 + 4.0, DUR, 1.0))

# ── Video: cadena de fundidos sobre la biblioteca ──────────────────────
ins, fc = [], []
for j, (n, ini, fd) in enumerate(tomas):
    fin = tomas[j + 1][1] if j + 1 < len(tomas) else DUR
    d_sig = max(tomas[j + 1][2], 1 / FPS) if j + 1 < len(tomas) else 0
    largo = fin - ini + max(fd, 1 / FPS) + d_sig + 0.08
    src = os.path.join(BIB, n + ".mp4")
    lento = largo > 6.9
    ins += ["-i", src]
    vf = f"[{j}:v]trim=0:{min(largo, 6.95):.3f},setpts=PTS-STARTPTS"
    if lento:
        vf += f",setpts=PTS*{largo / 6.9:.4f},fps=30"
    fc.append(vf + f",fps=30,settb=1/30,format=yuv420p[t{j}]")
prev = "t0"
for j in range(1, len(tomas)):
    d = max(tomas[j][2], 1 / FPS)
    fc.append(f"[{prev}][t{j}]xfade=transition=fade:duration={d:.3f}:offset={tomas[j][1] - d:.3f}[x{j}]")
    prev = f"x{j}"
fc.append(f"[{prev}]trim=0:{DUR:.3f},vignette=PI/5.5,fade=t=in:d=1.2,fade=t=out:st={DUR - 2.0:.2f}:d=2.0[base]")
# Al final, el atardecer se oscurece un poco para el texto
prev = "base"
n0 = len(tomas)
for i, ((p, x, y), a, b, f) in enumerate(capas):
    ins += ["-loop", "1", "-framerate", str(FPS), "-t", f"{b - a:.3f}", "-i", p]
    k = n0 + i
    fc.append(f"[{k}:v]format=rgba,fade=t=in:d={f}:alpha=1,fade=t=out:st={max(0, b - a - min(f, 0.6)):.3f}:d={min(f, 0.6)}:alpha=1,setpts=PTS+{a:.3f}/TB[c{i}]")
    fc.append(f"[{prev}][c{i}]overlay={x}:{y}:eof_action=pass[o{i}]")
    prev = f"o{i}"
video = os.path.join(TR, "video.mp4")
run(["ffmpeg", "-nostdin", "-v", "error", "-y", *ins, "-filter_complex", ";".join(fc), "-map", f"[{prev}]", "-t", f"{DUR:.3f}",
     "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-maxrate", "3500k", "-bufsize", "7000k", "-pix_fmt", "yuv420p", "-movflags", "+faststart", video])
print("video listo", flush=True)

# ── Audio ──────────────────────────────────────────────────────────────
ms = int(OFF * 1000)
if SALTO:
    cancion = (f"[1:a]asplit[ca][cb];[ca]atrim=0:{PUNTO + 0.06:.3f},asetpts=PTS-STARTPTS[pa];[cb]atrim={PUNTO + SALTO - 0.06:.3f},asetpts=PTS-STARTPTS[pb];"
               f"[pa][pb]acrossfade=d=0.12,atrim=0:{DUR:.3f},volume=0.5,afade=t=in:d=0.4,afade=t=out:st={DUR - 5:.2f}:d=5")
else:
    cancion = f"[1:a]atrim=0:{DUR:.3f},volume=0.5,afade=t=in:d=0.4,afade=t=out:st={DUR - 5:.2f}:d=5"
voz = f"[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,highpass=f=70,acompressor=threshold=0.1:ratio=2.5:attack=10:release=200,adelay={ms}|{ms},apad=whole_dur={DUR:.3f}"
run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", VOZ, "-i", CAN, "-filter_complex",
     f"{voz},asplit[v1][sc];{cancion}[m];"
     f"[m][sc]sidechaincompress=threshold=0.012:ratio=14:attack=40:release=650:makeup=1[md];[v1][md]amix=inputs=2:normalize=0:duration=longest,"
     f"atrim=0:{DUR:.3f},loudnorm=I=-14:TP=-1.0:LRA=11[o]", "-map", "[o]", "-ar", "48000", os.path.join(TR, "mezcla.wav")])
run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", VOZ, "-filter_complex", f"{voz},atrim=0:{DUR:.3f},loudnorm=I=-16:TP=-1.0[o]", "-map", "[o]", "-ar", "48000",
     os.path.join(TR, "voz.wav")])
for out, a in ((OUT_C, "mezcla.wav"), (OUT_S, "voz.wav")):
    run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", video, "-i", os.path.join(TR, a), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
         "-shortest", "-movflags", "+faststart", out])
json.dump({"SALTO": SALTO, "PUNTO": PUNTO, "OFF": OFF, "DUR": DUR, "movimientos": MOV, "tomas": tomas}, open(os.path.join(TR, "montaje.json"), "w"), indent=1)
print("listo", OUT_C, OUT_S)
