# IALO — Approval pack para carruseles

Esta carpeta implementa el nuevo criterio operativo:

> En cada corrida de carruseles se generan siempre tres versiones visuales. El equipo revisa las tres y aprueba una sola para publicar en Blotato.

## Versiones generadas

```text
v01_cinematic_sober       # más sobria, profunda, atmosférica
v02_editorial_disruptive  # más disruptiva, scrolleable, editorial
v03_hybrid_main           # intermedia, más automatizable
```

## Output del workflow

El workflow `Render IALO Approval Pack` genera un artifact llamado:

```text
ialo_acceptance_approval_pack
```

Dentro del ZIP quedan:

```text
ialo_acceptance_approval_pack/
├── approval_manifest.json
├── approval_contact_sheet_all_versions.png
├── v01_cinematic_sober/
│   ├── contact_sheet.png
│   ├── slide_01.png
│   └── ... slide_10.png
├── v02_editorial_disruptive/
│   ├── contact_sheet.png
│   ├── slide_01.png
│   └── ... slide_10.png
└── v03_hybrid_main/
    ├── contact_sheet.png
    ├── slide_01.png
    └── ... slide_10.png
```

## Regla de publicación

El artifact queda en estado `pending_human_approval`.

La máquina no debe publicar automáticamente las tres versiones. El equipo debe elegir una sola versión aprobada. Esa versión, y solo esa, es la que después se envía a Blotato.

## Assets

Los assets se toman desde:

```text
assets/ialo/backgrounds/acceptance/
assets/ialo/logos/ojo ialo png.png
assets/ialo/fonts/
```

El registry central está en:

```text
templates/ialo.assets.json
```
