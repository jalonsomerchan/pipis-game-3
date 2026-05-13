import { GAME_CONFIG } from '../config/gameConfig.js';
import { getDifficultyMetrics } from '../config/difficultyCurves.js';
import { Chicken } from '../entities/Chicken.js';
import { Egg } from '../entities/Egg.js';
import { Fox } from '../entities/Fox.js';
import { getDistance, randomBetween, randomInt } from '../utils/math.js';

const TUTORIAL_STEPS = {
  intro: 'intro',
  fox: 'fox',
  egg: 'egg',
  expire: 'expire',
  done: 'done',
};

export class GameScene {
  constructor({ input, sprites, onStats, onGameOver, onTutorialComplete, onFeedback }) {
    this.input = input;
    this.sprites = sprites;
    this.onStats = onStats;
    this.onGameOver = onGameOver;
    this.onTutorialComplete = onTutorialComplete;
    this.onFeedback = onFeedback;
  }

  reset(levelKey) {
    this.mode = 'game';
    this.levelKey = levelKey;
    this.level = GAME_CONFIG.levels[levelKey];
    this.elapsedTime = 0;
    this.foxTimer = this.level.firstFoxDelay;
    this.eggTimer = this.level.firstEggDelay;
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

  resetTutorial() {
    this.mode = 'tutorial';
    this.level = { label: 'Tutorial' };
    this.elapsedTime = 0;
    this.foxTimer = Infinity;
    this.eggTimer = Infinity;
    this.chickens = [
      new Chicken({ x: 210, y: 610 }),
      new Chicken({ x: 295, y: 650 }),
      new Chicken({ x: 250, y: 735 }),
    ];
    this.eggs = [];
    this.foxes = [];
    this.effects = [];
    this.isFinished = false;
    this.tutorialStep = TUTORIAL_STEPS.intro;
    this.tutorialTimer = 0;
    this.tutorialMessage =
      'Estas son tus Pipis. Son tus gallinas: protégelas para aguantar el mayor tiempo posible.';
    this.#emitStats();
  }

  update(deltaTime) {
    if (this.isFinished) return;

    this.elapsedTime += deltaTime;

    if (this.mode === 'tutorial') {
      this.#updateTutorial(deltaTime);
      this.#emitStats();
      return;
    }

    this.#handleActions();
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
      this.#queueFeedback('gameOver', GAME_CONFIG.canvas.width / 2, GAME_CONFIG.canvas.height / 2);
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

    if (this.mode === 'tutorial') {
      renderer.drawTutorialMessage(this.tutorialMessage);
    }
  }

  #updateTutorial(deltaTime) {
    this.tutorialTimer += deltaTime;
    const actions = this.#handleActions();
    const barn = this.#barnBounds();

    this.chickens.forEach((chicken) => chicken.update(deltaTime, barn));
    this.eggs.forEach((egg) => egg.update(deltaTime));
    this.foxes.forEach((fox) => {
      fox.animationTime += deltaTime;
    });
    this.#updateEffects(deltaTime);

    if (this.tutorialStep === TUTORIAL_STEPS.intro && this.tutorialTimer > 3.2) {
      this.tutorialStep = TUTORIAL_STEPS.fox;
      this.tutorialTimer = 0;
      this.foxes = [new Fox({ x: 318, y: 560 }, 0)];
      this.tutorialMessage = '¡Zorro a la vista! Tócalo justo encima para espantarlo.';
    }

    if (this.tutorialStep === TUTORIAL_STEPS.fox && actions.scared > 0) {
      this.tutorialStep = TUTORIAL_STEPS.egg;
      this.tutorialTimer = 0;
      this.foxes = [];
      this.eggs = [new Egg({ x: 282, y: 690 }, 10)];
      this.tutorialMessage =
        'Buen toque. Ahora toca el huevo antes de que se enfríe: dará una Pipi nueva.';
    }

    if (this.tutorialStep === TUTORIAL_STEPS.egg && actions.hatched > 0) {
      this.tutorialStep = TUTORIAL_STEPS.expire;
      this.tutorialTimer = 0;
      this.eggs = [new Egg({ x: 350, y: 720 }, 3)];
      this.tutorialMessage = 'Perfecto. Si no tocas un huevo a tiempo, desaparece. Mira este.';
    }

    if (this.tutorialStep === TUTORIAL_STEPS.expire && this.eggs.every((egg) => egg.isExpired)) {
      this.eggs = [];
      this.tutorialStep = TUTORIAL_STEPS.done;
      this.tutorialTimer = 0;
      this.tutorialMessage =
        'La partida termina cuando no queda ninguna Pipi. Ya sabes lo esencial: toca zorros y huevos.';
    }

    if (this.tutorialStep === TUTORIAL_STEPS.done && this.tutorialTimer > 3.4) {
      this.isFinished = true;
      this.#queueFeedback('mission', GAME_CONFIG.canvas.width / 2, 710);
      this.onTutorialComplete();
    }
  }

  #handleActions() {
    const actions = {
      hatched: 0,
      scared: 0,
    };
    const taps = this.input.consumeTaps();

    for (const tap of taps) {
      if (this.#hatchEggAt(tap)) {
        actions.hatched += 1;
        continue;
      }

      if (this.#scareFoxAt(tap)) actions.scared += 1;
    }

    if (this.input.consumeKeyboardScare()) {
      const fox = this.#nearestFox({
        x: GAME_CONFIG.canvas.width / 2,
        y: GAME_CONFIG.canvas.height / 2,
      });

      if (fox) {
        this.#scareFox(fox);
        actions.scared += 1;
      }
    }

    return actions;
  }

  #scareFoxAt(tap) {
    const fox = this.#nearestFox(tap);
    if (!fox || getDistance(tap, fox) > GAME_CONFIG.fox.scareRadius) return false;

    this.#scareFox(fox);
    return true;
  }

  #scareFox(fox) {
    fox.scare();
    this.effects.push({
      type: 'scare',
      x: fox.x,
      y: fox.y,
      life: GAME_CONFIG.effects.scareDuration,
      duration: GAME_CONFIG.effects.scareDuration,
    });
    this.#queueFeedback('scare', fox.x, fox.y);
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
    this.#queueFeedback('hatch', egg.x, egg.y);

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
      this.foxTimer = this.#difficultyMetrics().foxSpawnInterval;
    }

    if (this.eggTimer <= 0) {
      this.#spawnEgg();
      this.eggTimer = this.#difficultyMetrics().eggSpawnInterval;
    }
  }

  #spawnFox() {
    const metrics = this.#difficultyMetrics();
    if (this.foxes.length >= metrics.maxFoxes) return;

    this.foxes.push(new Fox(this.#randomEdgePosition(), metrics.foxSpeed));
  }

  #addChicken() {
    this.chickens.push(new Chicken(this.#randomBarnPosition(0.72)));
  }

  #spawnEgg() {
    this.eggs.push(new Egg(this.#randomBarnPosition(0.78), this.#difficultyMetrics().eggDuration));
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

    const lostChickens = this.chickens.filter((chicken) => eaten.has(chicken));
    this.chickens = this.chickens.filter((chicken) => !eaten.has(chicken));

    for (const chicken of lostChickens) {
      this.effects.push({
        type: 'lost',
        x: chicken.x,
        y: chicken.y,
        life: GAME_CONFIG.effects.lostDuration,
        duration: GAME_CONFIG.effects.lostDuration,
      });
      this.#queueFeedback('lost', chicken.x, chicken.y);
    }

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

  #difficultyMetrics() {
    return getDifficultyMetrics(this.level, this.elapsedTime);
  }

  #queueFeedback(type, x, y) {
    this.onFeedback?.({ type, x, y });
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
