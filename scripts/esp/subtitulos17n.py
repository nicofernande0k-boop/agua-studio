#!/usr/bin/env python3
"""Subtítulos del especial: texto corregido, alineado a las marcas de tiempo por palabra de Whisper.
Uso: subtitulos17n.py <prod> <palabras.json>"""
import difflib, json, re, sys, unicodedata
prod, pal_p = sys.argv[1:3]
B = [
 "En primer lugar,|no se desespere,", "y en caso de zafarrancho,|no siga las reglas", "que el huracán|querrá imponerle.",
 "Refúgiese en la casa|y asegure los postigos", "una vez que todos los suyos|estén a salvo.",
 "Comparta el mate y la charla|con los compañeros,", "los besos furtivos|y las noches clandestinas", "con quien le asegure ternura.",
 "No deje que la estupidez|se imponga,", "defiéndase.", "A la estética, ética.", "Esté siempre atento.",
 "No les bastará empobrecerlo", "y lo querrán someter|con su propia tristeza.", "Ríase estentóreamente.", "Mófese.",
 "Será imprescindible|cenar juntos cada día", "hasta que la tormenta pase.", "Son cosas simples, sencillas,", "pero no por ello menos eficaces.",
 "Diga hacia el costado:", "«Buen día», «por favor»|y «gracias».", "Y «la concha de tu madre»", "cuando lo soliciten desde arriba.",
 "Tírele con lo que tenga,", "pero nunca solo.", "Ellos saben cómo emboscarlo", "en la desprevenida|soledad de una tarde.",
 "Recuerde que los artistas|serán siempre nuestros.", "Y el olvido será feroz", "con la comparsa de impostores|que los acompaña.",
 "Todo va a estar bien,|si me hace caso.", "Sobreviviremos nuevamente.", "Estamos curtidos.", "Cuidemos a los pibes|que querrán podarnos.",
 "Solo es menester|bien pertrecharse", "y no escatimarnos amabilidades.", "Deberemos dejar a mano|los poemas indispensables,",
 "el vino tinto y la guitarra.", "Sonreírles a nuestros viejos", "como vacuna|contra la angustia diaria.", "Ser piadosos con los amigos.",
 "No confundir a los ingenuos|con los traidores.", "Y aun con estos,|tener el perdón fácil", "para cuando vuelvan|con las ilusiones forreadas.",
 "#Aquí nadie sobra.", "Y eso sí: ser perseverantes|y tenaces.", "Escribir religiosamente|todos los días,", "todas las tardes,|todas las noches.",
 "Aun sostenidos en terquedades,", "si la fe se desmorona.", "En eso no habrá tregua|para nadie.", "La poesía les duele|a estos hijos de puta.",
]
norm = lambda w: re.sub(r"[^a-zñ]", "", unicodedata.normalize("NFKD", w.lower()).encode("ascii", "ignore").decode())
P = [p for p in json.load(open(pal_p)) if p["s"] < 150]
wt = [norm(p["w"]) for p in P]
mine, owner = [], []
for i, b in enumerate(B):
    for w in b.lstrip("#").replace("|", " ").split():
        mine.append(norm(w)); owner.append(i)
sm = difflib.SequenceMatcher(None, mine, wt, autojunk=False)
mp = {}
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        mp[a + k] = b + k
# interpolar los no emparejados
idx = sorted(mp)
def tiempo(k, campo):
    if k in mp: return P[mp[k]][campo]
    prev = max([x for x in idx if x < k], default=None); nxt = min([x for x in idx if x > k], default=None)
    if prev is None: return P[mp[nxt]]["s"]
    if nxt is None: return P[mp[prev]]["e"]
    t0, t1 = P[mp[prev]]["e"], P[mp[nxt]]["s"]
    return t0 + (t1 - t0) * (k - prev) / (nxt - prev)
bl = []
for i, b in enumerate(B):
    ks = [k for k, o in enumerate(owner) if o == i]
    bl.append({"inicio": round(tiempo(ks[0], "s") - 0.08, 2), "fin": round(tiempo(ks[-1], "e"), 2), "lineas": b.lstrip("#").split("|"), "oculto": b.startswith("#")})
for i, b in enumerate(bl):
    sig = bl[i + 1]["inicio"] if i + 1 < len(bl) else b["fin"] + 1.5
    b["salida"] = round(min(sig - 0.02, b["fin"] + 0.7), 2)
vis = [b for b in bl if not b["oculto"]]
json.dump({"bloques": vis}, open(f"{prod}/subtitulos.json", "w"), ensure_ascii=False, indent=1)
def ts(t): return f"{int(t//3600):02d}:{int(t%3600//60):02d}:{int(t%60):02d},{int(round(t%1*1000)):03d}"
with open(f"{prod}/subtitulos.srt", "w") as f:
    for i, b in enumerate(bl, 1):
        f.write(f"{i}\n{ts(b['inicio'])} --> {ts(b['salida'])}\n" + "\n".join(b["lineas"]) + "\n\n")
for b in bl: print(f"{b['inicio']:6.2f}-{b['salida']:6.2f} {' / '.join(b['lineas'])}")
print("emparejadas", len(mp), "de", len(mine))
