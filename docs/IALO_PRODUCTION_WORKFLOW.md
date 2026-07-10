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

## Principio operativo

La máquina no decide qué publicar.

La máquina debe:

1. recibir un brief estructurado;
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
content brief JSON
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

## Archivos fuente principales

```text
templates/ialo.assets.json
templates/content.schema.json
templates/01_acceptance_inner_dialogue/approval/render-approval-pack.mjs
templates/01_acceptance_inner_dialogue/approval/TEMPLATE_LOCK.md
content/examples/01_acceptance_inner_dialogue/problema_conexion.acceptance.json
```

## Próximo paso técnico

Parametrizar el renderer para que deje de estar atado a la tesis 1.

Debe poder recibir:

```text
THESIS_ID=01_acceptance_inner_dialogue
CONTENT_FILE=content/examples/01_acceptance_inner_dialogue/problema_conexion.acceptance.json
```

Y después:

```text
THESIS_ID=02_inner_change_outer_change
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
