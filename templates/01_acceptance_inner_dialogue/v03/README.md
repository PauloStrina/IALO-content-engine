# IALO — 01_acceptance_inner_dialogue — V03 `hybrid_main_real_assets`

Esta carpeta contiene la V03 operativa del carrusel de la tesis **Acepto lo que es**, conectada a los assets reales subidos al repo.

## Qué genera

- 10 slides en 1080 × 1350.
- Contact sheet.
- ZIP con PNGs vía GitHub Actions.
- JSON estructurado para convertir después en template automatizable.

## Archivos

```text
index.html                         # Preview visual y fuente renderizable con assets reales
slides.v03.real-assets.json        # Estructura narrativa + mapping de fondos reales
render-real-assets.mjs             # Render PNG con Playwright
render-assets-free.mjs             # Wrapper legacy que apunta al renderer real
.github/workflows/render-ialo-v03-assets-free.yml
```

## Assets usados

### Logo

```text
assets/ialo/logos/ojo ialo png.png
```

### Fuentes

```text
assets/ialo/fonts/AnyConv.com__FuturaStd-CondensedExtraBd.woff
assets/ialo/fonts/AnyConv.com__GothamNarrow-Medium.woff
assets/ialo/fonts/AnyConv.com__Lyon Text-Regular.woff
assets/ialo/fonts/AnyConv.com__LyonDisplay-Regular.woff
```

### Fondos para esta tesis

```text
assets/ialo/backgrounds/acceptance/1 - Acepto lo que es/Lluvia 1.jpg
assets/ialo/backgrounds/acceptance/1 - Acepto lo que es/Lluvia 2.jpg
assets/ialo/backgrounds/acceptance/1 - Acepto lo que es/Pieza 1.jpg
assets/ialo/backgrounds/acceptance/1 - Acepto lo que es/Pieza 2.jpg
assets/ialo/backgrounds/acceptance/1 - Acepto lo que es/Pieza 4.jpg
assets/ialo/backgrounds/acceptance/1 - Acepto lo que es/Silla Libro 1.jpg
assets/ialo/backgrounds/acceptance/1 - Acepto lo que es/Silla Libro 2.jpg
assets/ialo/backgrounds/acceptance/1 - Acepto lo que es/Ventana 1.jpg
```

## Cómo renderizar

Entrar a GitHub Actions y correr manualmente:

```text
Render IALO V03 Real Assets
```

El workflow sube un artifact llamado:

```text
ialo_acceptance_test_v03_real_assets_pngs
```

Dentro del ZIP se genera:

```text
ialo_acceptance_test_v03_contact_sheet.png
ialo_acceptance_test_v03_slide_01.png
...
ialo_acceptance_test_v03_slide_10.png
```

## Mapeo de slides

```text
01 → Lluvia 1.jpg
02 → Ventana 1.jpg
03 → Pieza 2.jpg
04 → Silla Libro 1.jpg
05 → Lluvia 2.jpg
06 → Pieza 1.jpg
07 → Pieza 4.jpg
08 → Silla Libro 2.jpg
09 → Ventana 1.jpg
10 → Lluvia 1.jpg como strip de cierre
```

## Nota

El workflow actual usa el nombre histórico del archivo:

```text
.github/workflows/render-ialo-v03-assets-free.yml
```

pero internamente ya renderiza la versión con assets reales.
