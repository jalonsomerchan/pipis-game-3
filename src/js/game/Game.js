import { GAME_CONFIG } from '../config/gameConfig.js';
import { GameScene } from '../scenes/GameScene.js';
import { Renderer } from './Renderer.js';
import { Input } from './Input.js';
import { readNumber, writeNumber } from '../utils/storage.js';

export class Game {
  #animationFrame = null;
  #lastTime = 0;
  #isRunning = false;

  constructor({ canvas, scoreElement, bestScoreElement, overlayElement, playButton }) {
    this.renderer = new Renderer(canvas, GAME_CONFIG.canvas);
    this.input = new Input(canvas);
    this.scoreElement = scoreElement;
    this.bestScoreElement = bestScoreElement;
    this.overlayElement = overlayElement;
    this.playButton = playButton;
    this.bestScore = readNumber(GAME_CONFIG.storage.bestScoreKey);
    this.scene = new GameScene({ input: this.input, onScore: (score) => this.#setScore(score) });

    this.#bindEvents();
    this.#setScore(0);
    this.#setBestScore(this.bestScore);
    this.scene.render(this.renderer);
  }

  start() {
    this.scene.reset();
    this.overlayElement.hidden = true;
    this.#isRunning = true;
    this.#lastTime = performance.now();
    this.#animationFrame = requestAnimationFrame((time) => this.#tick(time));
  }

  stop() {
    this.#isRunning = false;

    if (this.#animationFrame) {
      cancelAnimationFrame(this.#animationFrame);
    }
  }

  #tick(time) {
    if (!this.#isRunning) return;

    const deltaTime = Math.min((time - this.#lastTime) / 1000, 0.05);
    this.#lastTime = time;

    this.scene.update(deltaTime);
    this.scene.render(this.renderer);

    this.#animationFrame = requestAnimationFrame((nextTime) => this.#tick(nextTime));
  }

  #bindEvents() {
    this.playButton.addEventListener('click', () => this.start());
    window.addEventListener('blur', () => this.stop());
  }

  #setScore(score) {
    this.scoreElement.textContent = String(score);

    if (score > this.bestScore) {
      this.bestScore = score;
      writeNumber(GAME_CONFIG.storage.bestScoreKey, score);
      this.#setBestScore(score);
    }
  }

  #setBestScore(score) {
    this.bestScoreElement.textContent = String(score);
  }
}
