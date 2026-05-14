import { GAME_CONFIG } from '../config/gameConfig.js';
import { randomBetween } from '../utils/math.js';

export class Chicken {
  constructor(position) {
    this.x = position.x;
    this.y = position.y;
    this.radius = GAME_CONFIG.chicken.radius;
    this.animationTime = randomBetween(0, 1);
    this.dangerPulse = 0;
    this.facingRight = false;
    this.#chooseDirection();
  }

  update(deltaTime, barn) {
    this.animationTime += deltaTime;
    this.turnTimer -= deltaTime;
    this.dangerPulse = Math.max(0, this.dangerPulse - deltaTime);

    if (this.turnTimer <= 0) {
      this.#chooseDirection();
    }

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    const normalizedX = (this.x - barn.centerX) / barn.radiusX;
    const normalizedY = (this.y - barn.centerY) / barn.radiusY;
    const distance = Math.hypot(normalizedX, normalizedY);

    if (distance > 1) {
      this.x = barn.centerX + (normalizedX / distance) * barn.radiusX;
      this.y = barn.centerY + (normalizedY / distance) * barn.radiusY;
      this.#chooseDirection();
    }
  }

  warn() {
    this.dangerPulse = GAME_CONFIG.effects.dangerPulseDuration;
  }

  get frameIndex() {
    return Math.floor(this.animationTime / GAME_CONFIG.chicken.animationFrameDuration);
  }

  #chooseDirection() {
    const angle = randomBetween(0, Math.PI * 2);
    const speed = randomBetween(GAME_CONFIG.chicken.speedMin, GAME_CONFIG.chicken.speedMax);

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.facingRight = this.vx > 0;
    this.turnTimer = randomBetween(
      GAME_CONFIG.chicken.turnIntervalMin,
      GAME_CONFIG.chicken.turnIntervalMax,
    );
  }
}
