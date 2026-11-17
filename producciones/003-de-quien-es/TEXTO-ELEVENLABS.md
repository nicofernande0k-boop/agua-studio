# EPISODIO 003 — TEXTO PARA ELEVENLABS (voz «Daniel») · versión 2 (ajustada a 70–75 s)

## 1. Ajustes recomendados (los mismos del 002 definitivo)
- Voz: **Daniel**. Modelo: **Eleven Multilingual v2**, que admite las pausas `<break>`.
- Estabilidad **50** · Similitud **75** · Estilo **20–30** · Speaker boost **activado** · Velocidad **1,0**.
- Generá **todo el texto de una sola vez**, en un único archivo, sin cortar por partes.
- Si el modelo que uses no acepta `<break …/>`, usá la versión B (sin etiquetas): las pausas salen de la puntuación.

---

## 2. Texto para copiar — VERSIÓN A (con pausas)

```
Tenemos petróleo. Gas. Litio. Agua. Tierra. <break time="0.3s" />
¿Por qué uno de cada tres argentinos es pobre? <break time="0.7s" />

Vaca Muerta bate récords. <break time="0.3s" />
El segundo potencial de gas no convencional del mundo. <break time="0.3s" />
Uno de los mayores recursos de litio del planeta. <break time="0.3s" />
Casi diecisiete mil glaciares. <break time="0.3s" />
El octavo país más extenso de la Tierra. <break time="0.6s" />

Y aun así, casi la mitad de nuestros chicos es pobre. <break time="0.7s" />
La pregunta no es qué tenemos. <break time="0.4s" />
Es de quién es. <break time="0.8s" />

¿De quién son? <break time="0.3s" /> La Constitución dice: de las provincias. <break time="0.4s" />
¿Quién los extrae? <break time="0.3s" /> Grandes empresas. Muchas, extranjeras. <break time="0.4s" />
¿Cuánto queda? <break time="0.3s" /> Por el litio, regalías de entre el tres y el cinco por ciento. <break time="0.4s" />
¿Quién cuida el agua? <break time="0.3s" /> Desde dos mil veintiséis, cada provincia elige qué glaciares proteger. <break time="0.4s" />
¿Y las reglas? <break time="0.3s" /> Treinta años garantizadas para los grandes inversores. <break time="0.7s" />

Empresas. Nación. Provincias. Comunidades. <break time="0.3s" />
Todos disputan lo mismo: <break time="0.3s" /> quién decide, <break time="0.2s" /> y quién se beneficia. <break time="0.9s" />

Porque la riqueza no está bajo el suelo. <break time="0.4s" />
Está en las decisiones. <break time="0.9s" />

Un país no es soberano por lo que tiene. <break time="0.6s" />
Es soberano por lo que decide.
```

## 3. VERSIÓN B (sin etiquetas, para modelos que no aceptan `<break>`)

```
Tenemos petróleo. Gas. Litio. Agua. Tierra.
¿Por qué uno de cada tres argentinos es pobre?

Vaca Muerta bate récords.
El segundo potencial de gas no convencional del mundo.
Uno de los mayores recursos de litio del planeta.
Casi diecisiete mil glaciares.
El octavo país más extenso de la Tierra.

Y aun así… casi la mitad de nuestros chicos es pobre.

La pregunta no es qué tenemos.
Es de quién es.

¿De quién son? La Constitución dice: de las provincias.
¿Quién los extrae? Grandes empresas. Muchas, extranjeras.
¿Cuánto queda? Por el litio, regalías de entre el tres y el cinco por ciento.
¿Quién cuida el agua? Desde dos mil veintiséis, cada provincia elige qué glaciares proteger.
¿Y las reglas? Treinta años garantizadas para los grandes inversores.

Empresas. Nación. Provincias. Comunidades.
Todos disputan lo mismo: quién decide… y quién se beneficia.

Porque la riqueza no está bajo el suelo.
Está en las decisiones.

Un país no es soberano por lo que tiene.
Es soberano por lo que decide.
```

---

## 4. Cómo leer cada parte (interpretación — no se pega en ElevenLabs)

| Parte | Intención |
|---|---|
| **Gancho** (Tenemos petróleo… pobre?) | Seco, rápido, casi enumerado. Cada recurso es un golpe. La pregunta baja el tono, más grave, sin dramatizar. |
| **Riqueza** (Vaca Muerta… Tierra) | Firme, con orgullo contenido. Frases cortas, sin colgar los finales. |
| **Paradoja** (Y aun así…) | Baja la energía. «Y aun así» lento; «es pobre» casi en voz baja. Silencio real después. |
| **La pregunta** (Es de quién es.) | La frase central del episodio: lenta, cada palabra separada. |
| **Disputa** (preguntas y respuestas) | Ritmo creciente. Cada pregunta, directa; cada respuesta, informativa, sin opinar. Que suene a investigación, no a acusación. |
| **Enumeración** (Empresas. Nación…) | Cuatro golpes iguales. Después, «quién decide, y quién se beneficia», sube levemente. |
| **Cierre** | Lento y grave. La frase final, sin énfasis teatral: afirmación serena y definitiva. |

**Si una toma sale mal:** regenerá el texto completo, no un fragmento. Si una palabra suena rara (por ejemplo «Vaca Muerta» o «regalías»), probá otra generación con la misma configuración.

**Duración esperada:** 68–74 s de voz → video de 70–76 s con el cierre.
