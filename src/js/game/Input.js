export class Input {
  #keys = new Set();
  #taps = [];

  constructor(target) {
    this.target = target;
    this.#bindEvents();
  }

  consumeTaps() {
    const taps = [...this.#taps];
    this.#taps = [];

    return taps;
  }

  consumeKeyboardScare() {
    if (!this.#keys.has('Space') && !this.#keys.has('Enter')) return false;

    this.#keys.delete('Space');
    this.#keys.delete('Enter');

    return true;
  }

  consumePause() {
    if (!this.#keys.has('Escape') && !this.#keys.has('KeyP')) return false;

    this.#keys.delete('Escape');
    this.#keys.delete('KeyP');

    return true;
  }

  #bindEvents() {
    window.addEventListener('keydown', (event) => {
      this.#keys.add(event.code);
    });

    window.addEventListener('keyup', (event) => {
      this.#keys.delete(event.code);
    });

    this.target.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.target.setPointerCapture(event.pointerId);
      this.#taps.push(this.#getPointerPosition(event));
    });

    this.target.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') event.preventDefault();
    });

    this.target.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
  }

  #getPointerPosition(event) {
    const rect = this.target.getBoundingClientRect();
    const pixelRatio = Math.max(1, window.devicePixelRatio || 1);

    return {
      x: ((event.clientX - rect.left) / rect.width) * (this.target.width / pixelRatio),
      y: ((event.clientY - rect.top) / rect.height) * (this.target.height / pixelRatio),
    };
  }
}
