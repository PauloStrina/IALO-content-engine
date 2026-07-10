# IALO — Acceptance Approval Templates Lock

## Estado

La tesis `01_acceptance_inner_dialogue` queda congelada como primer template de carruseles aprobable.

## Versiones vigentes

### V01 — `v01_cinematic_sober`

Versión cinematográfica base. Queda bloqueada como referencia aprobada.

Reglas:

- No modificar geometría, layouts, jerarquía tipográfica ni lógica visual sin decisión humana explícita.
- Mantener fondos reales de la tesis.
- Mantener logo real.
- Mantener fuentes reales.
- Mantener variación editorial controlada entre slides.
- Es la versión más profunda, atmosférica y de marca.

### V02 — `v02_minimal_constant_text`

Versión minimalista alternativa.

Reglas:

- Fondo real por slide.
- Fondo más oscuro para legibilidad.
- Velo constante.
- Texto principal siempre en la misma posición.
- Texto secundario siempre en la misma posición.
- Contador arriba a la izquierda.
- Logo abajo a la izquierda.
- Sin placas editoriales, sin bloques, sin cambios fuertes de layout.

## Versiones descartadas

Estas variantes quedan fuera del flujo actual de aprobación:

- `v02_editorial_disruptive`
- `v03_hybrid_main`

## Regla de publicación

La máquina puede renderizar múltiples opciones, pero nunca publica automáticamente.

Flujo:

```text
Render approval pack
↓
Revisión humana
↓
Elegir exactamente una versión
↓
Preparar paquete publicable
↓
Enviar a Blotato
```

## Artifact vigente

```text
ialo_acceptance_approval_pack_v01_locked_v02_minimal_darker
```

## Criterio de aceptación

Al correr `Render IALO Approval Pack`, el ZIP debe entregar solamente:

```text
v01_cinematic_sober/
v02_minimal_constant_text/
approval_manifest.json
approval_contact_sheet_all_versions.png
```
