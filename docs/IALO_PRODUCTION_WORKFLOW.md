# IALO Content Production Workflow

## Estado actual

El sistema ya tiene una primera familia de templates aprobable para la tesis:

```text
01_acceptance_inner_dialogue — Acepto lo que es
```

El approval pack vigente genera dos opciones:

```text
v01_cinematic_sober
v02_minimal_constant_text
```

## Cambio operativo importante

GitHub no crea el contenido.

El contenido se crea antes, en co-creación humana dentro del chat de proyecto. GitHub recibe un JSON con el texto final y solamente hace el trabajo de render:

```text
texto/copy co-creado en ChatGPT Proyecto
↓
JSON manual de contenido
↓
GitHub renderiza V01 + V02
↓
approval pack
↓
aprobación humana
↓
Blotato
```

## Cantidad variable de slides

Los carruseles no tienen una cantidad fija de slides.

El campo `slides[]` puede tener una cantidad variable. El renderer calcula automáticamente:

```text
1/N
2/N
3/N
...
N/N
```

Regla práctica:

- el orden del array `slides[]` define el orden del carrusel;
- `number` es opcional;
- si falta `layout`, el renderer lo infiere por posición o `role`;
- si falta `background`, el renderer rota fondos disponibles de la tesis;
- V01 usa layouts editoriales;
- V02 ignora layouts y mantiene el texto siempre en la misma posición.

## Principio operativo

La máquina no decide qué publicar.

La máquina debe:

1. recibir un JSON manual con texto final;
2. renderizar las versiones aprobables;
3. entregar un approval pack;
4. esperar aprobación humana;
5. preparar solo la versión aprobada para Blotato.

## Flujo mensual objetivo

```text
Mes IALO
├── Semana 1: Acepto lo que es
│   ├── Carrusel A: Problema / Conexión
│   └── Carrusel B: Método / Pregunta práctica
├── Semana 2: Cambio adentro, para cambiar afuera
│   ├── Carrusel A: Problema / Espejo
│   └── Carrusel B: Método / Autoconocimiento
├── Semana 3: La cultura es el inconsciente colectivo
│   ├── Carrusel A: Problema / Cultura invisible
│   └── Carrusel B: Método / Lectura organizacional
└── Semana 4: Seguí tu entusiasmo
    ├── Carrusel A: Conexión / Manifiesto
    └── Carrusel B: Método / Brújula interna
```

## Flujo técnico objetivo

```text
manual content JSON
↓
select thesis assets
↓
render V01 + V02
↓
approval pack ZIP
↓
human approval
↓
approved_version.json
↓
publication package
↓
Blotato
```

## Cómo correr un contenido manual

Desde GitHub Actions:

```text
Actions → Render IALO Approval Pack → Run workflow
```

Completar el input:

```text
content_file = content/examples/01_acceptance_inner_dialogue/problema_conexion.acceptance.json
```

El artifact generado es:

```text
ialo_manual_content_approval_pack
```

## Formato mínimo del JSON manual

```json
{
  "content_id": "2026-07-w01-carousel-a",
  "content_origin": "manual_chat_cocreation",
  "thesis_id": "01_acceptance_inner_dialogue",
  "format": "instagram_carousel",
  "channel": "instagram",
  "slides": [
    {
      "text": "Texto del slide 1"
    },
    {
      "text": "Texto del slide 2",
      "supporting_text": "Texto secundario opcional"
    }
  ]
}
```

## Formato recomendado

```json
{
  "content_id": "2026-07-w01-carousel-a-acceptance-problema-conexion",
  "content_origin": "manual_chat_cocreation",
  "thesis_id": "01_acceptance_inner_dialogue",
  "variant_id": "problema_conexion",
  "format": "instagram_carousel",
  "channel": "instagram",
  "title": "Aceptar lo que es",
  "objective": "Que el lector vea cuánta energía pierde resistiendo lo que es.",
  "slides": [
    {
      "role": "cold_open",
      "layout": "cover",
      "background": "Lluvia 1.jpg",
      "text": "¿CUÁNTA ENERGÍA\nESTÁS GASTANDO\nEN PELEAR\nCON LO QUE\nYA ES?"
    }
  ]
}
```

## Archivos fuente principales

```text
templates/ialo.assets.json
templates/content.schema.json
templates/01_acceptance_inner_dialogue/approval/render-approval-pack.mjs
templates/01_acceptance_inner_dialogue/approval/TEMPLATE_LOCK.md
content/examples/01_acceptance_inner_dialogue/problema_conexion.acceptance.json
```

## Próximo paso técnico

Extender este mismo renderer manual-variable para las cuatro tesis y para cualquier `CONTENT_FILE`.

Debe poder recibir:

```text
CONTENT_FILE=content/examples/01_acceptance_inner_dialogue/problema_conexion.acceptance.json
```

Y después:

```text
CONTENT_FILE=content/examples/02_inner_change_outer_change/problema_espejo.json
```

## Gate de publicación

La publicación a Blotato se habilita solo con un archivo de aprobación explícito:

```json
{
  "content_id": "2026-07-w01-carousel-a-acceptance-problema-conexion",
  "approved_version": "v01_cinematic_sober",
  "approved_by": "human",
  "approved_at": "YYYY-MM-DDTHH:mm:ssZ",
  "channel": "instagram"
}
```

Sin ese archivo, no hay publicación.
