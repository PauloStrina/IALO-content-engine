# IALO — 01_acceptance_inner_dialogue — V03 `hybrid_main_assets_free`

Esta carpeta contiene una versión operativa de la V03 sin dependencias externas.

## Por qué existe esta versión

Los fondos originales, el logo binario y las fuentes comerciales no están disponibles desde este hilo y no conviene bloquear el avance por eso. Esta versión resuelve el problema con backgrounds procedurales en HTML/CSS, paleta IALO y layout sistematizado.

## Qué genera

- 10 slides en 1080 × 1350.
- Contact sheet.
- ZIP con PNGs vía GitHub Actions.
- JSON estructurado para convertir después en template automatizable.

## Archivos

```text
index.html                         # Preview visual y fuente renderizable
slides.v03.assets-free.json        # Estructura narrativa + layouts
render-assets-free.mjs             # Render PNG con Playwright
.github/workflows/render-ialo-v03-assets-free.yml
```

## Cómo renderizar

Entrar a GitHub Actions y correr manualmente:

```text
Render IALO V03 Assets Free
```

El workflow sube un artifact llamado:

```text
ialo_acceptance_test_v03_assets_free_pngs
```

## Decisión de diseño

Esta V03 toma de la V02 los slides 1, 3, 4, 5, 8 y 10; rediseña 2, 6, 7 y 9; y usa Futura/condensed para la portada.

## Pendiente cuando aparezcan los assets originales

Reemplazar los backgrounds procedurales por:

```text
assets/ialo/backgrounds/acceptance/Habitacion Luz 2.jpg
assets/ialo/backgrounds/acceptance/Habitacion Luz 3.jpg
assets/ialo/backgrounds/acceptance/Habitacion Luz.jpg
assets/ialo/backgrounds/acceptance/Silla Lluvia 2.webp
assets/ialo/backgrounds/acceptance/Silla Lluvia 3.jpg
assets/ialo/backgrounds/acceptance/Silla Lluvia.jpg
```

Y reemplazar el ojo CSS por:

```text
assets/ialo/logos/IALO_Logo_5b.png
```

No subir fuentes comerciales a un repo público salvo que haya licencia de redistribución.
