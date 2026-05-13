# Guía de despliegue

## Objetivo

El juego debe funcionar tanto en raíz de dominio como en subruta.

Ejemplos:

```txt
https://example.com/
https://example.com/juego/
https://usuario.github.io/nombre-repo/
```

## Vite y base

Vite permite configurar la base pública del build en `vite.config.js`.

Para raíz:

```js
base: '/';
```

Para subruta:

```js
base: '/nombre-repo/';
```

Si se añade una variable de entorno, documentarla en README y en esta guía.

## Rutas

Evitar rutas absolutas duras cuando el juego pueda desplegarse en subruta.

Evitar:

```html
<script type="module" src="/src/js/app.js"></script>
<img src="/src/assets/player.png" alt="" />
```

Preferir rutas relativas o imports gestionados por Vite.

## Canvas y viewport

- Usar `viewport-fit=cover` si el juego se orienta a móvil.
- Evitar scroll accidental.
- Probar tamaños pequeños y grandes.
- Mantener el canvas adaptable al contenedor.

## GitHub Pages

Si se añade workflow de deploy:

1. `npm ci`
2. `npm run lint`
3. `npm run format:check`
4. `npm run build`
5. desplegar `dist/`

## Checklist

- ¿Funciona en `/`?
- ¿Funciona en `/nombre-repo/`?
- ¿El canvas ocupa bien la pantalla?
- ¿Los assets cargan en build?
- ¿No hay rutas absolutas duras problemáticas?
- ¿El build genera `dist/`?
