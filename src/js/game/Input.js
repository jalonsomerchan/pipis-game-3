export class Input {
  #keys = new Set();
  #pointer = null;

  constructor(target) {
    this.target = target;
    this.#bindEvents();
  }

  get direction() {
    const direction = { x: 0, y: 0 };

    if (this.#keys.has('ArrowLeft') || this.#keys.has('KeyA')) direction.x -= 1;
    if (this.#keys.has('ArrowRight') || this.#keys.has('KeyD')) direction.x += 1;
    if (this.#keys.has('ArrowUp') || this.#keys.has('KeyW')) direction.y -= 1;
    if (this.#keys.has('ArrowDown') || this.#keys.has('KeyS')) direction.y += 1;

    const length = Math.hypot(direction.x, direction.y) || 1;

    return {
      x: direction.x / length,
      y: direction.y / length,
    };
  }

  get pointer() {
    return this.#pointer;
  }

  #bindEvents() {
    window.addEventListener('keydown', (event) => {
      this.#keys.add(event.code);
    });

    window.addEventListener('keyup', (event) => {
      this.#keys.delete(event.code);
    });

    this.target.addEventListener('pointerdown', (event) => {
      this.target.setPointerCapture(event.pointerId);
      this.#pointer = this.#getPointerPosition(event);
    });

    this.target.addEventListener('pointermove', (event) => {
      if (!this.#pointer) return;
      this.#pointer = this.#getPointerPosition(event);
    });

    this.target.addEventListener('pointerup', () => {
      this.#pointer = null;
    });

    this.target.addEventListener('pointercancel', () => {
      this.#pointer = null;
    });
  }

  #getPointerPosition(event) {
    const rect = this.target.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * this.target.width,
      y: ((event.clientY - rect.top) / rect.height) * this.target.height,
    };
  }
}
