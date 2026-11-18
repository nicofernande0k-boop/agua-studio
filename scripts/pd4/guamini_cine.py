#!/usr/bin/env python3
"""
PATRIA EN DISPUTA 004 — «Guaminí: donde siempre volvemos». Cortometraje horizontal 16:9, 4K.

Material: recorrido real por Guaminí (video aportado, 22 min), 9 fotografías históricas + 1 aérea actual
(aportadas), fotos actuales de la web (public/pd4/C*.jpg) y «BAILE INoLVIDABLE» como guía rítmica.
Todo se corta sobre la grilla de compases de la canción (90 BPM, compás = 2,666 s).

Etapas (FFmpeg, en paralelo): tomas a 1920×1080 → máster con fundidos → 4K con textos, grano y color.
Uso: guamini_cine.py <video_fuente> <cancion.wav> <trabajo> <py_depth> <dir_depth> <salida_con_musica> <salida_sin_musica>
"""
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageDraw, ImageFilter, ImageFont

VID, CAN, TR, PY, DEP, OUT_M, OUT_S = sys.argv[1:8]
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PD4 = os.path.join(RAIZ, "public", "pd4")
os.makedirs(os.path.join(TR, "tomas"), exist_ok=True)
os.makedirs(os.path.join(TR, "textos"), exist_ok=True)
FPS, W, H = 30, 1920, 1080
FASE, COMPAS = 0.59, 2.666            # primer tiempo fuerte y duración del compás (90 BPM)
CORTE_A, SALTO = 85.9, 42.65          # la canción salta 16 compases en 85,9 s (de 85,9 a 128,55)
FIN_CANCION = 209.0                   # cae en el silencio de la canción (203 s): ahí va el cierre
DUR = FIN_CANCION - SALTO             # 166,35 s
D = lambda k: 0.0 if k == 0 else FASE + COMPAS * k

GRADO_COLOR = "eq=contrast=1.06:saturation=1.1:gamma=0.97,colorbalance=rs=0.05:gs=0.01:bs=-0.06:rm=0.04:gm=0.0:bm=-0.04:rh=0.03:bh=-0.05,curves=all='0/0.03 0.5/0.52 1/0.97'"
GRADO_ARCHIVO = "format=gray,format=yuv420p,colorchannelmixer=.95:0:0:0:.86:0:0:0:.72:0:0:0,eq=contrast=1.05"

# ── Plan: (compás de inicio, fuente, opciones) ─────────────────────────
# v:SEG = segundo del recorrido · f:archivo = foto · h:archivo = foto histórica (blanco y negro cálido)
# disolver = fundido desde la toma anterior (antes → ahora) · lento = velocidad
PLAN = [
    (0, "v:488", {"lento": 0.6}),
    (1, "f:C02.jpg", {}),
    (3, "v:2", {}),
    (4, "v:61", {}),
    (5, "f:C03.jpg", {}),
    (6, "v:144", {}),
    (7, "f:C05.jpg", {}),
    (8, "v:182", {}),
    (9, "h:IMG_5815.jpg", {"disolver": 0.5}),
    (10, "f:IMG_5818.jpg", {"disolver": 0.4, "r": [0.5, 0.45, 0.9]}),
    (11, "h:IMG_5812.jpg", {"disolver": 0.3}),
    (12, "v:1078", {"disolver": 1.0}),
    (13, "h:IMG_5819.jpg", {}),
    (14, "v:346", {"disolver": 1.0}),
    (15, "h:IMG_5820.jpg", {"disolver": 0.4}),
    (16, "f:C10.jpg", {"disolver": 0.8}),
    (17, "h:IMG_5813.jpg", {}),
    (18, "h:IMG_5814.jpg", {}),
    (19, "h:IMG_5816.jpg", {}),
    (20, "v:242", {"disolver": 1.0}),
    (21, "h:IMG_5811.jpg", {}),
    (22, "v:150", {"disolver": 1.0}),
    (23, "h:IMG_5817.jpg", {}),
    (24, "f:C16.jpg", {"disolver": 0.4}),
    (25, "f:C15.jpg", {}),
    (26, "v:1003", {}),
    (27, "f:C14.jpg", {}),
    (28, "f:C17.jpg", {}),
    (29, "v:1121", {}),
    (30, "f:C04.jpg", {"disolver": 0.6}),
    (32, "v:622", {}),
    (33, "v:699", {}),
    (34, "v:757", {}),
    (35, "f:C06.jpg", {"disolver": 0.5}),
    (36, "v:924", {}),
    (37, "v:530", {"lento": 0.8}),
    (38, "f:C19.jpg", {}),
    (39, "v:862", {}),
    (40, "f:C01.jpg", {}),
    (41, "v:236", {}),
    (42, "v:1012", {}),
    (43, "f:C18.jpg", {}),
    (44, "v:1200", {}),
    (45, "v:1258", {}),
    (46, "f:C20.jpg", {}),
    (47, "v:1300", {}),
    (48, "v:1102", {}),
    (49.0, "v:31", {}), (49.5, "v:100", {}), (50.0, "v:121", {}), (50.5, "v:201", {}),
    (51.0, "v:256", {}), (51.5, "v:286", {}), (52.0, "f:C07.jpg", {}), (52.5, "v:321", {}),
    (53.0, "v:402", {}), (53.5, "v:441", {}), (54.0, "v:562", {}), (54.5, "v:581", {}),
    (55.0, "v:641", {}), (55.5, "v:801", {}), (56.0, "v:961", {}), (56.5, "v:1041", {}),
    (57, "v:1162", {}),
    (58, "f:C09.jpg", {}),
    (59, "v:982", {}),
    (60, "v:636", {"lento": 0.5, "disolver": 0.6}),
]

# ── Textos: (compás desde, compás hasta, texto) ───────────────────────
TEXTOS = [
    (0.15, 1.0, "Hay lugares que no se explican."),
    (1.25, 2.9, "Se llevan adentro."),
    (3.1, 5.0, "Hay un lugar donde el almacenero sabe tu nombre."),
    (5.1, 7.0, "Donde la vereda es una excusa para quedarse charlando."),
    (7.1, 9.95, "Donde cada esquina guarda el apellido de alguien."),
    (11.1, 12.95, "Nuestros abuelos levantaron la iglesia ladrillo por ladrillo."),
    (13.1, 14.95, "Soñaron un palacio que todavía mira al futuro."),
    (15.1, 16.95, "Y alrededor, una plaza para encontrarnos."),
    (17.1, 18.95, "Las calles de tierra se hicieron asfalto, a pala y hormigonera."),
    (19.1, 20.95, "Muchos nombres no están en ningún libro. Están en cada vereda."),
    (21.1, 22.95, "Acá todos saben quién sos. Y eso, a veces, es lo que te salva."),
    (23.1, 24.95, "Porque cuando a uno le pasa algo, nos pasa a todos."),
    (25.1, 25.95, "La escuela pública donde aprendimos a leer."),
    (26.1, 26.95, "Los que trabajan desde que sale el sol."),
    (27.1, 28.95, "El club, las fiestas, los domingos con amigos."),
    (29.1, 29.95, "La infancia en bicicleta, hasta que se hacía de noche."),
    (30.2, 31.9, "Y están los que se fueron…"),
    (32.05, 33.95, "a estudiar, a trabajar, lejos."),
    (34.05, 35.95, "Que cada tanto cierran los ojos y vuelven a ver la laguna."),
    (36.05, 37.95, "Porque uno se va del pueblo…"),
    (38.05, 39.9, "…pero el pueblo nunca se va de uno."),
    (40.1, 41.95, "Un pueblo vive cuando tiene escuela, hospital y bomberos."),
    (42.1, 43.95, "Cuando hay trabajo y hay obra pública."),
    (44.1, 45.95, "Cuando el Estado está presente, nadie se queda solo."),
    (46.1, 48.9, "Así se sostiene Guaminí. Y así se sostiene cada pueblo del interior."),
    (49.1, 50.9, "Para que los chicos se puedan quedar."),
    (51.1, 52.9, "Para que los que se fueron puedan volver."),
    (53.1, 55.9, "Porque un pueblo no es un punto en el mapa."),
    (56.1, 59.9, "Es la memoria de los abuelos. Es la mano del vecino. Es casa."),
]


def run(c):
    r = subprocess.run(c, capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(" ".join(c[:6]) + "\n" + r.stderr[-600:])
    return r


# ── 1. Tomas ──────────────────────────────────────────────────────────
tomas = []
for j, (k, fuente, o) in enumerate(PLAN):
    ini = D(k)
    fin = D(PLAN[j + 1][0]) if j + 1 < len(PLAN) else DUR
    dis = o.get("disolver", 0.0)
    tomas.append(dict(j=j, fuente=fuente, o=o, ini=ini, fin=fin, dis=dis))
# sin repetir: fuentes únicas y tramos de video separados por al menos 4 s
vs = sorted(int(t["fuente"][2:]) for t in tomas if t["fuente"].startswith("v:"))
assert len({t["fuente"] for t in tomas}) == len(tomas), "fuente repetida"
assert all(b - a >= 4 for a, b in zip(vs, vs[1:])), f"tramos cercanos: {vs}"


def toma(t):
    j, fuente, o = t["j"], t["fuente"], t["o"]
    sig_dis = tomas[j + 1]["dis"] if j + 1 < len(tomas) else 0
    dur = t["fin"] - t["ini"] + t["dis"] + sig_dis + 0.15
    out = os.path.join(TR, "tomas", f"{j:02d}.mp4")
    if fuente.startswith("v:"):
        s = float(fuente[2:])
        v = o.get("lento", 1.0)
        tempo = f"setpts=PTS/{v},minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc," if v < 1 else "fps=30,"
        vf = f"{tempo}scale={W}:{H}:flags=lanczos,{GRADO_COLOR}"
        run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{s:.2f}", "-t", f"{dur * v + 0.2:.2f}", "-i", VID, "-vf", vf, "-t", f"{dur:.2f}", "-an",
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "12", "-pix_fmt", "yuv420p", out])
    else:
        nombre = fuente[2:]
        img = os.path.join(PD4, nombre)
        base = os.path.splitext(nombre)[0]
        dep = os.path.join(DEP, "depth", base + ".png")
        if not os.path.exists(dep):
            run([PY, os.path.join(DEP, "profundidad.py"), os.path.join(DEP, "depth"), img])
        cx, cy, hr = o.get("r", [0.5, 0.5, 1.0])
        z = (1.02, 1.1) if j % 2 else (1.1, 1.02)
        crudo = out.replace(".mp4", "_p.mp4")
        run([PY, os.path.join(DEP, "paralaje.py"), img, dep, crudo, f"{dur:.2f}", str(W), str(H), str(cx), str(cy), str(hr), str(z[0]), str(z[1]),
             str(0.02 if j % 3 else -0.02), "0.0", "0.05"])
        grado = GRADO_ARCHIVO if fuente.startswith("h:") else GRADO_COLOR
        run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", crudo, "-vf", grado, "-c:v", "libx264", "-preset", "veryfast", "-crf", "12", "-pix_fmt", "yuv420p", out])
        os.remove(crudo)
    return f"{j:02d} {fuente} {dur:.2f}s"


REUSAR = os.environ.get("REUSAR_MASTER") == "1"
if not REUSAR:
  with ThreadPoolExecutor(4) as ex:
    for r in ex.map(toma, tomas):
        print(r, flush=True)

# ── 2. Máster 1080p: cortes secos y fundidos (antes → ahora) ──────────
ins, fc, prev, acum = [], [], "0:v", 0.0
for t in tomas:
    ins += ["-i", os.path.join(TR, "tomas", f"{t['j']:02d}.mp4")]
for t in tomas[1:]:
    j = t["j"]
    d = max(t["dis"], 1 / FPS)
    off = t["ini"] - d
    tr = "fade" if t["dis"] else "fade"
    fc.append(f"[{prev}][{j}:v]xfade=transition={tr}:duration={d:.3f}:offset={off:.3f}[x{j}]")
    prev = f"x{j}"
fc.append(f"[{prev}]trim=0:{DUR:.3f},setpts=PTS-STARTPTS[v]")
master = os.path.join(TR, "master1080.mp4")
if not REUSAR:
  run(["ffmpeg", "-nostdin", "-v", "error", "-y", *ins, "-filter_complex", ";".join(fc), "-map", "[v]",
     "-c:v", "libx264", "-preset", "veryfast", "-crf", "10", "-pix_fmt", "yuv420p", master])
print("máster 1080p listo", flush=True)

# ── 3. Textos (PNG 4K con transparencia) ──────────────────────────────
NM = os.path.join(RAIZ, "node_modules", "@fontsource")
SERIF = os.path.join(NM, "fraunces", "files", "fraunces-latin-400-italic.woff")
ANTON = os.path.join(NM, "anton", "files", "anton-latin-400-normal.woff")
INTER = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
CREMA, ROJO = (239, 230, 212), (212, 22, 44)


def guardar(im, nombre):
    x0, y0, x1, y1 = im.getbbox()
    x0, y0 = x0 // 2 * 2, y0 // 2 * 2
    p = os.path.join(TR, "textos", nombre)
    im.crop((x0, y0, x1 + (x1 - x0) % 2, y1 + (y1 - y0) % 2)).save(p)
    return (p, x0, y0)


def png_texto(i, texto):
    im = Image.new("RGBA", (3840, 2160), (0, 0, 0, 0))
    f = ImageFont.truetype(SERIF, 118)
    d = ImageDraw.Draw(im)
    # partir en dos líneas si hace falta
    pal, lineas, cur = texto.split(), [], ""
    for p in pal:
        if d.textlength((cur + " " + p).strip(), font=f) > 2900:
            lineas.append(cur); cur = p
        else:
            cur = (cur + " " + p).strip()
    lineas.append(cur)
    y = 1780 - (len(lineas) - 1) * 150
    sombra = Image.new("RGBA", im.size, (0, 0, 0, 0)); ds = ImageDraw.Draw(sombra)
    for n, l in enumerate(lineas):
        w = d.textlength(l, font=f)
        ds.text(((3840 - w) / 2, y + n * 150 + 6), l, font=f, fill=(0, 0, 0, 210))
    sombra = sombra.filter(ImageFilter.GaussianBlur(14))
    im = Image.alpha_composite(im, sombra); d = ImageDraw.Draw(im)
    for n, l in enumerate(lineas):
        w = d.textlength(l, font=f)
        d.text(((3840 - w) / 2, y + n * 150), l, font=f, fill=CREMA + (255,))
    return guardar(im, f"t{i:02d}.png")


def png_titulo(nombre, lineas):
    sombra = Image.new("RGBA", (3840, 2160), (0, 0, 0, 0))
    texto = Image.new("RGBA", (3840, 2160), (0, 0, 0, 0))
    ds, dt = ImageDraw.Draw(sombra), ImageDraw.Draw(texto)
    for (tx, fuente, tam, y, c) in lineas:
        f = ImageFont.truetype(fuente, tam)
        x = (3840 - dt.textlength(tx, font=f)) / 2
        ds.text((x, y + 10), tx, font=f, fill=(0, 0, 0, 200))
        dt.text((x, y), tx, font=f, fill=c)
    im = Image.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(24)), texto)
    return guardar(im, nombre)


def png_barra(nombre, y, ancho=260, alto=16):
    im = Image.new("RGBA", (3840, 2160), (0, 0, 0, 0))
    ImageDraw.Draw(im).rectangle([(3840 - ancho) / 2, y, (3840 + ancho) / 2, y + alto], fill=ROJO + (255,))
    return guardar(im, nombre)


capas = []  # (png, desde, hasta, fundido)
for i, (a, b, tx) in enumerate(TEXTOS):
    capas.append((png_texto(i, tx), D(a) if a else 0.4, D(b), 0.35))
t_tit = D(10) + 0.25
capas.append((png_titulo("titulo.png", [("GUAMINÍ", ANTON, 520, 650, CREMA + (255,))]), t_tit, D(11) - 0.1, 0.25))
capas.append((png_barra("barra1.png", 1330), t_tit + 0.3, D(11) - 0.1, 0.25))
t_c = D(60) + 0.3
capas.append((png_titulo("cierre1.png", [("GUAMINÍ", ANTON, 470, 560, CREMA + (255,))]), t_c, DUR, 0.8))
capas.append((png_barra("barra2.png", 1180), t_c + 0.9, DUR, 0.6))
capas.append((png_titulo("cierre2.png", [("donde siempre volvemos", SERIF, 150, 1280, CREMA + (255,))]), t_c + 1.4, DUR, 0.8))
capas.append((png_titulo("cierre3.png", [("PATRIA EN DISPUTA  ·  EPISODIO 004", INTER, 64, 1640, (239, 230, 212, 215))]), t_c + 2.4, DUR, 0.8))

# ── 4. Audio: la canción, con el salto de 16 compases y fundido final ─
mus = os.path.join(TR, "musica.wav")
run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", CAN, "-filter_complex",
     f"[0:a]atrim=0:{CORTE_A + 0.06},asetpts=PTS-STARTPTS[a];[0:a]atrim={CORTE_A + SALTO - 0.06}:{FIN_CANCION},asetpts=PTS-STARTPTS[b];"
     f"[a][b]acrossfade=d=0.12:c1=tri:c2=tri,afade=t=in:d=0.3,afade=t=out:st={DUR - 3.2:.2f}:d=3.2,loudnorm=I=-14:TP=-1.0:LRA=11[o]",
     "-map", "[o]", "-ar", "48000", "-ac", "2", mus])

# ── 5. 4K: escalado, textos, grano, viñeta, fundidos de entrada y salida ─
ins = ["-i", master]
fc = [f"[0:v]scale=3840:2160:flags=lanczos,unsharp=5:5:0.4,vignette=PI/5,fade=t=in:d=0.6,fade=t=out:st={DUR - 1.4:.2f}:d=1.4,format=yuv420p[b0]"]
prev = "b0"
for n, ((png, px, py), a, b, f) in enumerate(capas, 1):
    ins += ["-loop", "1", "-framerate", str(FPS), "-t", f"{b - a:.3f}", "-i", png]
    fc.append(f"[{n}:v]format=rgba,fade=t=in:d={f}:alpha=1,fade=t=out:st={max(0, b - a - f):.3f}:d={f}:alpha=1,setpts=PTS+{a:.3f}/TB[c{n}]")
    fc.append(f"[{prev}][c{n}]overlay={px}:{py}:eof_action=pass:format=auto[b{n}]")
    prev = f"b{n}"
ins += ["-i", mus]
run(["ffmpeg", "-nostdin", "-v", "error", "-y", *ins, "-filter_complex", ";".join(fc), "-map", f"[{prev}]", "-map", f"{len(capas) + 1}:a",
     "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-maxrate", "4300k", "-bufsize", "8600k", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "5.1",
     "-c:a", "aac", "-b:a", "256k", "-t", f"{DUR:.3f}", "-movflags", "+faststart", OUT_M])
# Versión sin música: el mismo video, con pista de audio en silencio (para sumar la canción desde la red social)
run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", OUT_M, "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-map", "0:v", "-map", "1:a",
     "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", OUT_S])
json.dump({"duracion": DUR, "tomas": [{k: t[k] for k in ("fuente", "ini", "fin", "dis")} for t in tomas], "textos": TEXTOS},
          open(os.path.join(TR, "montaje.json"), "w"), ensure_ascii=False, indent=1)
print("listo", OUT_M, OUT_S)
