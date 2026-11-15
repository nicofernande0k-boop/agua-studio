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

musica = [
    {"desde": 0.4, "hasta": corte(9) - 0.1, "estilo": "piano_min", "nivel": 0.55, "notas": [62, 65, 69, 67, 65, 64, 62, 57], "paso": 1.7},
    {"desde": corte(9) + 0.1, "hasta": corte(17) - 0.1, "estilo": "cuerdas", "nivel": 0.6,
     "acordes": [[50, 57, 62, 65], [46, 53, 58, 62], [43, 50, 55, 58], [45, 52, 57, 61]]},
    {"desde": corte(17) + 0.1, "hasta": corte(26) - 0.1, "estilo": "crece", "nivel": 0.6,
     "acordes": [[48, 55, 60, 64], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57]]},
    {"desde": corte(26) + 0.1, "hasta": corte(33) - 0.2, "estilo": "climax", "nivel": 0.66,
     "final": ini(31) - (corte(26) + 0.1), "golpes": [ini(31), ini(32)]},
    # Cierre: casi silencio, después la firma.
    {"desde": corte(33) + 0.2, "hasta": ini(35) - 0.1, "estilo": "piano_min", "nivel": 0.4, "notas": [57, 60, 64, 62], "paso": 2.2},
    {"desde": ini(35) - 0.2, "hasta": D, "estilo": "climax", "nivel": 0.62,
     "acordes": [[45, 52, 57, 60, 64], [41, 48, 53, 57, 60]], "final": ini(36) - (ini(35) - 0.2), "golpes": [ini(36), ini(38)]},
]

efectos = []
def e(tt, d, tipo, n):
    efectos.append({"t": round(tt, 3), "dur": round(d, 3), "tipo": tipo, "nivel": n})

e(0.2, corte(2) + 0.5, "viento", 0.25)
e(corte(2), corte(4) - corte(2), "pasos", 0.4)
e(corte(2), corte(4) - corte(2), "ambiente_ciudad", 0.25)
dur_subte = corte(7) - corte(4)
e(corte(4) + dur_subte * 0.12, dur_subte * 0.5, "tren", 0.55)
e(corte(7), corte(8) - corte(7), "pasos", 0.35)
e(corte(9), corte(12) - corte(9), "lluvia", 0.5)
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
e(ini(36) - 0.6, 0.6, "reverso", 0.4)
e(ini(36), 3.0, "impacto", 0.45)
e(ini(38), D - ini(38), "impacto_final", 0.6)

(prod / "sonido.json").write_text(json.dumps({"descripcion": "Episodio 002: música y efectos sintetizados por código, en segundos del video.", "musica": musica, "efectos": efectos}, ensure_ascii=False, indent=1) + "\n")
print(f"{len(musica)} secciones de música · {len(efectos)} efectos · {D:.1f} s")
