import { loadSprites } from '../assets/loadSprites.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { GameScene } from '../scenes/GameScene.js';
import { readNumber, writeNumber } from '../utils/storage.js';
import { Input } from './Input.js';
import { Renderer } from './Renderer.js';

export class Game {
  #animationFrame = null;
  #lastTime = 0;
  #isRunning = false;

  constructor(elements) {
    this.elements = elements;
    this.renderer = new Renderer(elements.canvas, GAME_CONFIG.canvas);
    this.input = new Input(elements.canvas);
    this.bestTime = readNumber(GAME_CONFIG.storage.bestTimeKey);

    this.#bindEvents();
    this.#showLoading();
    this.#load();
  }

  async #load() {
    try {
      const startedAt = performance.now();
      this.sprites = await loadSprites();
      const elapsed = performance.now() - startedAt;
      const remaining = Math.max(0, GAME_CONFIG.loading.minDuration - elapsed);

      window.setTimeout(() => {
        this.scene = new GameScene({
          input: this.input,
          sprites: this.sprites,
          onStats: (stats) => this.#setStats(stats),
          onGameOver: (time) => this.#finish(time),
        });
        this.#renderIdleScene();
        this.#showMenu();
      }, remaining);
    } catch {
      this.elements.loadingTitle.textContent = 'No se pudieron cargar los sprites';
    }
  }

  startLevel(levelKey) {
    if (!this.scene) return;

    this.stop();
    this.scene.reset(levelKey);
    this.elements.overlay.hidden = true;
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
    this.elements.playButton.addEventListener('click', () => this.#showLevelSelect());
    this.elements.shareButton.addEventListener('click', () => {
      this.#share();
    });

    this.elements.levelButtons.forEach((button) => {
      button.addEventListener('click', () => this.startLevel(button.dataset.level));
    });

    this.elements.backButton.addEventListener('click', () => this.#showMenu());
    this.elements.retryButton.addEventListener('click', () => this.#showLevelSelect());
    this.elements.menuButton.addEventListener('click', () => this.#showMenu());
    window.addEventListener('blur', () => {
      if (this.#isRunning) this.stop();
    });
  }

  #finish(time) {
    this.stop();

    if (time > this.bestTime) {
      this.bestTime = time;
      writeNumber(GAME_CONFIG.storage.bestTimeKey, time);
    }

    this.elements.resultTime.textContent = this.renderer.formatTime(time);
    this.elements.bestTime.textContent = this.renderer.formatTime(this.bestTime);
    this.#setOverlayMode('results');
  }

  #setStats({ time = 0, chickens = 0, eggs = 0, foxes = 0, levelLabel = '-' }) {
    this.elements.time.textContent = this.renderer.formatTime(time);
    this.elements.chickens.textContent = String(chickens);
    this.elements.eggs.textContent = String(eggs);
    this.elements.foxes.textContent = String(foxes);
    this.elements.level.textContent = levelLabel;
  }

  #renderIdleScene() {
    this.renderer.clear();
    this.renderer.drawBackground(this.sprites?.background.image);
  }

  #showLoading() {
    this.#setOverlayMode('loading');
    this.#setStats({ levelLabel: 'Cargando' });
  }

  #showMenu() {
    this.stop();
    this.#renderIdleScene();
    this.#setOverlayMode('menu');
  }

  #showLevelSelect() {
    this.#setOverlayMode('levels');
  }

  async #share() {
    const text = `He protegido el gallinero durante ${this.renderer.formatTime(this.bestTime)}.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Gallinas vs Zorros',
          text,
        });

        return;
      }

      await navigator.clipboard?.writeText(text);
      this.elements.shareButton.textContent = 'Copiado';
      window.setTimeout(() => {
        this.elements.shareButton.textContent = 'Compartir';
      }, 1400);
    } catch {
      this.elements.shareButton.textContent = 'Compartir';
    }
  }

  #setOverlayMode(mode) {
    this.elements.overlay.hidden = false;
    this.elements.overlay.dataset.mode = mode;

    for (const panel of this.elements.panels) {
      panel.hidden = panel.dataset.panel !== mode;
    }
  }
}
