# AGUA STUDIO

Producción de videos explicativos animados en 3D para Instagram Reels
(1080 × 1920, 30 fps), con **Remotion + React Three Fiber + Three.js**.

Repositorio independiente. Nació dentro de `patria-en-disputa-studio` y se
trasladó acá con su historial; no comparte código ni dependencias con esa app.

## Producción 001: «¿Y si mañana no tenés agua?» (85,5 s)

Cortometraje completo en seis escenas, composición `Produccion001`:

| # | Escena | Tiempo |
| --- | --- | --- |
| 1 | ¿Y si mañana no tenés agua? — ciudad, calle, techo, baño, canilla seca | 0:00 – 0:12 |
| 2 | Una ciudad sin agua — subsuelo, red con rayos X, hospital, escuela, la ciudad se apaga | 0:12 – 0:24,5 |
| 3 | ¿Un derecho o un negocio? — torre corporativa, facturas y dinero, válvula gigante | 0:24,5 – 0:39 |
| 4 | Argentina, años 90 — mapa 3D, línea de tiempo, contratos, recorrido por el país | 0:39 – 0:57 |
| 5 | Los que hacen posible el agua — planta potabilizadora, cuadrilla, el agua vuelve | 0:57 – 1:10 |
| 6 | El agua no se vende — red iluminada, gota gigante, «EL AGUA NO SE VENDE. SE DEFIENDE.» | 1:10 – 1:25,5 |

- **Narración:** pendiente de grabar. Subtítulos y guía de locución con tiempos estimados
  (ver `producciones/001-agua/guia-locucion.md`).
- **Música y efectos:** sintetizados por código (sin samples ni descargas).
- **Render:** workflow «AGUA STUDIO · Producción» (seis segmentos en paralelo + unión con FFmpeg).
- **Descarga:** Releases → `produccion-001-agua`.

Ver `producciones/README.md` para crear nuevos videos con el mismo sistema.

## Demo: «¿Y si mañana no tenés agua?» (8 s)

| Tiempo | Toma |
| --- | --- |
| 0 – 2,6 s | Picado aéreo sobre una ciudad argentina en miniatura (casas con tejas, tanques de agua, edificios, jacarandás, tránsito en movimiento). |
| 2,6 – 3,8 s | La cámara baja hacia una casa y atraviesa el techo, que se desvanece en un corte arquitectónico. |
| 3,8 – 5,9 s | Baño: la manija de agua fría gira, la canilla tose aire, cae una única gota. No sale agua. |
| 5,9 – 6,3 s | La cámara atraviesa el piso (fundido a tierra). |
| 6,3 – 8 s | Subsuelo: caño maestro y conexiones vacías, el último pulso de agua se frena, el manómetro cae a cero. Título. |

Todo es 3D real: la cámara y los objetos se mueven dentro de la escena, sin imágenes fijas.
Por ahora no tiene narración ni música.

## Estructura

```
agua-studio/
├── .github/workflows/render.yml   Render automático en GitHub Actions
├── remotion.config.ts      Render: WebGL por software (swangle), H.264, CRF 18
├── src/
│   ├── index.ts / Root.tsx Registro de composiciones
│   ├── demo/
│   │   ├── escena.ts       Medidas, tiempos clave y recorrido de cámara
│   │   └── AguaDemo.tsx    Composición: lienzo 3D + título + viñeta + transición
│   ├── producciones/agua001/  Producción 001: seis escenas + composición
│   ├── ui/Superposiciones.tsx Subtítulos, títulos de escena, cierre, fundidos
│   ├── three/
│   │   ├── Escenario.tsx   Escenario reutilizable: cámara, luz, rayos X, red, subsuelo
│   │   ├── RedAgua.tsx     Red de agua de toda la ciudad (llenar, vaciar, válvula, brillo)
│   │   ├── Edificios.tsx   Hospital, escuela, torre, válvula gigante, planta potabilizadora
│   │   ├── Personaje.tsx   Trabajadores sanitaristas con poses animadas
│   │   ├── Simbolos.tsx    Facturas, monedas, billetes, gráfico de ganancias
│   │   ├── MapaArgentina.tsx Mapa 3D con ciudades, línea de tiempo y contratos
│   │   ├── Mundo.tsx       Escenario de la demo
│   │   ├── Ciudad.tsx      Ciudad procedural con instancias (rápida sin GPU)
│   │   ├── Casa.tsx        Casa protagonista y baño con la canilla animada
│   │   ├── Subsuelo.tsx    Red de agua, manómetro, cloaca, gas, fibra
│   │   ├── Instancias.tsx  Helper de InstancedMesh
│   │   └── texturas.ts     Texturas procedurales (tejas, azulejos, calcáreo, tierra)
│   └── lib/anim.ts         Curvas, interpolación de cámara y azar con semilla
```

Todo es determinista: depende solo del número de fotograma, así cada render sale idéntico.

## Ver el resultado desde el iPhone

Los renders se lanzan a mano desde GitHub Actions (así no se gastan minutos en cada cambio):

**Producción completa:** Actions → «AGUA STUDIO · Producción» → Run workflow; el MP4 queda en
Releases → `produccion-001-agua`. **Demo de 8 s:**

1. App de GitHub o Safari → repositorio → **Actions** → «AGUA STUDIO · Render» → Run workflow.
2. Cuando termina (✓ verde), abrí **Releases → agua-studio-ultimo** y tocá
   el `.mp4`: se reproduce en Safari. Para guardarlo: Compartir → **Guardar video**.
   Enlace directo: https://github.com/nicofernande0k-boop/agua-studio/releases/tag/agua-studio-ultimo
3. También queda como artefacto (`.zip`) en la página de la ejecución.

Para renderizar sin cambios de código: **Actions → AGUA STUDIO · Render → Run workflow**.

## Comandos locales

```bash
npm ci
npm run studio        # editor visual de Remotion en el navegador
npm run typecheck
npm run render:demo   # genera out/agua-demo.mp4
```

Si la red no permite descargar el navegador de Remotion, se puede usar un Chrome
ya instalado:

```bash
REMOTION_BROWSER_EXECUTABLE=/ruta/a/chrome-headless-shell npm run render:demo
```

Tiempo medido en un contenedor de 4 núcleos sin GPU: **unos 4 min 40 s** para los 8 s.

## Licencia de Remotion

Remotion es gratis para personas, organizaciones sin fines de lucro y empresas de hasta
3 personas; por encima de eso requiere licencia de empresa. Confirmalo en remotion.dev
antes de publicar con fines comerciales.

