# IALO — campaña de 8 semanas y 16 carruseles

## Calendario

- Inicio: martes 14 de julio de 2026.
- Hora: 18:00.
- Zona horaria: `America/Argentina/Buenos_Aires`.
- Martes: variante A.
- Jueves: variante B.
- Total: 16 carruseles.

## Distribución de tesis

- Semanas 1 y 5: `04_follow_enthusiasm`.
- Semanas 2 y 6: `01_acceptance_inner_dialogue`.
- Semanas 3 y 7: `02_inner_change_outer_change`.
- Semanas 4 y 8: `03_invisible_culture`.

Cada semana usa una única familia de fondos. Los carruseles A y B comparten esa familia, pero varían la fotografía inicial, el orden de imágenes, el recorte, el zoom y la secuencia de layouts.

## Fuente

El equipo entregó el contenido en texto pegado desde un documento. Se normalizó a 16 archivos JSON en `carousels/`.

Normalizaciones realizadas:

- Se corrigieron errores obvios de puntuación y espaciado.
- El carrusel 2B llegó con numeración incompleta; se preservaron sus seis slides reales y se renumeraron consecutivamente.
- Las piezas de las semanas 5 a 8 no incluían caption. Se usó como caption la pregunta madre de cada pieza, sin agregar una conclusión nueva.
- No se resumió ni reescribió el contenido editorial.
- Se incorporaron las correcciones editoriales posteriores enviadas por el equipo para los carruseles 1B, 2A y 2B.

## Sistema visual V02

La campaña utiliza `v02_disruptive`.

Reglas principales:

- Fotografías originales, sin una capa oscura transparente aplicada sobre toda la imagen.
- Legibilidad mediante placas editoriales sólidas, bandas, cortes, paneles, color tipográfico y sombras localizadas.
- Variación de composición entre slides para evitar una secuencia visual monótona.
- Lyon como tipografía editorial principal y Futura para microdetalles.
- Paleta IALO: crema `#EEE9E0`, negro `#1A1A1A` y naranja `#FF5000`.
- Logo IALO pequeño en el margen inferior izquierdo.
- Contador en el margen superior derecho.
- El texto del primer slide se mantiene alineado a la izquierda y centrado verticalmente.

## Render

```bash
npm install
npx playwright install chromium
npm run render:campaign
npm run contact:campaign
npm run build:campaign-payload
```

Outputs:

```text
public-assets/campaigns/2026-07-14-eight-weeks/
  campaign-contact-sheet.png
  campaign-index.json
  campaign-manifest.json
  blotato-payload.json
  <content-id>/
    slide-01.png
    ...
    contact-sheet.png
    metadata.json
```

## GitHub Actions

Workflow:

```text
IALO 16 Carousel Campaign
```

Al abrir o actualizar el pull request se ejecuta automáticamente un dry run y se genera el artifact:

```text
ialo-16-carousel-campaign-v02-approval
```

Para publicar realmente:

1. Revisar los 16 contact sheets.
2. Ejecutar el workflow manualmente.
3. Elegir `dry_run=false`.
4. Escribir `PROGRAMAR_16` en `confirm_publish`.

## Seguridad

La publicación real no ocurre en pull requests. El workflow exige ejecución manual, `dry_run=false` y confirmación explícita. La primera ejecución debe mantenerse en dry run hasta aprobar visualmente los 16 carruseles y verificar el payload de Blotato.
