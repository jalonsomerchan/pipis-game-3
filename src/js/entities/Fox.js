import { GAME_CONFIG } from '../config/gameConfig.js';
import { getDistance, moveTowards } from '../utils/math.js';

export class Fox {
  constructor(position, speed) {
    this.x = position.x;
    this.y = position.y;
    this.radius = GAME_CONFIG.fox.radius;
    this.speed = speed;
    this.animationTime = 0;
    this.fleeTimer = 0;
    this.wasScared = false;
    this.flipX = position.x > GAME_CONFIG.canvas.width / 2;
  }

  update(deltaTime, chickens) {
    this.animationTime += deltaTime;

    if (this.fleeTimer > 0) {
      this.fleeTimer -= deltaTime;
      this.y -= this.speed * 1.4 * deltaTime;

      return;
    }

    const target = this.#findTarget(chickens);
    if (!target) return;

    this.flipX = target.x < this.x;
    const next = moveTowards(this, target, this.speed * deltaTime);
    this.x = next.x;
    this.y = next.y;

    if (getDistance(this, target) < GAME_CONFIG.fox.eatRadius) {
      target.warn();
      this.eatenTarget = target;
    }
  }

  scare() {
    this.wasScared = true;
    this.fleeTimer = GAME_CONFIG.fox.fleeDuration;
  }

  get isGone() {
    return this.wasScared && this.fleeTimer <= 0;
  }

  get frameIndex() {
    return Math.floor(this.animationTime / GAME_CONFIG.fox.animationFrameDuration);
  }

  #findTarget(chickens) {
    let bestChicken = null;
    let bestDistance = Infinity;

    for (const chicken of chickens) {
      const distance = getDistance(this, chicken);

      if (distance < bestDistance) {
        bestChicken = chicken;
        bestDistance = distance;
      }
    }

    return bestChicken;
  }
}
