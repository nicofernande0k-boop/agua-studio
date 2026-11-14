# Producción 001 — versión definitiva con narración

**Narración:** ElevenLabs, voz «David», 147,1 s, mono 44,1 kHz (`voz/narracion.mp3`).
**Transcripción:** Whisper `medium` local (gratuito, sin API), 363 palabras con tiempo por palabra
(`voz/transcripcion-whisper.json`). Errores menores de acentuación a corregir a mano
(«caminas» → «caminás», «imagina» → «imaginá»).

**Duración propuesta del video:** 1,0 s de entrada + 147,1 s de voz + 4,4 s de cierre = **≈ 152,5 s (2:32)**,
dentro del límite de 3 minutos de Reels, TikTok y Shorts. Los tiempos de abajo son del video (voz + 1 s).

## Actos y sincronización

| Video | Narración (resumen) | Escena 3D | Estado |
| --- | --- | --- | --- |
| 0:00–0:11,6 | «Imaginate que mañana te despertás… caminás hasta la cocina, **abrís la canilla** (6,1 s) y no sale una sola **gota** (9,7 s)» | Amanecer sobre la ciudad → la cámara baja a la casa → atraviesa el techo → **cocina** con pava y mate → la canilla se abre (6,1 s) → silencio de 1 s sobre el pico seco | **Nuevo:** cocina y luz de amanecer (la versión anterior era el baño) |
| 0:11,6–0:24 | «Ahora imaginá que eso no es un accidente, que tener agua depende de **cuánto podés pagar** (18,3 s)… se convierte en un **negocio** (23,3 s)» | Bajo el piso → red con rayos X → medidores con monedas: solo algunas casas reciben agua, otras se apagan → emerge la torre corporativa con dinero y facturas | **Ampliada:** medidores y casas que se encienden según «pagan» |
| 0:24,5–0:52 | «Durante los **años 90**… privatizados… en distintos lugares del país… Se prometieron **inversiones**, un **servicio mejor**, un **futuro diferente**… una pregunta que sigue **vigente**» | Mapa 3D de Argentina: línea de tiempo años 90, contratos, símbolos de empresas en algunas ciudades → tres carteles 3D con las promesas, que a las 51 s giran y muestran «?» | **Ampliada:** carteles de promesas |
| 0:52–1:06 | «¿Qué pasa cuando… la **rentabilidad**?» · «¿…las familias que no pueden **pagar**?» · «¿…los pueblos donde invertir no resulta **rentable**?» · «¿Quién garantiza el **derecho al agua**?» | Válvula gigante que se cierra → familia frente a la canilla seca → **pueblo rural** donde la red no llega → la cámara sube y queda en silencio | **Nuevo:** familia (personajes civiles) y pueblo rural |
| 1:06–1:16 | «no es un **lujo**, no es un **privilegio**, no es una **mercancía**… es **salud**, es **dignidad**, es **vida**» | Tomas rápidas: el hospital se ilumina (salud), escuela y familia (dignidad), una fuente en la plaza que vuelve a brotar (vida) | **Nuevo:** fuente en la plaza |
| 1:16–1:40 | «detrás de cada gota… hay **trabajadores** que se levantan de **madrugada**, reparan cañerías **bajo la lluvia**, mantienen **plantas potabilizadoras** día y noche… millones de argentinos… sostienen la **vida cotidiana de nuestro pueblo**» | Seguimos una gota hacia la red → camión saliendo de madrugada → cuadrilla **bajo la lluvia** en la zanja → planta potabilizadora de día a noche → el agua recorre la ciudad y las casas se encienden | **Ampliada:** lluvia, madrugada, día y noche en la planta |
| 1:40–2:06 | «una historia de **lucha** por sus recursos… **conquistas**, **retrocesos**… no hablamos solamente de cañerías… de **tarifas**… de nuestros **hijos**, **barrios**, **pueblos**, **futuro**… Hablamos de **soberanía**» | Vuelve el mapa: la red se enciende ciudad por ciudad → ráfaga de tomas (caño, factura que se disuelve, chicos en la plaza, barrio, pueblo, horizonte) → «soberanía»: el mapa se ilumina en celeste y blanco → 1,2 s de silencio | **Nuevo:** secuencia de soberanía |
| 2:06–2:32,5 | «…entender de una vez y para siempre. El agua es un **derecho esencial**… es **vida**. El agua es **soberanía** y la vida de un pueblo **no está en venta**. **El agua no se vende.**» | La red de toda la ciudad se ilumina, líneas de luz unen edificios, las corrientes forman la gota gigante → fondo oscuro → «EL AGUA NO SE VENDE.» con la voz (2:27,5) → «SE DEFIENDE.» después de la voz → se sostiene hasta el final | Ampliada con el ritmo de la voz |

## Sonido

- **Voz:** protagonista, normalizada; la mezcla final queda en −14 LUFS.
- **Música:** la misma banda sintetizada, reacomodada a los nuevos actos, ~10 dB por debajo de la voz mientras se
  habla y sube en los silencios (después de «gota», antes de «¿Quién garantiza…», después de «soberanía»).
- **Efectos:** canilla, gota, red que se vacía, monedas, válvula, lluvia, herramientas, planta, golpe final.

## Subtítulos

Sincronizados con cada palabra pronunciada (tiempos de Whisper), en bloques cortos; destacadas:
AGUA, DERECHO, PRIVATIZADOS, TRABAJADORES, SOBERANÍA y «EL AGUA NO SE VENDE».

## Render

≈ 4575 fotogramas → 10 segmentos en paralelo en GitHub Actions (estimado 25–35 min).
Nueva Release: `produccion-001-agua-narrada`. La versión anterior (`produccion-001-agua`) se conserva.
