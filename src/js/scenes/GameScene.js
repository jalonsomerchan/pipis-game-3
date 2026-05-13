import { GAME_CONFIG } from '../config/gameConfig.js';
import { clamp, getDistance, randomBetween } from '../utils/math.js';

export class GameScene {
  constructor({ input, onScore }) {
    this.input = input;
    this.onScore = onScore;
    this.reset();
  }

  reset() {
    this.score = 0;
    this.player = {
      x: GAME_CONFIG.canvas.width / 2,
      y: GAME_CONFIG.canvas.height * 0.72,
      radius: GAME_CONFIG.player.radius,
    };
    this.star = this.#createStar();
    this.onScore(this.score);
  }

  update(deltaTime) {
    this.#movePlayer(deltaTime);

    if (getDistance(this.player, this.star) < this.player.radius + this.star.radius) {
      this.score += 1;
      this.star = this.#createStar();
      this.onScore(this.score);
    }
  }

  render(renderer) {
    renderer.clear();
    renderer.drawText('Teclado, swipe o arrastra para moverte', GAME_CONFIG.canvas.width / 2, 48);
    renderer.drawCircle({
      ...this.star,
      color: GAME_CONFIG.star.color,
      shadowColor: '#facc15',
    });
    renderer.drawCircle({
      ...this.player,
      color: GAME_CONFIG.player.color,
      shadowColor: '#22d3ee',
    });
  }

  #movePlayer(deltaTime) {
    const pointer = this.input.pointer;

    if (pointer) {
      this.player.x += (pointer.x - this.player.x) * 0.16;
      this.player.y += (pointer.y - this.player.y) * 0.16;
    } else {
      const direction = this.input.direction;
      this.player.x += direction.x * GAME_CONFIG.player.speed * deltaTime;
      this.player.y += direction.y * GAME_CONFIG.player.speed * deltaTime;
    }

    this.player.x = clamp(
      this.player.x,
      this.player.radius,
      GAME_CONFIG.canvas.width - this.player.radius,
    );
    this.player.y = clamp(
      this.player.y,
      this.player.radius,
      GAME_CONFIG.canvas.height - this.player.radius,
    );
  }

  #createStar() {
    return {
      x: randomBetween(48, GAME_CONFIG.canvas.width - 48),
      y: randomBetween(96, GAME_CONFIG.canvas.height - 96),
      radius: GAME_CONFIG.star.radius,
    };
  }
}
