# IALO Content Engine

Sistema técnico para producir, renderizar, publicar assets y preparar contenido de **Invisible a los Ojos**.

## Qué hace

- Versiona el cerebro estratégico de IALO.
- Genera planificación semanal desde una tesis.
- Genera copies de carruseles desde OpenAI.
- Renderiza carruseles HTML/CSS a PNG con Playwright.
- Renderiza assets estáticos para stories, posts simples e hilos.
- Publica assets en una branch pública `published-assets`.
- Construye un manifest de publicación con URLs públicas.
- Envía el payload de programación a Blotato cuando `dry_run=false`.

## Arquitectura

```txt
brand/       Cerebro estratégico, voz, tesis y reglas editoriales
design/      Templates visuales HTML/CSS
src/         Scripts de generación, render, manifest y publicación
docs/        Setup operativo
output/      Archivos generados localmente o por Actions
.github/     Workflows de automatización
```

## Flujo E2E

```txt
Tesis semanal
→ OpenAI genera planificación
→ OpenAI genera copy de carrusel
→ HTML/CSS renderiza assets
→ GitHub Actions publica assets públicos
→ Se genera publish-manifest.json
→ Se genera blotato-payload.json
→ Blotato recibe el payload y programa
```

## Setup local

```bash
npm install
cp .env.example .env
npm run pipeline:local
```

## GitHub Actions

Prueba sin publicar en Blotato:

```txt
Actions → Weekly IALO Publish → Run workflow → dry_run=true
```

Publicación real hacia Blotato:

```txt
Actions → Weekly IALO Publish → Run workflow → dry_run=false
```

Secrets requeridos:

```txt
OPENAI_API_KEY
BLOTATO_API_URL
BLOTATO_API_KEY
```

`BLOTATO_API_KEY` puede quedar vacío si el endpoint de Blotato funciona como webhook sin bearer token.

## Documentación

```txt
docs/e2e-publishing.md
```

## Estado

La máquina técnica queda preparada para correr punta a punta. La calidad editorial del copy todavía requiere una iteración estratégica profunda antes de usarla sin revisión humana.
