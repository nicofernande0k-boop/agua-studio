#!/usr/bin/env python3
"""
PATRIA EN DISPUTA 002 — arma la hoja de sonido a partir de los tiempos reales
de la voz: música por acto (piano → cuerdas → crecimiento → clímax → cierre)
y efectos por toma. Escribe producciones/002-nosotros/sonido.json.
"""
import json
import sys
from pathlib import Path

prod = Path(sys.argv[1] if len(sys.argv) > 1 else "producciones/002-nosotros")
t = json.loads((prod / "tiempos.json").read_text())
F = {f["k"]: f for f in t["frases"]}
ini = lambda k: F[k]["inicio"]
fin = lambda k: F[k]["fin"]
corte = lambda k: ini(k) - 0.35
D = t["duracion"]
# Ajustes por versión (la definitiva usa la narración de ElevenLabs, más rápida y con otro nivel).
DEF = prod.name == "002-definitiva"
N_CRECE = 0.4 if DEF else 0.5
N_TREN = 0.42 if DEF else 0.55
N_LLUVIA = 0.2 if DEF else 0.28

musica = [
    {"desde": 0.4, "hasta": corte(9) - 0.1, "estilo": "piano_min", "nivel": 0.55, "notas": [62, 65, 69, 67, 65, 64, 62, 57], "paso": 1.7},
    {"desde": corte(9) + 0.1, "hasta": corte(17) - 0.1, "estilo": "cuerdas", "nivel": 0.38,
     "acordes": [[50, 57, 62, 65], [46, 53, 58, 62], [43, 50, 55, 58], [45, 52, 57, 61]]},
    {"desde": corte(17) + 0.1, "hasta": corte(26) - 0.1, "estilo": "crece", "nivel": N_CRECE,
     "acordes": [[48, 55, 60, 64], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57]]},
    {"desde": corte(26) + 0.1, "hasta": corte(33) - 0.2, "estilo": "climax", "nivel": 0.4,
     "final": ini(31) - (corte(26) + 0.1), "golpes": [fin(31) + 0.1, fin(32) + 0.05]},
    # Cierre: casi silencio, después la firma.
    {"desde": corte(33) + 0.2, "hasta": ini(35) - 0.1, "estilo": "piano_min", "nivel": 0.4, "notas": [57, 60, 64, 62], "paso": 2.2},
    {"desde": ini(35) - 0.2, "hasta": D, "estilo": "climax", "nivel": 0.34,
     "acordes": [[45, 52, 57, 60, 64], [41, 48, 53, 57, 60]], "final": ini(36) - (ini(35) - 0.2), "golpes": [fin(36) + 0.05, fin(38) + 0.05]},
]

efectos = []
def e(tt, d, tipo, n):
    efectos.append({"t": round(tt, 3), "dur": round(d, 3), "tipo": tipo, "nivel": n})

e(0.2, corte(2) + 0.5, "viento", 0.25)
e(corte(2), corte(4) - corte(2), "pasos", 0.4)
e(corte(2), corte(4) - corte(2), "ambiente_ciudad", 0.25)
dur_subte = corte(7) - corte(4)
e(corte(4) + dur_subte * 0.12, dur_subte * 0.5, "tren", N_TREN)
e(corte(7), corte(8) - corte(7), "pasos", 0.35)
e(corte(9), corte(12) - corte(9), "lluvia", N_LLUVIA)
e(corte(9), corte(12) - corte(9), "pasos", 0.2)
e(corte(12) + 0.3, corte(13) - corte(12), "grieta", 0.5)
e(corte(13), corte(16) - corte(13), "viento", 0.2)
e(corte(16), corte(17) - corte(16), "pasos", 0.35)
e(corte(17), corte(18) - corte(17), "tono_sala", 0.5)
e(corte(18), corte(19) - corte(18), "pasos", 0.25)
e(corte(19), corte(20) - corte(19), "platos", 0.35)
e(corte(22), corte(23) - corte(22), "brillo", 0.35)
e(corte(23), corte(26) - corte(23), "pasos", 0.25)
e(corte(26), corte(28) - corte(26), "pasos", 0.45)
e(corte(28), corte(30) - corte(28), "rumor_grave", 0.35)
e(corte(30), corte(31) - corte(30), "pasos", 0.3)
e(ini(31) + 1.0, 3.5, "convergen", 0.4)
e(fin(36) - 0.5, 0.55, "reverso", 0.35)
e(fin(36) + 0.05, 3.0, "impacto", 0.45)
e(fin(38) + 0.05, D - fin(38) - 0.05, "impacto_final", 0.6)

(prod / "sonido.json").write_text(json.dumps({"descripcion": "Episodio 002: música y efectos sintetizados por código, en segundos del video.", "rms_musica": 0.034, "musica": musica, "efectos": efectos}, ensure_ascii=False, indent=1) + "\n")
print(f"{len(musica)} secciones de música · {len(efectos)} efectos · {D:.1f} s")
