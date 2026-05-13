import { GAME_CONFIG } from './gameConfig.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const toMinutes = (elapsedSeconds) => Math.max(0, elapsedSeconds) / 60;

export function getDifficultyMetrics(level, elapsedSeconds, config = GAME_CONFIG) {
  const minutes = toMinutes(elapsedSeconds);
  const { balance } = config;

  const foxSpawnMultiplier = 1 + minutes * balance.foxSpawn.intervalReductionPerMinute;
  const foxSpeedMultiplier = clamp(
    1 + minutes * balance.foxSpeed.increasePerMinute,
    1,
    balance.foxSpeed.maxMultiplier,
  );
  const eggSpawnMultiplier = clamp(
    1 + minutes * balance.eggSpawn.delayIncreasePerMinute,
    1,
    balance.eggSpawn.maxMultiplier,
  );
  const eggDurationMultiplier = 1 + minutes * balance.eggDuration.reductionPerMinute;
  const maxFoxesRamp = Math.floor(minutes * balance.maxFoxes.increasePerMinute);

  return {
    foxSpawnInterval: Math.max(
      balance.foxSpawn.minInterval,
      level.foxSpawnInterval / foxSpawnMultiplier,
    ),
    eggSpawnInterval: level.eggSpawnInterval * eggSpawnMultiplier,
    eggDuration: Math.max(balance.eggDuration.minDuration, config.egg.duration / eggDurationMultiplier),
    foxSpeed: level.foxBaseSpeed * foxSpeedMultiplier,
    maxFoxes: Math.min(level.maxFoxesCap, level.maxFoxes + maxFoxesRamp),
  };
}

export function summarizeBalance(config = GAME_CONFIG) {
  return Object.entries(config.levels).flatMap(([levelKey, level]) =>
    config.balance.checkpointsSeconds.map((elapsedSeconds) => ({
      levelKey,
      elapsedSeconds,
      firstFoxDelay: level.firstFoxDelay,
      firstEggDelay: level.firstEggDelay,
      ...getDifficultyMetrics(level, elapsedSeconds, config),
    })),
  );
}

export function validateBalanceConfig(config = GAME_CONFIG) {
  const errors = [];
  const levelEntries = Object.entries(config.levels ?? {});

  if (levelEntries.length <= 0) errors.push('Debe existir al menos un nivel de dificultad.');
  if (config.egg.duration <= 0) errors.push('egg.duration debe ser mayor que cero.');
  if (config.egg.warningTime >= config.egg.duration) {
    errors.push('egg.warningTime debe ser menor que egg.duration.');
  }
  if (config.balance.eggDuration.minDuration <= 0) {
    errors.push('balance.eggDuration.minDuration debe ser mayor que cero.');
  }
  if (config.balance.foxSpawn.minInterval <= 0) {
    errors.push('balance.foxSpawn.minInterval debe ser mayor que cero.');
  }
  if (config.balance.foxSpeed.maxMultiplier < 1) {
    errors.push('balance.foxSpeed.maxMultiplier no puede ser menor que 1.');
  }
  if (config.balance.eggSpawn.maxMultiplier < 1) {
    errors.push('balance.eggSpawn.maxMultiplier no puede ser menor que 1.');
  }

  for (const [levelKey, level] of levelEntries) {
    validateLevel(levelKey, level, config, errors);
  }

  validateLevelSeparation(config, errors);

  return errors;
}

export function assertBalanceConfig(config = GAME_CONFIG) {
  const errors = validateBalanceConfig(config);

  if (errors.length > 0) {
    throw new Error(`Balance inválido:\n- ${errors.join('\n- ')}`);
  }
}

function validateLevel(levelKey, level, config, errors) {
  const numericFields = [
    'initialChickens',
    'firstFoxDelay',
    'firstEggDelay',
    'foxSpawnInterval',
    'eggSpawnInterval',
    'foxBaseSpeed',
    'maxFoxes',
    'maxFoxesCap',
  ];

  for (const field of numericFields) {
    if (!Number.isFinite(level[field]) || level[field] < 0) {
      errors.push(`levels.${levelKey}.${field} debe ser un número no negativo.`);
    }
  }

  if (level.initialChickens <= 0) {
    errors.push(`levels.${levelKey}.initialChickens debe ser mayor que cero.`);
  }
  if (level.firstFoxDelay <= 0 || level.firstEggDelay <= 0) {
    errors.push(`levels.${levelKey} debe tener primeros spawns positivos.`);
  }
  if (level.foxSpawnInterval <= 0 || level.eggSpawnInterval <= 0) {
    errors.push(`levels.${levelKey} debe tener intervalos de spawn positivos.`);
  }
  if (level.maxFoxesCap < level.maxFoxes) {
    errors.push(`levels.${levelKey}.maxFoxesCap no puede ser menor que maxFoxes.`);
  }

  for (const elapsedSeconds of config.balance.checkpointsSeconds) {
    const metrics = getDifficultyMetrics(level, elapsedSeconds, config);

    if (metrics.foxSpawnInterval <= 0 || metrics.eggSpawnInterval <= 0) {
      errors.push(`levels.${levelKey} genera intervalos imposibles en ${elapsedSeconds}s.`);
    }
    if (metrics.eggDuration < config.balance.eggDuration.minDuration) {
      errors.push(`levels.${levelKey} baja de la duración mínima de huevo en ${elapsedSeconds}s.`);
    }
    if (metrics.maxFoxes < 0 || metrics.maxFoxes > level.maxFoxesCap) {
      errors.push(`levels.${levelKey} genera un máximo de zorros inválido en ${elapsedSeconds}s.`);
    }
    if (metrics.foxSpeed <= 0) {
      errors.push(`levels.${levelKey} genera velocidad de zorro inválida en ${elapsedSeconds}s.`);
    }
  }
}

function validateLevelSeparation(config, errors) {
  const { easy, medium, hard } = config.levels;
  if (!easy || !medium || !hard) return;

  if (!(easy.firstFoxDelay > medium.firstFoxDelay && medium.firstFoxDelay > hard.firstFoxDelay)) {
    errors.push('El primer zorro debe llegar antes al subir de fácil a medio y difícil.');
  }
  if (!(easy.firstEggDelay < medium.firstEggDelay && medium.firstEggDelay < hard.firstEggDelay)) {
    errors.push('El primer huevo debe tardar más al subir de fácil a medio y difícil.');
  }
  if (!(easy.foxBaseSpeed < medium.foxBaseSpeed && medium.foxBaseSpeed < hard.foxBaseSpeed)) {
    errors.push('La velocidad base de zorros debe separar fácil, medio y difícil.');
  }
  if (!(easy.foxSpawnInterval > medium.foxSpawnInterval && medium.foxSpawnInterval > hard.foxSpawnInterval)) {
    errors.push('El spawn de zorros debe ser más frecuente al subir dificultad.');
  }
  if (!(easy.maxFoxesCap < medium.maxFoxesCap && medium.maxFoxesCap < hard.maxFoxesCap)) {
    errors.push('El techo de zorros debe separar fácil, medio y difícil.');
  }
}
