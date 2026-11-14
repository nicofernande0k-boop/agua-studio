# AGUA STUDIO

Producción de videos explicativos animados en 3D para Instagram Reels
(1080 × 1920, 30 fps), con **Remotion + React Three Fiber + Three.js**.

Repositorio independiente. Nació dentro de `patria-en-disputa-studio` y se
trasladó acá con su historial; no comparte código ni dependencias con esa app.

## Demo actual: «¿Y si mañana no tenés agua?» (8 s)

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
│   ├── three/
│   │   ├── Mundo.tsx       Cámara, sol con sombras, niebla, entorno de reflejos
│   │   ├── Ciudad.tsx      Ciudad procedural con instancias (rápida sin GPU)
│   │   ├── Casa.tsx        Casa protagonista y baño con la canilla animada
│   │   ├── Subsuelo.tsx    Red de agua, manómetro, cloaca, gas, fibra
│   │   ├── Instancias.tsx  Helper de InstancedMesh
│   │   └── texturas.ts     Texturas procedurales (tejas, azulejos, calcáreo, tierra)
│   └── lib/anim.ts         Curvas, interpolación de cámara y azar con semilla
```

Todo es determinista: depende solo del número de fotograma, así cada render sale idéntico.

## Ver el resultado desde el iPhone

Cada vez que se sube un cambio de código, GitHub Actions renderiza el video
(workflow `.github/workflows/render.yml`):

1. App de GitHub o Safari → repositorio → **Actions** → «AGUA STUDIO · Render».
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

