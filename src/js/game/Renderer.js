export class Renderer {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.width = config.width;
    this.height = config.height;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const pixelRatio = Math.max(1, window.devicePixelRatio || 1);

    this.canvas.width = Math.round(this.width * pixelRatio);
    this.canvas.height = Math.round(this.height * pixelRatio);
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  clear() {
    const gradient = this.context.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#020617');

    this.context.fillStyle = gradient;
    this.context.fillRect(0, 0, this.width, this.height);
  }

  drawCircle({ x, y, radius, color, shadowColor = color }) {
    this.context.save();
    this.context.shadowBlur = 24;
    this.context.shadowColor = shadowColor;
    this.context.fillStyle = color;
    this.context.beginPath();
    this.context.arc(x, y, radius, 0, Math.PI * 2);
    this.context.fill();
    this.context.restore();
  }

  drawText(text, x, y) {
    this.context.save();
    this.context.fillStyle = 'rgba(255,255,255,0.72)';
    this.context.font = '700 18px ui-sans-serif, system-ui, sans-serif';
    this.context.textAlign = 'center';
    this.context.fillText(text, x, y);
    this.context.restore();
  }
}
