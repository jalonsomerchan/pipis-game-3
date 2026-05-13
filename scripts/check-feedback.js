import { GAME_CONFIG } from '../src/js/config/gameConfig.js';

const REQUIRED_EVENTS = ['scare', 'hatch', 'lost', 'mission', 'record', 'gameOver'];
const errors = [];

if (GAME_CONFIG.feedback.volume < 0 || GAME_CONFIG.feedback.volume > 0.35) {
  errors.push('feedback.volume debe estar entre 0 y 0.35 para no resultar molesto.');
}

for (const eventName of REQUIRED_EVENTS) {
  const sound = GAME_CONFIG.feedback.sounds[eventName];
  const vibration = GAME_CONFIG.feedback.vibrations[eventName];

  if (!sound) {
    errors.push(`Falta sonido para ${eventName}.`);
    continue;
  }

  if (!Number.isFinite(sound.frequency) || sound.frequency <= 0) {
    errors.push(`feedback.sounds.${eventName}.frequency debe ser mayor que cero.`);
  }
  if (!Number.isFinite(sound.endFrequency) || sound.endFrequency <= 0) {
    errors.push(`feedback.sounds.${eventName}.endFrequency debe ser mayor que cero.`);
  }
  if (!Number.isFinite(sound.duration) || sound.duration <= 0 || sound.duration > 0.35) {
    errors.push(`feedback.sounds.${eventName}.duration debe ser corta y positiva.`);
  }
  if (!['sine', 'square', 'sawtooth', 'triangle'].includes(sound.type)) {
    errors.push(`feedback.sounds.${eventName}.type no es un tipo de oscilador válido.`);
  }
  if (!Array.isArray(vibration) || vibration.length <= 0) {
    errors.push(`Falta patrón de vibración para ${eventName}.`);
  }
}

if (GAME_CONFIG.effects.maxParticles > 40) {
  errors.push('effects.maxParticles debe mantenerse bajo para cuidar rendimiento móvil.');
}

if (errors.length > 0) {
  throw new Error(`Feedback inválido:\n- ${errors.join('\n- ')}`);
}

console.log('Feedback smoke checks OK');
