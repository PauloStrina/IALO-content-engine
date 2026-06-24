# IALO Content Engine

Sistema técnico para producir, renderizar y preparar contenido de **Invisible a los Ojos**.

## Qué hace

- Versiona el cerebro estratégico de IALO.
- Genera copies de carruseles desde una tesis semanal.
- Renderiza carruseles HTML/CSS a PNG con Playwright.
- Deja preparada la capa de publicación hacia Blotato.
- Corre manualmente desde GitHub Actions.

## Arquitectura

```txt
brand/       Cerebro estratégico, voz, tesis y reglas editoriales
design/      Templates visuales HTML/CSS
src/         Scripts de generación, render y publicación
output/      Archivos generados localmente o por Actions
.github/     Workflows de automatización
```

## Flujo inicial

```txt
Tesis semanal
→ OpenAI genera copy
→ HTML/CSS renderiza slides
→ GitHub Actions guarda artifact
→ Assets listos para publicación
```

## Setup local

```bash
npm install
cp .env.example .env
npm run generate:carousel
npm run render:carousel
```

## GitHub Actions

El workflow principal se ejecuta manualmente desde:

```txt
Actions → Weekly IALO Content → Run workflow
```

Variables requeridas como secrets:

```txt
OPENAI_API_KEY
BLOTATO_API_KEY
BLOTATO_API_URL
```

## Estado

Versión inicial del motor. La integración con Google Sheets, storage público y Blotato queda preparada para la siguiente fase.
