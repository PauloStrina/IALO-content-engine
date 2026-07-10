# Assets necesarios para renderizar `01_acceptance_inner_dialogue / v03`

Estos son los archivos binarios que hay que subir al repositorio para que GitHub Actions pueda renderizar el carrusel.

> Nota importante: este repositorio es público. No subas fuentes comerciales o imágenes con licencia si no tenés derechos de redistribución pública. Para el MVP podemos usar fuentes fallback o mover el repo a privado.

## Ruta esperada

```text
assets/ialo/
├── logos/
│   └── IALO_Logo_5b.png
├── fonts/
│   ├── Lyon Text-Regular.woff
│   ├── LyonDisplay-Regular.woff
│   └── FuturaStd-CondensedExtraBd.woff
└── backgrounds/
    └── acceptance/
        ├── Habitacion Luz 2.jpg
        ├── Habitacion Luz 3.jpg
        ├── Habitacion Luz.jpg
        ├── Silla Lluvia 2.webp
        ├── Silla Lluvia 3.jpg
        └── Silla Lluvia.jpg
```

## Origen de los assets

Son los mismos archivos que fueron subidos a la conversación de ChatGPT para el test visual:

### Fondos

- `Habitacion Luz 2.jpg`
- `Habitacion Luz 3.jpg`
- `Habitacion Luz.jpg`
- `Silla Lluvia 2.webp`
- `Silla Lluvia 3.jpg`
- `Silla Lluvia.jpg`

### Logo

- `IALO_Logo_5b (1).png`

Al subirlo al repo, renombrarlo a:

```text
IALO_Logo_5b.png
```

### Fuentes

- `AnyConv.com__Lyon Text-Regular.woff`
- `AnyConv.com__LyonDisplay-Regular.woff`
- `AnyConv.com__FuturaStd-CondensedExtraBd.woff`

Al subirlas al repo, renombrarlas a:

```text
Lyon Text-Regular.woff
LyonDisplay-Regular.woff
FuturaStd-CondensedExtraBd.woff
```

## Cómo subirlos manualmente

1. Entrar al repo en GitHub.
2. Crear la carpeta `assets/ialo/logos/` y subir el logo.
3. Crear la carpeta `assets/ialo/backgrounds/acceptance/` y subir los 6 fondos.
4. Crear la carpeta `assets/ialo/fonts/` y subir las fuentes solo si está permitido por licencia.
5. Hacer commit en `main` o en una branch de trabajo.

## Criterio para el render

El script `v03` va a buscar los archivos en estas rutas exactas. Si cambia el nombre de un archivo, hay que actualizar el `template.config.json` o el renderer.
