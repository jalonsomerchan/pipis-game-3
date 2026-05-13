# Game Template

Template moderno para crear juegos HTML5 con JavaScript puro, Canvas, Vite y Tailwind CSS.

## Stack

- Vite
- JavaScript ES Modules
- Canvas 2D
- Tailwind CSS v4
- ESLint
- Prettier
- GitHub Actions

## Características

- Demo jugable con canvas.
- Game loop con `requestAnimationFrame`.
- Separación entre `update` y `render`.
- Renderer con escalado Retina.
- Input centralizado para teclado, pointer y touch.
- Modos de juego configurables: 10 Pipis, supervivencia, contrarreloj, combo, oleadas, fiebre, un solo pipi, noche y pacífico.
- Puntuación y récord local con `localStorage`.
- Estructura modular preparada para escenas, entidades, assets y configuración.
- Compatible con móvil y escritorio.

## Modos de juego

La configuración central vive en `src/js/config/gameModes.js` y las reglas reutilizables en
`src/js/modes/modeRules.js`. `GameScene` usa esos helpers sin duplicar el game loop por modo.

Modos disponibles:

- **Hasta conseguir 10 pipis**: victoria al incubar 10 huevos.
- **Supervivencia**: aguantar el máximo tiempo posible; guarda mejor tiempo local.
- **Contrarreloj**: conseguir el máximo de Pipis en 60 segundos.
- **Combo**: encadenar huevos y sustos para mantener racha y multiplicador.
- **Oleadas de zorros**: superar oleadas progresivas con límites de zorros simultáneos.
- **Fiebre**: partida corta de 30 segundos con más huevos, más ritmo y puntuación propia.
- **Un solo pipi**: empieza con una sola Pipi y termina al primer daño.
- **Noche**: reduce la visibilidad con un overlay accesible y compensa con más puntos.
- **Pacífico**: modo sin zorros con tiempo límite para recoger huevos a tu ritmo.

Para ajustar objetivos, tiempos, multiplicadores, oleadas o límites, edita `gameModes.js`.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Build para GitHub Pages

El workflow de Pages ejecuta el build con `GITHUB_PAGES=true` para publicar el juego bajo la subruta del repositorio:

```bash
GITHUB_PAGES=true npm run build
```

La URL pública esperada es:

```txt
https://jalonsomerchan.github.io/pipis-game-3/
```

## Lint

```bash
npm run lint
```

## Formato

```bash
npm run format:check
npm run format
```

## Checks smoke

```bash
npm run check:balance
npm run check:feedback
npm run check:modes
```

`check:modes` valida la configuración mínima de cada modo, límites de entidades, duraciones, reglas especiales de modos extra y que la escena pueda inicializarse y reiniciarse con cada combinación de modo y dificultad.

## Estructura

```txt
src/
├── assets/
│   ├── backgrounds/
│   ├── sounds/
│   └── sprites/
├── css/
│   └── main.css
└── js/
    ├── app.js
    ├── config/
    │   ├── gameConfig.js
    │   └── gameModes.js
    ├── game/
    │   ├── Game.js
    │   ├── Input.js
    │   └── Renderer.js
    ├── modes/
    │   └── modeRules.js
    ├── scenes/
    │   └── GameScene.js
    └── utils/
        ├── math.js
        └── storage.js
```

## Documentación para agentes IA

- `AGENTS.md`: reglas obligatorias para agentes, issues, PRs y cambios de código.
- `docs/game-architecture.md`: arquitectura recomendada para juegos.
- `docs/assets-guide.md`: sprites, sonidos, fondos y carga de recursos.
- `docs/input-guide.md`: teclado, touch, pointer y swipe.
- `docs/deployment-guide.md`: despliegue en raíz, subruta y GitHub Pages.
- `docs/testing-guide.md`: checks de lint, formato, build y calidad.

## Cómo empezar un juego nuevo

1. Ajusta constantes en `src/js/config/gameConfig.js`.
2. Crea entidades en `src/js/entities/` si hacen falta.
3. Añade escenas en `src/js/scenes/`.
4. Añade sprites, fondos y sonidos en `src/assets/`.
5. Mantén `src/js/app.js` solo como inicializador.

## Licencia

MIT
