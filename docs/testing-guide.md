# Guía de checks y calidad

## Comandos principales

```sh
npm ci
npm run lint
npm run format:check
npm run build
npm run preview
```

## Qué validar siempre

- Lint correcto.
- Formato correcto.
- Build correcto.
- Juego funcional en móvil.
- Canvas responsive.
- Controles de teclado y touch.
- Assets cargando en build.
- Rutas compatibles con raíz y subruta.

## Tests de lógica

Este template no añade framework de testing para evitar dependencias innecesarias.

Añadir tests si el juego incorpora lógica compleja como:

- físicas,
- colisiones,
- generación procedural,
- niveles,
- economía,
- guardado de progreso,
- IA de enemigos,
- parsers de mapas o sprites.

Si se añaden tests, documentar:

- comando npm,
- carpeta,
- casos principales,
- integración en CI.

## Checklist para PRs

- ¿Pasa `npm run lint`?
- ¿Pasa `npm run format:check`?
- ¿Pasa `npm run build`?
- ¿No se han roto controles móviles?
- ¿No hay errores de consola?
- ¿No hay assets rotos?
- ¿La PR explica cómo probar el juego?
