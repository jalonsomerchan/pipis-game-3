import { loadSprites } from '../assets/loadSprites.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { GameScene } from '../scenes/GameScene.js';
import { readNumber, writeNumber } from '../utils/storage.js';
import { Feedback } from './Feedback.js';
import { Input } from './Input.js';
import { Renderer } from './Renderer.js';

export class Game {
  #animationFrame = null;
  #lastTime = 0;
  #isRunning = false;
  #mode = 'loading';

  constructor(elements) {
    this.elements = elements;
    this.renderer = new Renderer(elements.canvas, GAME_CONFIG.canvas);
    this.input = new Input(elements.canvas);
    this.feedback = new Feedback();
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
          onTutorialComplete: () => this.#finishTutorial(),
          onFeedback: (event) => this.#handleFeedback(event),
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

    this.feedback.prime();
    this.stop();
    this.scene.reset(levelKey);
    this.elements.overlay.hidden = true;
    this.elements.pauseButton.hidden = false;
    this.#mode = 'playing';
    this.#isRunning = true;
    this.#lastTime = performance.now();
    this.#animationFrame = requestAnimationFrame((time) => this.#tick(time));
  }

  startTutorial() {
    if (!this.scene) return;

    this.feedback.prime();
    this.stop();
    this.scene.resetTutorial();
    this.elements.overlay.hidden = true;
    this.elements.pauseButton.hidden = false;
    this.#mode = 'tutorial-playing';
    this.#isRunning = true;
    this.#lastTime = performance.now();
    this.#animationFrame = requestAnimationFrame((time) => this.#tick(time));
  }

  resume() {
    if (!this.scene || !this.#mode.startsWith('paused')) return;

    this.feedback.prime();
    this.elements.overlay.hidden = true;
    this.elements.pauseButton.hidden = false;
    this.#mode = this.#mode === 'paused-tutorial' ? 'tutorial-playing' : 'playing';
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

    if (this.input.consumePause()) {
      this.#pause();
      return;
    }

    this.scene.update(deltaTime);
    this.scene.render(this.renderer);

    this.#animationFrame = requestAnimationFrame((nextTime) => this.#tick(nextTime));
  }

  #bindEvents() {
    this.elements.playButton.addEventListener('click', () => this.#showLevelSelect());
    this.elements.tutorialButton.addEventListener('click', () => this.startTutorial());
    this.elements.tutorialDonePlayButton.addEventListener('click', () => this.#showLevelSelect());
    this.elements.tutorialDoneMenuButton.addEventListener('click', () => this.#showMenu());
    this.elements.shareButton.addEventListener('click', () => {
      this.#share();
    });

    this.elements.levelButtons.forEach((button) => {
      button.addEventListener('click', () => this.startLevel(button.dataset.level));
    });

    this.elements.backButton.addEventListener('click', () => this.#showMenu());
    this.elements.retryButton.addEventListener('click', () => this.#showLevelSelect());
    this.elements.menuButton.addEventListener('click', () => this.#showMenu());
    this.elements.pauseButton.addEventListener('click', () => this.#pause());
    this.elements.resumeButton.addEventListener('click', () => this.resume());
    this.elements.pauseTutorialButton.addEventListener('click', () => this.startTutorial());
    this.elements.quitButton.addEventListener('click', () => this.#showMenu());
    window.addEventListener('blur', () => {
      if (this.#isPlayingMode()) this.#pause();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.#isPlayingMode()) this.#pause();
    });
  }

  #finish(time) {
    this.stop();

    const isRecord = time > this.bestTime;
    if (isRecord) {
      this.bestTime = time;
      writeNumber(GAME_CONFIG.storage.bestTimeKey, time);
      this.#handleFeedback({ type: 'record' });
      this.#announce('¡Nuevo récord de supervivencia!');
    }

    this.elements.resultTime.textContent = this.renderer.formatTime(time);
    this.elements.bestTime.textContent = this.renderer.formatTime(this.bestTime);
    this.elements.pauseButton.hidden = true;
    this.#mode = 'results';
    this.#setOverlayMode('results', isRecord ? 'record' : 'game-over');
  }

  #setStats() {
    // Stats are rendered in-canvas so the game can run fullscreen without an external top bar.
  }

  #handleFeedback({ type }) {
    this.feedback.play(type);
    this.#announce(this.#feedbackMessage(type));
  }

  #feedbackMessage(type) {
    const messages = {
      scare: 'Zorro espantado.',
      hatch: 'Huevo incubado. Nueva Pipi.',
      lost: 'Has perdido una Pipi.',
      mission: 'Tutorial completado.',
      record: 'Nuevo récord.',
      gameOver: 'Fin de la partida.',
    };

    return messages[type] ?? '';
  }

  #announce(message) {
    if (!this.elements.feedbackStatus || !message) return;

    this.elements.feedbackStatus.textContent = message;
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
    this.elements.pauseButton.hidden = true;
    this.#mode = 'menu';
    this.#setOverlayMode('menu');
  }

  #showLevelSelect() {
    this.elements.pauseButton.hidden = true;
    this.#mode = 'levels';
    this.#setOverlayMode('levels');
  }

  #pause() {
    if (!this.#isPlayingMode()) return;

    this.stop();
    this.elements.pauseButton.hidden = true;
    this.#mode = this.#mode === 'tutorial-playing' ? 'paused-tutorial' : 'paused';
    this.#setOverlayMode('pause');
  }

  #finishTutorial() {
    this.stop();
    this.elements.pauseButton.hidden = true;
    this.#mode = 'tutorial-done';
    this.#setOverlayMode('tutorialDone', 'mission');
  }

  #isPlayingMode() {
    return this.#mode === 'playing' || this.#mode === 'tutorial-playing';
  }

  async #share() {
    const text = `He defendido a las Pipis durante ${this.renderer.formatTime(this.bestTime)}.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: '¡Defiende a las Pipis!',
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

  #setOverlayMode(mode, feedback = '') {
    this.elements.overlay.hidden = false;
    this.elements.overlay.dataset.mode = mode;
    this.elements.overlay.dataset.feedback = feedback;

    for (const panel of this.elements.panels) {
      panel.hidden = panel.dataset.panel !== mode;
    }
  }
}
