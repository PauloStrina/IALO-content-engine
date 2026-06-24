# E2E Publishing Pipeline

Este documento describe el flujo punta a punta para generar assets, publicarlos como URLs públicas y enviar el paquete de programación a Blotato.

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
6. Publica los assets en la branch published-assets
7. Genera URLs públicas vía raw.githubusercontent.com
8. Construye publish-manifest.json
9. Construye blotato-payload.json
10. Si dry_run=false, envía blotato-payload.json a BLOTATO_API_URL
```

## Secrets requeridos

Ya configurado:

```txt
OPENAI_API_KEY
```

Para envío real a Blotato:

```txt
BLOTATO_API_URL
BLOTATO_API_KEY
```

`BLOTATO_API_KEY` puede quedar vacío si el endpoint de Blotato funciona como webhook sin bearer token.

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
POST BLOTATO_API_URL
```

Payload enviado:

```json
{
  "source": "ialo-content-engine",
  "runId": "...",
  "generatedAt": "...",
  "posts": [
    {
      "externalId": "...",
      "platforms": ["instagram"],
      "type": "carousel",
      "scheduledAt": "2026-06-24T10:00:00-03:00",
      "text": "...",
      "caption": "...",
      "mediaUrls": ["https://raw.githubusercontent.com/.../slide-01.png"],
      "metadata": {}
    }
  ]
}
```

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

## Limitación actual

El contrato exacto de Blotato no está hardcodeado. El sistema manda un payload JSON estándar a `BLOTATO_API_URL`.

Si Blotato exige otro formato, se ajusta solo `src/scripts/publish-blotato.ts` o se configura un webhook intermedio que transforme el payload.
