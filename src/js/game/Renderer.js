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

  drawHud({ time, chickens, levelLabel, modeLabel = '', primary, secondary }) {
    const ctx = this.context;

    ctx.save();
    ctx.shadowColor = 'rgba(52, 24, 8, 0.3)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(255, 247, 223, 0.2)';
    this.#roundedRect(16, 18, this.width - 32, 108, 28);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
    ctx.lineWidth = 1;
    ctx.stroke();

    this.#drawHudPill(28, 29, 156, 'PIPIS', String(chickens));
    this.#drawHudPill(194, 29, 154, 'TIEMPO', this.formatTime(time));
    this.#drawHudPill(
      358,
      29,
      this.width - 386,
      primary?.label ?? 'NIVEL',
      primary?.value ?? levelLabel,
    );

    const footer = [
      levelLabel,
      modeLabel,
      secondary ? `${secondary.label}: ${secondary.value}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    ctx.fillStyle = 'rgba(255, 249, 232, 0.82)';
    ctx.font = '900 12px ui-rounded, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(footer, this.width / 2, 112);
    ctx.restore();
  }

  drawModeOverlay(visuals) {
    if (!visuals?.nightAlpha) return;

    const ctx = this.context;
    const radius = visuals.spotlightRadius ?? 170;
    const gradient = ctx.createRadialGradient(
      this.width / 2,
      this.height * 0.56,
      radius * 0.22,
      this.width / 2,
      this.height * 0.56,
      radius,
    );

    ctx.save();
    gradient.addColorStop(0, 'rgba(8, 16, 42, 0)');
    gradient.addColorStop(0.72, `rgba(8, 16, 42, ${visuals.nightAlpha * 0.7})`);
    gradient.addColorStop(1, `rgba(8, 16, 42, ${visuals.nightAlpha})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  drawEgg(egg) {
    const ctx = this.context;
    const pulse = 1 + Math.sin(egg.age * GAME_CONFIG.egg.pulseSpeed) * 0.05;
    const wobble = Math.sin(egg.age * 10) * (egg.isWarning ? 0.08 : 0.035);
    const radius = egg.radius * pulse;
    const ringAlpha = egg.isWarning ? 0.72 : 0.38;

    ctx.save();
    ctx.translate(egg.x, egg.y);
    ctx.rotate(wobble);

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
    const bounce = options.bounce ?? 0;

    ctx.save();
    ctx.globalAlpha = options.alpha ?? 1;
    ctx.translate(x, y + bounce);
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
    if (style.label) ctx.fillText(style.label, effect.x, effect.y - radius * 0.45);

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

  #drawHudPill(x, y, width, label, value) {
    const ctx = this.context;

    ctx.fillStyle = 'rgba(33, 18, 8, 0.58)';
    this.#roundedRect(x, y, width, 56, 20);
    ctx.fill();
    ctx.fillStyle = '#ffd98a';
    ctx.font = '900 10px ui-rounded, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label.toUpperCase(), x + 16, y + 22);
    ctx.fillStyle = '#fff9e8';
    ctx.font = '950 20px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif';
    ctx.fillText(value, x + 16, y + 47);
  }

  #feedbackStyle(type = 'scare') {
    const styles = {
      scare: this.#style(
        '!',
        'rgba(255, 246, 166, 0.96)',
        'rgba(255, 94, 61, 0.9)',
        7,
        22,
        62,
        8,
        3.8,
        30,
      ),
      hatch: this.#style(
        '+',
        'rgba(255, 246, 166, 0.96)',
        'rgba(255, 214, 89, 0.94)',
        7,
        14,
        44,
        10,
        3.4,
        30,
      ),
      lost: this.#style(
        '×',
        'rgba(255, 130, 105, 0.92)',
        'rgba(255, 104, 82, 0.9)',
        6,
        18,
        54,
        6,
        4.4,
        32,
      ),
      mission: this.#style(
        '✓',
        'rgba(187, 247, 208, 0.95)',
        'rgba(134, 239, 172, 0.92)',
        8,
        38,
        92,
        14,
        4.2,
        42,
      ),
      gameOver: this.#style(
        'fin',
        'rgba(255, 180, 150, 0.84)',
        'rgba(255, 120, 90, 0.9)',
        8,
        44,
        130,
        12,
        4.4,
        34,
      ),
      spawn: this.#style(
        '!',
        'rgba(255, 164, 92, 0.82)',
        'rgba(255, 184, 105, 0.86)',
        5,
        12,
        74,
        8,
        3.2,
        24,
      ),
      trail: this.#style(
        '',
        'rgba(255, 245, 190, 0.24)',
        'rgba(255, 245, 190, 0.32)',
        3,
        4,
        16,
        3,
        2.4,
        1,
      ),
    };

    return styles[type] ?? styles.scare;
  }

  #style(label, stroke, fill, lineWidth, radius, growth, particles, particleSize, fontSize) {
    return {
      label,
      stroke,
      fill,
      lineWidth,
      radius,
      growth,
      particles,
      particleSize,
      fontSize,
      fontWeight: 900,
    };
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
