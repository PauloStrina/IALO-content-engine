# E2E Publishing Pipeline

Este documento describe el flujo punta a punta para generar assets, publicarlos como URLs públicas y programar contenido en Blotato.

## Workflow

El workflow principal es:

```txt
Actions → Weekly IALO Publish
```

Inputs:

```txt
thesis: tesis semanal
template_key: template visual
publish_start_date: fecha base YYYY-MM-DD
dry_run: true o false
```

## Qué hace

```txt
1. Genera weekly-plan.json
2. Genera carousel-copy.json
3. Renderiza carrusel PNG
4. Renderiza assets estáticos para stories/post frase/hilo
5. Construye public-assets/generated/<runId>
6. Construye publish-manifest.json
7. Construye blotato-payload.json
8. Publica los assets en la branch published-assets
9. Genera URLs públicas vía raw.githubusercontent.com
10. Si dry_run=false, programa cada post en Blotato usando POST /v2/posts
```

## Secrets requeridos

Ya configurado:

```txt
OPENAI_API_KEY
```

Para envío real a Blotato:

```txt
BLOTATO_API_KEY
BLOTATO_TARGETS_JSON
```

## Blotato API

El publisher usa la REST API nativa de Blotato:

```txt
Base URL: https://backend.blotato.com/v2
Endpoint: POST /posts
Header: blotato-api-key
```

El body por post sigue esta estructura:

```json
{
  "post": {
    "accountId": "...",
    "name": "...",
    "content": {
      "text": "...",
      "mediaUrls": ["https://..."],
      "platform": "instagram"
    },
    "target": {
      "targetType": "instagram",
      "pageId": "..."
    }
  },
  "scheduledTime": "2026-06-29T13:00:00Z"
}
```

## BLOTATO_TARGETS_JSON

Este secret mapea las plataformas internas del payload con los `accountId` y `platform` reales de Blotato.

Ejemplo:

```json
{
  "instagram": {
    "accountId": "REPLACE_ME",
    "platform": "instagram"
  },
  "instagram_stories": {
    "accountId": "REPLACE_ME",
    "platform": "instagram",
    "targetType": "instagram"
  },
  "x": {
    "accountId": "REPLACE_ME",
    "platform": "x"
  }
}
```

Usar los mismos valores que ya funcionan en el `config.yaml` del publicador Motion.

## Modo dry run

Con `dry_run=true` el sistema:

```txt
genera assets
publica assets públicos
genera payload
no envía a Blotato
```

Sirve para validar URLs, manifest y assets sin programar nada.

## Modo real

Con `dry_run=false` el sistema además hace:

```txt
POST https://backend.blotato.com/v2/posts
```

y deja la respuesta en:

```txt
output/blotato-response.json
```

## Media upload

Por defecto, el publisher envía a Blotato las URLs públicas generadas por GitHub.

Opcionalmente se puede activar:

```txt
BLOTATO_UPLOAD_MEDIA=true
```

En ese caso, antes de programar cada post, el script sube cada URL a:

```txt
POST /media
```

y reemplaza la URL original por la URL validada devuelta por Blotato.

Como Blotato limita los media uploads, este modo usa delay entre requests.

## Videos

El pipeline no edita videos todavía.

Para reels o clips de podcast, el manifest marca esos posts como:

```txt
needs_manual_video
```

Para incluirlos en el envío a Blotato, crear:

```txt
manual-assets/video-assets.json
```

con la estructura de:

```txt
examples/manual-video-assets.example.json
```

Los MP4 deben estar en una URL pública antes de ejecutar el workflow.

## Branch pública de assets

Los assets se publican en:

```txt
published-assets
```

Las URLs públicas quedan bajo:

```txt
https://raw.githubusercontent.com/<owner>/<repo>/published-assets/generated/<runId>/...
```
