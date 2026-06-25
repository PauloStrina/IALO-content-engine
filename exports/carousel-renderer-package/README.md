# Carousel Renderer Package

Paquete autocontenido para reutilizar el constructor/renderizador de carruseles de IALO en otro repositorio.

## Qué incluye

```txt
src/scripts/render-carousel.ts
design/templates/carousel-base/index.html
design/templates/carousel-base/style.css
design/templates/carousel-base/template.config.json
examples/carousel-copy.example.json
package.json
tsconfig.json
.gitignore
```

## Instalación

```bash
npm install
npx playwright install chromium
```

En CI/Linux puede hacer falta:

```bash
npx playwright install --with-deps chromium
```

## Uso rápido

```bash
cp examples/carousel-copy.example.json output/carousel-copy.json
npm run render:carousel
```

Salida esperada:

```txt
output/carousel/slide-01.png
output/carousel/slide-02.png
...
output/carousel/metadata.json
```

## Variables disponibles

```txt
INPUT_PATH=output/carousel-copy.json
TEMPLATE_KEY=carousel-base
OUTPUT_DIR=output/carousel
```

Ejemplo:

```bash
INPUT_PATH=examples/carousel-copy.example.json \
TEMPLATE_KEY=carousel-base \
OUTPUT_DIR=output/carousel \
npm run render:carousel
```

## Formato del input

```json
{
  "title": "Título del carrusel",
  "caption": "Caption del post",
  "cta": "CTA final",
  "slides": [
    { "number": 1, "type": "cover", "text": "Texto de portada" },
    { "number": 2, "type": "body", "text": "Texto de cuerpo" },
    { "number": 3, "type": "question", "text": "Pregunta" },
    { "number": 4, "type": "closing", "text": "Cierre" }
  ]
}
```

Tipos de slide disponibles:

```txt
cover
body
question
closing
```

## Cómo migrarlo a otro repo

Copiar esta carpeta completa al nuevo repo y ejecutar:

```bash
npm install
npm run render:carousel
```

Si el otro repo ya tiene `package.json`, copiar solo:

```txt
src/scripts/render-carousel.ts
design/templates/carousel-base/
```

Y agregar estas dependencias:

```bash
npm install playwright zod tsx
```
