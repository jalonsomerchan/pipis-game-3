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
- Puntuación y récord local con `localStorage`.
- Estructura modular preparada para escenas, entidades, assets y configuración.
- Compatible con móvil y escritorio.

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

## Lint

```bash
npm run lint
```

## Formato

```bash
npm run format:check
npm run format
```

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
    │   └── gameConfig.js
    ├── game/
    │   ├── Game.js
    │   ├── Input.js
    │   └── Renderer.js
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
