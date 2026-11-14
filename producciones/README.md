# Producciones de AGUA STUDIO

Cada video vive en su propia carpeta (`producciones/<id>/`) con **datos**, no código:

| Archivo | Qué es | Quién lo edita |
| --- | --- | --- |
| `guion.json` | Escenas, duración, títulos, frases de narración con su momento de entrada, palabras a destacar y texto de cierre. | Vos (es el guion) |
| `sonido.json` | Secciones de música (estilo y nivel) y marcas de efectos de sonido, en segundos globales. | Vos o Claude |
| `tiempos.json` | Tiempos calculados de escenas, palabras y bloques de subtítulos. | Generado: `node scripts/temporizar.mjs producciones/<id>` |
| `subtitulos.srt` | Subtítulos estándar para subir a redes. | Generado |
| `guia-locucion.md` | Guion segmentado con marcas de tiempo para grabar la voz. | Generado |
| `voz/` | Locución grabada: `e1-1.wav`, `e2-1.wav`… (una por frase). | Vos (opcional) |
| `audio/` | Música, efectos y mezcla sintetizados. **No se versiona.** | Generado: `python3 scripts/audio/sintetizar.py producciones/<id>` |

Las animaciones de cada producción están en `src/producciones/<nombre>/`: una escena por
componente (`escenas/Escena1.tsx` …), todas armadas con el motor compartido de `src/three/`
(ciudad, casa, red de agua, edificios, personajes, mapa) y las capas de `src/ui/`
(subtítulos, títulos, cierre).

## Flujo de trabajo

1. Escribir o editar `guion.json`.
2. `node scripts/temporizar.mjs producciones/<id>` → avisa si alguna frase se superpone o no entra en su escena.
3. Ajustar las animaciones de cada escena (cámara y estado del mundo, en segundos).
4. Revisar fotogramas sueltos: `node scripts/fotogramas.mjs <Composición> out/fotos 0.3 0,120,360`.
5. `python3 scripts/audio/sintetizar.py producciones/<id>` → música, efectos y mezcla.
6. Subir los cambios y lanzar **Actions → «AGUA STUDIO · Producción» → Run workflow**.
7. Descargar el MP4 desde **Releases → `produccion-<id>`** (funciona desde el iPhone).

## Cuando llegue la locución

1. Grabar cada frase según `guia-locucion.md` y guardarlas en `producciones/<id>/voz/`.
2. Si la duración real de una frase difiere, ajustar su `"inicio"` en `guion.json` (o el
   modelo de habla en `scripts/temporizar.mjs`) y volver a correr el temporizador: los
   subtítulos se recalibran solos.
3. `sintetizar.py` mezcla la voz y baja la música automáticamente mientras se habla.
