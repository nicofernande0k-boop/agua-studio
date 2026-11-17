#!/usr/bin/env python3
"""
Día de la Militancia — arma el montaje a partir de la voz (tiempos.json) y del plan.

- Elige para cada toma la primera imagen disponible que no se haya usado (sin repetir).
- Genera el clip «foto viva» (paralaje por profundidad) con la duración exacta.
- Escribe montaje.json para la composición de Remotion.

Uso: montar.py <prod> <carpeta_fotos> <carpeta_clips> <ancho> <alto> <python_depth> <scripts_depth>
"""
import json, os, subprocess, sys, unicodedata
from concurrent.futures import ThreadPoolExecutor

prod, fotos, clips, W, H, PY, DEP = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]), sys.argv[6], sys.argv[7]
FPS = 30
T = json.load(open(os.path.join(prod, "tiempos.json")))
plan = json.load(open(os.path.join(prod, "plan.json")))["tomas"]
F = {f["k"]: f for f in T["frases"]}
PAL = T["palabras"]
disp = set(os.listdir(fotos))


def clave(n):
    return unicodedata.normalize("NFC", n)


disp = {clave(n): n for n in disp}
usadas = set()


def elegir(cands, permitir_repetir=False):
    for c in cands:
        n = disp.get(clave(c))
        if n and (n not in usadas or permitir_repetir):
            return n
    if not permitir_repetir:
        return elegir(cands, True)
    return None


def pal(k, i):
    ps = [p for p in PAL if p["frase"] == k]
    return ps[i if i >= 0 else len(ps) + i]


tomas = []
for j, t in enumerate(plan):
    ini = F[t["k"]]["inicio"] - (0.3 if j else F[t["k"]]["inicio"])
    tomas.append(dict(t, t0=max(0.0, ini)))
for j, t in enumerate(tomas):
    t["t1"] = tomas[j + 1]["t0"] if j + 1 < len(tomas) else T["duracion"]

salida = []
trabajos = []
rapidas = [n for n in ["Perón_exiliado.jpg", "Cordobazo.jpg", "Madres_de_Plaza_de_Mayo_(1).jpg", "Huelga_Ferroviaria_1961.jpg", "Bicentenario_-_Obelisco.jpg",
                       "17deoctubre-enlafuente.jpg", "Marcha_24_de_marzo_2019.jpg", "Rosariazo_1.jpg", "Ni_Una_Menos_-_Buenos_Aires_-_3JUN2017.jpg",
                       "Perón_y_Rucci_en_Ezeiza_II.jpg", "2da_Marcha_Federal_Universitaria_Córdoba_2024_13.jpg", "Cordobazo-Mujeres.jpg"] if clave(n) in disp]


def clip(nombre, dur, recorte, mov, cid):
    base = os.path.splitext(nombre)[0]
    dep = os.path.join(DEP, "depth", base + ".png")
    out = os.path.join(clips, f"{cid}.mp4")
    trabajos.append((nombre, dep, out, dur, recorte, mov))
    return f"mil/clips/{cid}.mp4"


for j, t in enumerate(tomas):
    d = t["t1"] - t["t0"]
    reg = {"id": f"t{j:02d}", "desde": round(t["t0"] * FPS), "hasta": round(t["t1"] * FPS), "k": t["k"]}
    if t.get("placa_final"):
        reg["tipo"] = "placa"
    elif t.get("montaje_rapido"):
        # Montaje que se acelera: generaciones alternadas (blanco y negro ↔ color)
        sub, acum, i = [], 0.0, 0
        while acum < d - 0.15 and rapidas:
            largo = max(0.33, 0.9 * (0.86 ** i))
            n = rapidas[i % len(rapidas)]
            cid = f"r{i:02d}"
            sub.append({"desde": round((t["t0"] + acum) * FPS), "hasta": round((t["t0"] + min(d, acum + largo)) * FPS), "clip": clip(n, largo + 0.2, [0.5, 0.5, 1.0], [1.08, 1.16, 0.0, 0.0, 0.04], cid), "img": n})
            acum += largo
            i += 1
        reg.update(tipo="rapido", sub=sub)
    else:
        n = elegir(t["img"])
        if n is None:
            reg["tipo"] = "vacio"
        else:
            usadas.add(n)
            reg.update(tipo="foto", img=n, clip=clip(n, d + 0.7, t["recorte"], t["mov"], reg["id"]))
            if t.get("despues") and clave(t["despues"]) in disp:
                n2 = disp[clave(t["despues"])]
                reg["despues"] = {"clip": clip(n2, d * 0.6 + 0.7, [0.5, 0.5, 1.0], [1.02, 1.12, 0.0, 0.2, 0.06], reg["id"] + "b"), "desde": round((t["t0"] + d * 0.45) * FPS)}
    for campo in ("lluvia", "fundido", "epigrafe", "grande", "oscuro", "rojo"):
        if campo in t:
            reg[campo] = t[campo]
    if "desde_palabra" in t:
        k, i = t["desde_palabra"]
        reg["grande_desde"] = round(pal(k, i)["inicio"] * FPS)
    salida.append(reg)

# Profundidad para las imágenes nuevas
faltan = sorted({x[0] for x in trabajos if not os.path.exists(x[1])})
if faltan:
    subprocess.run([PY, os.path.join(DEP, "profundidad.py"), os.path.join(DEP, "depth")] + [os.path.join(fotos, n) for n in faltan], check=True)


def hacer(x):
    nombre, dep, out, dur, (cx, cy, hr), (z0, z1, dx, dy, fz) = x
    r = subprocess.run([PY, os.path.join(DEP, "paralaje.py"), os.path.join(fotos, nombre), dep, out, f"{dur:.2f}", str(W), str(H), str(cx), str(cy), str(hr), str(z0), str(z1), str(dx), str(dy), str(fz)], capture_output=True, text=True)
    return r.stdout.strip() or r.stderr[-200:]


with ThreadPoolExecutor(4) as ex:
    for r in ex.map(hacer, trabajos):
        print(r[-80:], flush=True)

json.dump({"fps": FPS, "frames": T["frames"], "tomas": salida, "bloques": T["bloques"], "palabras": PAL, "frases": T["frases"]}, open(os.path.join(prod, "montaje.json"), "w"), ensure_ascii=False, indent=1)
print("tomas:", len(salida), "· usadas:", len(usadas), "· vacías:", sum(1 for s in salida if s["tipo"] == "vacio"))
