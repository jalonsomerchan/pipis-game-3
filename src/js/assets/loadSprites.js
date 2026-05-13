import backgroundUrl from '../../assets/background.png';
import chickenSheetUrl from '../../assets/sprites/chicken/sheet-transparent.png';
import foxSheetUrl from '../../assets/sprites/fox/sheet-transparent.png';

const SPRITE_DEFINITIONS = {
  chicken: {
    url: chickenSheetUrl,
    frameWidth: 192,
    frameHeight: 192,
    columns: 2,
    rows: 2,
  },
  fox: {
    url: foxSheetUrl,
    frameWidth: 224,
    frameHeight: 224,
    columns: 2,
    rows: 2,
  },
};

export async function loadSprites() {
  const [background, entries] = await Promise.all([
    loadImage(backgroundUrl),
    Promise.all(
      Object.entries(SPRITE_DEFINITIONS).map(async ([name, definition]) => {
        const image = await loadImage(definition.url);

        return [
          name,
          {
            ...definition,
            image,
            frames: definition.columns * definition.rows,
          },
        ];
      }),
    ),
  ]);

  return {
    ...Object.fromEntries(entries),
    background: {
      image: background,
    },
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`No se pudo cargar el sprite: ${src}`));
    image.src = src;
  });
}
