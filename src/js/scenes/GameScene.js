import { GAME_CONFIG } from '../config/gameConfig.js';
import { Chicken } from '../entities/Chicken.js';
import { Egg } from '../entities/Egg.js';
import { Fox } from '../entities/Fox.js';
import { getDistance, randomBetween, randomInt } from '../utils/math.js';

export class GameScene {
  constructor({ input, sprites, onStats, onGameOver }) {
    this.input = input;
    this.sprites = sprites;
    this.onStats = onStats;
    this.onGameOver = onGameOver;
  }

  reset(levelKey) {
    this.levelKey = levelKey;
    this.level = GAME_CONFIG.levels[levelKey];
    this.elapsedTime = 0;
    this.foxTimer = 1.2;
    this.eggTimer = this.level.eggSpawnInterval * 0.72;
    this.chickens = [];
    this.eggs = [];
    this.foxes = [];
    this.effects = [];
    this.isFinished = false;

    for (let index = 0; index < this.level.initialChickens; index += 1) {
      this.#addChicken();
    }

    this.#emitStats();
  }

  update(deltaTime) {
    if (this.isFinished) return;

    this.elapsedTime += deltaTime;
    this.#handleScares();
    this.#updateSpawns(deltaTime);

    const barn = this.#barnBounds();
    this.chickens.forEach((chicken) => chicken.update(deltaTime, barn));
    this.eggs.forEach((egg) => egg.update(deltaTime));
    this.foxes.forEach((fox) => fox.update(deltaTime, this.chickens));
    this.#resolveEatenChickens();
    this.#updateEffects(deltaTime);

    this.eggs = this.eggs.filter((egg) => !egg.isExpired);
    this.foxes = this.foxes.filter((fox) => !fox.isGone);

    if (this.chickens.length <= 0) {
      this.isFinished = true;
      this.onGameOver(this.elapsedTime);
    }

    this.#emitStats();
  }

  render(renderer) {
    renderer.clear();
    renderer.drawBackground(this.sprites.background.image);

    for (const egg of this.eggs) {
      renderer.drawEgg(egg);
    }

    for (const chicken of this.chickens) {
      if (chicken.dangerPulse > 0) {
        renderer.drawDangerPulse(chicken, GAME_CONFIG.effects.dangerPulseDuration);
      }

      renderer.drawSprite(this.sprites.chicken, chicken.x, chicken.y, 92, chicken.frameIndex);
    }

    for (const fox of this.foxes) {
      renderer.drawSprite(this.sprites.fox, fox.x, fox.y, 112, fox.frameIndex, {
        flipX: fox.flipX,
        alpha: fox.wasScared ? 0.72 : 1,
      });
    }

    this.effects.forEach((effect) => renderer.drawScareEffect(effect));
    renderer.drawHud({
      time: this.elapsedTime,
      chickens: this.chickens.length,
      eggs: this.eggs.length,
      foxes: this.foxes.length,
      levelLabel: this.level.label,
    });
  }

  #handleScares() {
    const taps = this.input.consumeTaps();

    for (const tap of taps) {
      if (this.#hatchEggAt(tap)) continue;

      this.#scareFoxAt(tap);
    }

    if (this.input.consumeKeyboardScare()) {
      const fox = this.#nearestFox({
        x: GAME_CONFIG.canvas.width / 2,
        y: GAME_CONFIG.canvas.height / 2,
      });

      if (fox) this.#scareFox(fox);
    }
  }

  #scareFoxAt(tap) {
    const fox = this.#nearestFox(tap);
    if (!fox || getDistance(tap, fox) > GAME_CONFIG.fox.scareRadius) return;

    this.#scareFox(fox);
  }

  #scareFox(fox) {
    fox.scare();
    this.effects.push({
      x: fox.x,
      y: fox.y,
      life: GAME_CONFIG.effects.scareDuration,
      duration: GAME_CONFIG.effects.scareDuration,
    });
  }

  #hatchEggAt(tap) {
    const egg = this.#nearestEgg(tap);
    if (!egg || getDistance(tap, egg) > GAME_CONFIG.egg.hatchRadius) return false;

    this.eggs = this.eggs.filter((candidate) => candidate !== egg);
    this.chickens.push(new Chicken({ x: egg.x, y: egg.y + 10 }));
    this.effects.push({
      type: 'hatch',
      x: egg.x,
      y: egg.y,
      life: GAME_CONFIG.effects.hatchDuration,
      duration: GAME_CONFIG.effects.hatchDuration,
    });

    return true;
  }

  #nearestEgg(point) {
    let bestEgg = null;
    let bestDistance = Infinity;

    for (const egg of this.eggs) {
      const distance = getDistance(point, egg);
      if (distance < bestDistance) {
        bestEgg = egg;
        bestDistance = distance;
      }
    }

    return bestEgg;
  }

  #nearestFox(point) {
    let bestFox = null;
    let bestDistance = Infinity;

    for (const fox of this.foxes) {
      if (fox.wasScared) continue;

      const distance = getDistance(point, fox);
      if (distance < bestDistance) {
        bestFox = fox;
        bestDistance = distance;
      }
    }

    return bestFox;
  }

  #updateSpawns(deltaTime) {
    this.foxTimer -= deltaTime;
    this.eggTimer -= deltaTime;

    if (this.foxTimer <= 0) {
      this.#spawnFox();
      this.foxTimer = this.#currentFoxSpawnInterval();
    }

    if (this.eggTimer <= 0) {
      this.#spawnEgg();
      this.eggTimer = this.#currentEggSpawnInterval();
    }
  }

  #spawnFox() {
    if (this.foxes.length >= this.#currentMaxFoxes()) return;

    this.foxes.push(new Fox(this.#randomEdgePosition(), this.#currentFoxSpeed()));
  }

  #addChicken() {
    this.chickens.push(new Chicken(this.#randomBarnPosition(0.72)));
  }

  #spawnEgg() {
    this.eggs.push(new Egg(this.#randomBarnPosition(0.78), this.#currentEggDuration()));
  }

  #randomBarnPosition(spread) {
    const barn = this.#barnBounds();
    const angle = randomBetween(0, Math.PI * 2);
    const distance = Math.sqrt(Math.random());

    return {
      x: barn.centerX + Math.cos(angle) * barn.radiusX * distance * spread,
      y: barn.centerY + Math.sin(angle) * barn.radiusY * distance * spread,
    };
  }

  #resolveEatenChickens() {
    const eaten = new Set(this.foxes.map((fox) => fox.eatenTarget).filter(Boolean));
    if (eaten.size <= 0) return;

    this.chickens = this.chickens.filter((chicken) => !eaten.has(chicken));

    for (const fox of this.foxes) {
      if (fox.eatenTarget) {
        fox.scare();
        fox.eatenTarget = null;
      }
    }
  }

  #updateEffects(deltaTime) {
    for (const effect of this.effects) {
      effect.life -= deltaTime;
    }

    this.effects = this.effects.filter((effect) => effect.life > 0);
  }

  #currentFoxSpawnInterval() {
    const minutes = this.elapsedTime / 60;
    const multiplier = 1 + minutes * GAME_CONFIG.difficultyRamp.foxSpawnIntervalReductionPerMinute;

    return Math.max(0.82, this.level.foxSpawnInterval / multiplier);
  }

  #currentEggSpawnInterval() {
    const minutes = this.elapsedTime / 60;
    const multiplier = 1 + minutes * GAME_CONFIG.difficultyRamp.eggSpawnDelayIncreasePerMinute;

    return this.level.eggSpawnInterval * multiplier;
  }

  #currentEggDuration() {
    const minutes = this.elapsedTime / 60;
    const multiplier = 1 + minutes * GAME_CONFIG.difficultyRamp.eggDurationReductionPerMinute;

    return Math.max(3.2, GAME_CONFIG.egg.duration / multiplier);
  }

  #currentFoxSpeed() {
    const minutes = this.elapsedTime / 60;
    const multiplier = 1 + minutes * GAME_CONFIG.difficultyRamp.foxSpeedIncreasePerMinute;

    return this.level.foxBaseSpeed * multiplier;
  }

  #currentMaxFoxes() {
    const minutes = Math.floor(this.elapsedTime / 60);

    return this.level.maxFoxes + minutes * GAME_CONFIG.difficultyRamp.maxFoxesIncreasePerMinute;
  }

  #randomEdgePosition() {
    const side = randomInt(0, 3);
    const margin = GAME_CONFIG.fox.spawnMargin;

    if (side === 0) return { x: randomBetween(0, GAME_CONFIG.canvas.width), y: -margin };
    if (side === 1) {
      return {
        x: GAME_CONFIG.canvas.width + margin,
        y: randomBetween(120, GAME_CONFIG.canvas.height - 140),
      };
    }
    if (side === 2) {
      return {
        x: randomBetween(0, GAME_CONFIG.canvas.width),
        y: GAME_CONFIG.canvas.height + margin,
      };
    }

    return { x: -margin, y: randomBetween(120, GAME_CONFIG.canvas.height - 140) };
  }

  #barnBounds() {
    return {
      centerX: GAME_CONFIG.barn.centerX,
      centerY: GAME_CONFIG.barn.centerY,
      radiusX: GAME_CONFIG.barn.radiusX - GAME_CONFIG.barn.fencePadding,
      radiusY: GAME_CONFIG.barn.radiusY - GAME_CONFIG.barn.fencePadding,
    };
  }

  #emitStats() {
    this.onStats({
      time: this.elapsedTime,
      chickens: this.chickens.length,
      eggs: this.eggs.length,
      foxes: this.foxes.length,
      levelLabel: this.level.label,
    });
  }
}
