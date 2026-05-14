import { GAME_CONFIG } from '../config/gameConfig.js';

export class Feedback {
  #audioContext = null;

  constructor(config = GAME_CONFIG.feedback) {
    this.config = config;
    this.soundEnabled = config.soundEnabled;
    this.vibrationEnabled = config.vibrationEnabled;
  }

  prime() {
    if (!this.soundEnabled || this.#audioContext) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      this.#audioContext = new AudioContext();
      this.#audioContext.resume?.();
    } catch {
      this.soundEnabled = false;
    }
  }

  play(name) {
    this.#playSound(name);
    this.#vibrate(name);
  }

  #playSound(name) {
    if (!this.soundEnabled) return;

    this.prime();
    if (!this.#audioContext) return;

    const sound = this.config.sounds[name];
    if (!sound) return;

    try {
      const now = this.#audioContext.currentTime;
      const oscillator = this.#audioContext.createOscillator();
      const gain = this.#audioContext.createGain();

      oscillator.type = sound.type;
      oscillator.frequency.setValueAtTime(sound.frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, sound.endFrequency),
        now + sound.duration,
      );

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(this.config.volume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + sound.duration);

      oscillator.connect(gain);
      gain.connect(this.#audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + sound.duration + 0.02);
    } catch {
      this.soundEnabled = false;
    }
  }

  #vibrate(name) {
    if (!this.vibrationEnabled || !navigator.vibrate) return;

    const pattern = this.config.vibrations[name];
    if (!pattern) return;

    try {
      navigator.vibrate(pattern);
    } catch {
      this.vibrationEnabled = false;
    }
  }
}
