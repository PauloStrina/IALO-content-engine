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

Cada semana usa una única familia de fondos. Los carruseles A y B comparten esa familia, pero varían la fotografía inicial, el orden de imágenes y la secuencia de layouts.

## Fuente

El equipo entregó el contenido en texto pegado desde un documento. Se normalizó a 16 archivos JSON en `carousels/`.

Normalizaciones realizadas:

- Se corrigieron errores obvios de puntuación y espaciado.
- El carrusel 2B llegó con numeración incompleta; se preservaron sus seis slides reales y se renumeraron consecutivamente.
- Las piezas de las semanas 5 a 8 no incluían caption. Se usó como caption la pregunta madre de cada pieza, sin agregar una conclusión nueva.
- No se resumió ni reescribió el contenido editorial.

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

Al abrir un pull request se ejecuta automáticamente un dry run y se genera el artifact:

```text
ialo-16-carousel-campaign-approval
```

Para publicar realmente:

1. Revisar los 16 contact sheets.
2. Ejecutar el workflow manualmente.
3. Elegir `dry_run=false`.
4. Escribir `PROGRAMAR_16` en `confirm_publish`.

## Seguridad

La publicación real no ocurre en pull requests. El workflow exige ejecución manual, `dry_run=false` y confirmación explícita. La primera ejecución debe mantenerse en dry run hasta aprobar visualmente los 16 carruseles y verificar el payload de Blotato.
