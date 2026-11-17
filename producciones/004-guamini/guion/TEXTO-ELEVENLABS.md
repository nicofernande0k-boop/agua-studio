# EPISODIO 004 — TEXTO PARA ELEVENLABS (voz «Daniel»)
### «Guaminí: donde nadie es un desconocido»

## Ajustes (los mismos de los episodios 002 y 003)
- Voz **Daniel** · modelo **Eleven Multilingual v2** (acepta las pausas `<break>`).
- Estabilidad **50–55** (un poco más estable que en el 003: este episodio es íntimo, no de tráiler) · Similitud **75** · Estilo **15–25** · Speaker boost **activado** · Velocidad **0,95–1,0**.
- Generá **todo el texto de una sola vez**, en un único archivo.
- Duración esperada: **95–110 s de voz** → video de **100–118 s** con el silencio final.

## VERSIÓN A — con pausas (copiar tal cual)
```
Acá, si un día no saludás, alguien te pregunta si te pasa algo. <break time="0.6s" />
Esto es Guaminí. <break time="0.4s" />
Tres mil vecinos. Ciento cincuenta años. Y nadie es un desconocido. <break time="0.8s" />

Es la vereda donde la charla no tiene apuro. <break time="0.3s" />
La laguna que cambia de color con cada tarde. <break time="0.3s" />
Y las esquinas que todavía tienen el apellido de alguien. <break time="0.8s" />

Antes de los fortines, esta tierra ya tenía nombre: Guaminí, una palabra mapuche que habla de una isla en el agua. <break time="0.5s" />
En mil ochocientos setenta y seis llegó el fortín, a orillas de la Laguna del Monte. <break time="0.4s" />
Después vinieron los que se quedaron, y levantaron la iglesia ladrillo por ladrillo. <break time="0.4s" />
En mil novecientos treinta y siete, Francisco Salamone dibujó un palacio con un reloj que mira al futuro. <break time="0.5s" />
Y las calles de tierra se hicieron asfalto, a pala y hormigonera. <break time="0.4s" />
Muchos de sus nombres no están en ningún libro. Pero están en cada vereda. <break time="0.8s" />

En mil novecientos ochenta y cinco, el agua avanzó sobre el pueblo. Y el pueblo se defendió. <break time="0.4s" />
Ese mismo año, un grupo de vecinos fundó los Bomberos Voluntarios. <break time="0.4s" />
Porque acá, cuando a uno le pasa algo, nos pasa a todos. <break time="0.8s" />

Y detrás de cada historia, algo que no sale en las fotos: <break time="0.3s" />
la escuela pública, el hospital, el agua que llega a cada casa, la obra que alguien decidió hacer. <break time="0.4s" />
Hoy, el palacio de Salamone se está restaurando. <break time="0.3s" />
Porque los pueblos también se sostienen con decisiones. <break time="0.8s" />

No es fácil. Las rutas, el trabajo, los chicos que se van a estudiar. <break time="0.4s" />
Pero cada mañana alguien levanta la persiana, alguien siembra, alguien enseña. <break time="0.3s" />
Y el pueblo sigue. <break time="0.8s" />

Porque un pueblo no es un punto en el mapa. <break time="0.5s" />
Es la memoria de los abuelos. La mano del vecino. Y los que mañana lo van a cuidar. <break time="0.8s" />
Ciento cincuenta años después, Guaminí sigue siendo eso: <break time="0.5s" />
un lugar donde nadie es un desconocido. <break time="0.3s" />
```

## VERSIÓN B — sin etiquetas (si el modelo no acepta `<break>`)
```
Acá, si un día no saludás, alguien te pregunta si te pasa algo.
Esto es Guaminí.
Tres mil vecinos. Ciento cincuenta años. Y nadie es un desconocido.

Es la vereda donde la charla no tiene apuro.
La laguna que cambia de color con cada tarde.
Y las esquinas que todavía tienen el apellido de alguien.

Antes de los fortines, esta tierra ya tenía nombre: Guaminí, una palabra mapuche que habla de una isla en el agua.
En mil ochocientos setenta y seis llegó el fortín, a orillas de la Laguna del Monte.
Después vinieron los que se quedaron, y levantaron la iglesia ladrillo por ladrillo.
En mil novecientos treinta y siete, Francisco Salamone dibujó un palacio con un reloj que mira al futuro.
Y las calles de tierra se hicieron asfalto, a pala y hormigonera.
Muchos de sus nombres no están en ningún libro. Pero están en cada vereda.

En mil novecientos ochenta y cinco, el agua avanzó sobre el pueblo. Y el pueblo se defendió.
Ese mismo año, un grupo de vecinos fundó los Bomberos Voluntarios.
Porque acá, cuando a uno le pasa algo, nos pasa a todos.

Y detrás de cada historia, algo que no sale en las fotos:
la escuela pública, el hospital, el agua que llega a cada casa, la obra que alguien decidió hacer.
Hoy, el palacio de Salamone se está restaurando.
Porque los pueblos también se sostienen con decisiones.

No es fácil. Las rutas, el trabajo, los chicos que se van a estudiar.
Pero cada mañana alguien levanta la persiana, alguien siembra, alguien enseña.
Y el pueblo sigue.

Porque un pueblo no es un punto en el mapa.
Es la memoria de los abuelos. La mano del vecino. Y los que mañana lo van a cuidar.
Ciento cincuenta años después, Guaminí sigue siendo eso:
un lugar donde nadie es un desconocido.
```

## Cómo leerlo (no se pega en ElevenLabs)
| Parte | Intención |
|---|---|
| Gancho | Con una sonrisa en la voz, cercano, como quien cuenta algo de su casa. «Esto es Guaminí» con orgullo tranquilo. |
| La vida en el pueblo | Lento, cálido, casi en voz baja. Imágenes, no datos. |
| Quienes lo construyeron | Narrador de memoria: firme en las fechas, emocionado en «ladrillo por ladrillo». «Pero están en cada vereda» se deja respirar. |
| La solidaridad | Más presencia. «Y el pueblo se defendió» con fuerza contenida. «Nos pasa a todos» con calidez. |
| El Estado | Reflexivo, sin tono de discurso. Afirmación serena. |
| Los desafíos | Honesto, sin dramatizar. «Y el pueblo sigue» sube un poco: es la bisagra hacia el final. |
| Cierre | Lento, profundo. La última frase, casi un susurro firme. |

**Fechas en letras a propósito** (mil ochocientos setenta y seis, etc.) para que ElevenLabs no las lea como números.
