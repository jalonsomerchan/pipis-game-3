import { GAME_CONFIG } from '../config/gameConfig.js';

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
    this.context.fillStyle = '#2b160b';
    this.context.fillRect(0, 0, this.width, this.height);
  }

  drawBackground(image) {
    if (!image) return;

    const scale = Math.max(this.width / image.width, this.height / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    const x = (this.width - width) / 2;
    const y = (this.height - height) / 2;

    this.context.drawImage(image, x, y, width, height);
    this.#drawSceneVignette();
  }

  drawBarn() {
    this.#drawSceneVignette();
  }

  drawHud({ time, chickens, eggs, foxes, levelLabel }) {
    const ctx = this.context;

    ctx.save();
    ctx.shadowColor = 'rgba(52, 24, 8, 0.3)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(255, 247, 223, 0.22)';
    this.#roundedRect(16, 18, this.width - 32, 82, 28);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(33, 18, 8, 0.58)';
    this.#roundedRect(26, 29, 152, 60, 20);
    ctx.fill();

    ctx.fillStyle = '#fff9e8';
    ctx.font = '900 17px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(levelLabel, 42, 52);
    ctx.font = '800 15px ui-rounded, system-ui, sans-serif';
    ctx.fillText(`Pipis ${chickens}`, 42, 77);

    this.#drawHudPill(196, 29, 'Huevos', eggs);
    this.#drawHudPill(280, 29, 'Zorros', foxes);
    this.#drawHudPill(364, 29, 'Tiempo', this.formatTime(time), 124);

    ctx.restore();
  }

  drawEgg(egg) {
    const ctx = this.context;
    const pulse = 1 + Math.sin(egg.age * 8) * 0.05;
    const radius = egg.radius * pulse;
    const ringAlpha = egg.isWarning ? 0.72 : 0.38;

    ctx.save();
    ctx.translate(egg.x, egg.y);

    ctx.strokeStyle = `rgba(255, 239, 171, ${ringAlpha})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, GAME_CONFIG.egg.hatchRadius * egg.progress, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowColor = 'rgba(91, 42, 12, 0.35)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = 'rgba(61, 31, 10, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 22, radius * 0.86, radius * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    const gradient = ctx.createRadialGradient(-8, -12, 4, 0, 0, radius);
    gradient.addColorStop(0, '#fffdf0');
    gradient.addColorStop(0.58, '#ffe7a2');
    gradient.addColorStop(1, egg.isWarning ? '#ff9b73' : '#f7c56d');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.72, radius, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(105, 57, 22, 0.28)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  drawSprite(sprite, x, y, size, frameIndex = 0, options = {}) {
    if (!sprite?.image) return;

    const frame = Math.floor(frameIndex) % sprite.frames;
    const col = frame % sprite.columns;
    const row = Math.floor(frame / sprite.columns);
    const sourceX = col * sprite.frameWidth;
    const sourceY = row * sprite.frameHeight;
    const ctx = this.context;

    ctx.save();
    ctx.globalAlpha = options.alpha ?? 1;
    ctx.translate(x, y);
    if (options.flipX) ctx.scale(-1, 1);
    ctx.drawImage(
      sprite.image,
      sourceX,
      sourceY,
      sprite.frameWidth,
      sprite.frameHeight,
      -size / 2,
      -size / 2,
      size,
      size,
    );
    ctx.restore();
  }

  drawScareEffect(effect) {
    const progress = 1 - effect.life / effect.duration;
    const alpha = Math.max(0, 1 - progress);
    const style = this.#feedbackStyle(effect.type);
    const radius = style.radius + progress * style.growth;
    const ctx = this.context;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = style.lineWidth;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = style.fill;
    ctx.font = `${style.fontWeight} ${style.fontSize}px ui-rounded, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(style.label, effect.x, effect.y - radius * 0.45);

    for (let index = 0; index < style.particles; index += 1) {
      const angle = (Math.PI * 2 * index) / style.particles;
      const distance = radius * (0.35 + progress * 0.65);
      const size = style.particleSize * (1 - progress * 0.35);

      ctx.beginPath();
      ctx.arc(
        effect.x + Math.cos(angle) * distance,
        effect.y + Math.sin(angle) * distance,
        size,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    ctx.restore();
  }

  drawDangerPulse(target, duration) {
    const alpha = Math.max(0, target.dangerPulse / duration);
    const ctx = this.context;

    ctx.save();
    ctx.strokeStyle = `rgba(220, 38, 38, ${alpha})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 52 + (1 - alpha) * 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawTutorialMessage(message) {
    const ctx = this.context;
    const x = 34;
    const y = 792;
    const width = this.width - 68;
    const height = 118;

    ctx.save();
    ctx.shadowColor = 'rgba(35, 16, 6, 0.42)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = 'rgba(34, 16, 8, 0.72)';
    this.#roundedRect(x, y, width, height, 28);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 247, 223, 0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffd98a';
    ctx.font = '900 12px ui-rounded, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TUTORIAL', x + 22, y + 32);

    ctx.fillStyle = '#fff7df';
    ctx.font = '900 20px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif';
    this.#wrapText(message, x + 22, y + 62, width - 44, 24);
    ctx.restore();
  }

  formatTime(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = String(safeSeconds % 60).padStart(2, '0');

    return `${minutes}:${remainder}`;
  }

  #feedbackStyle(type = 'scare') {
    const styles = {
      scare: {
        label: '!',
        stroke: 'rgba(255, 246, 166, 0.96)',
        fill: 'rgba(255, 94, 61, 0.9)',
        lineWidth: 7,
        radius: 22,
        growth: 62,
        particles: 8,
        particleSize: 3.8,
        fontSize: 30,
        fontWeight: 900,
      },
      hatch: {
        label: '+',
        stroke: 'rgba(255, 246, 166, 0.96)',
        fill: 'rgba(255, 214, 89, 0.94)',
        lineWidth: 7,
        radius: 14,
        growth: 44,
        particles: 10,
        particleSize: 3.4,
        fontSize: 30,
        fontWeight: 900,
      },
      lost: {
        label: '×',
        stroke: 'rgba(255, 130, 105, 0.92)',
        fill: 'rgba(255, 104, 82, 0.9)',
        lineWidth: 6,
        radius: 18,
        growth: 54,
        particles: 6,
        particleSize: 4.4,
        fontSize: 32,
        fontWeight: 900,
      },
      mission: {
        label: '✓',
        stroke: 'rgba(187, 247, 208, 0.95)',
        fill: 'rgba(134, 239, 172, 0.92)',
        lineWidth: 8,
        radius: 38,
        growth: 92,
        particles: 14,
        particleSize: 4.2,
        fontSize: 42,
        fontWeight: 950,
      },
      gameOver: {
        label: 'fin',
        stroke: 'rgba(255, 180, 150, 0.84)',
        fill: 'rgba(255, 120, 90, 0.9)',
        lineWidth: 8,
        radius: 44,
        growth: 130,
        particles: 12,
        particleSize: 4.4,
        fontSize: 34,
        fontWeight: 950,
      },
    };

    return styles[type] ?? styles.scare;
  }

  #roundedRect(x, y, width, height, radius) {
    this.context.beginPath();
    this.context.moveTo(x + radius, y);
    this.context.arcTo(x + width, y, x + width, y + height, radius);
    this.context.arcTo(x + width, y + height, x, y + height, radius);
    this.context.arcTo(x, y + height, x, y, radius);
    this.context.arcTo(x, y, x + width, y, radius);
    this.context.closePath();
  }

  #drawHudPill(x, y, icon, value, width = 72) {
    const ctx = this.context;

    ctx.fillStyle = 'rgba(33, 18, 8, 0.5)';
    this.#roundedRect(x, y, width, 60, 20);
    ctx.fill();
    ctx.fillStyle = '#fff9e8';
    ctx.font = '900 9px ui-rounded, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(icon.toUpperCase(), x + 13, y + 22);
    ctx.font = '900 17px ui-rounded, system-ui, sans-serif';
    ctx.fillText(String(value), x + 13, y + 43);
  }

  #wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let cursorY = y;

    for (const word of words) {
      const testLine = `${line}${word} `;
      if (this.context.measureText(testLine).width > maxWidth && line) {
        this.context.fillText(line.trim(), x, cursorY);
        line = `${word} `;
        cursorY += lineHeight;
      } else {
        line = testLine;
      }
    }

    this.context.fillText(line.trim(), x, cursorY);
  }

  #drawSceneVignette() {
    const ctx = this.context;
    const gradient = ctx.createRadialGradient(
      this.width / 2,
      this.height * 0.54,
      90,
      this.width / 2,
      this.height / 2,
      this.height * 0.72,
    );

    gradient.addColorStop(0, 'rgba(255, 245, 190, 0.06)');
    gradient.addColorStop(0.72, 'rgba(62, 31, 10, 0.02)');
    gradient.addColorStop(1, 'rgba(35, 18, 7, 0.38)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}
