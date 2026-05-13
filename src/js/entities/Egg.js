import { GAME_CONFIG } from '../config/gameConfig.js';

export class Egg {
  constructor(position, duration) {
    this.x = position.x;
    this.y = position.y;
    this.radius = GAME_CONFIG.egg.radius;
    this.duration = duration;
    this.life = duration;
    this.age = 0;
  }

  update(deltaTime) {
    this.age += deltaTime;
    this.life -= deltaTime;
  }

  get isExpired() {
    return this.life <= 0;
  }

  get progress() {
    return Math.max(0, this.life / this.duration);
  }

  get isWarning() {
    return this.life <= GAME_CONFIG.egg.warningTime;
  }
}
