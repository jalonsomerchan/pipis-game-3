export const GAME_MODE_IDS = {
  collect10: 'collect-10',
  survival: 'survival',
  timeAttack: 'time-attack',
  combo: 'combo',
  foxWaves: 'fox-waves',
};

export const GAME_MODES = {
  [GAME_MODE_IDS.collect10]: {
    id: GAME_MODE_IDS.collect10,
    label: 'Hasta conseguir 10 pipis',
    shortLabel: '10 Pipis',
    description: 'Gana al incubar 10 huevos antes de quedarte sin gallinas.',
    objective: 'Incuba 10 Pipis',
    resultMetric: 'Pipis conseguidas',
    rules: {
      targetPipis: 10,
      countsScaresForCombo: false,
      standardFoxSpawns: true,
    },
  },
  [GAME_MODE_IDS.survival]: {
    id: GAME_MODE_IDS.survival,
    label: 'Supervivencia',
    shortLabel: 'Supervivencia',
    description: 'Aguanta todo lo que puedas. La partida acaba cuando no quedan Pipis.',
    objective: 'Sobrevive',
    resultMetric: 'Tiempo sobrevivido',
    rules: {
      tracksBestTime: true,
      standardFoxSpawns: true,
    },
  },
  [GAME_MODE_IDS.timeAttack]: {
    id: GAME_MODE_IDS.timeAttack,
    label: 'Contrarreloj',
    shortLabel: 'Contrarreloj',
    description: 'Consigue el máximo de Pipis antes de que termine el minuto.',
    objective: 'Máximas Pipis en 60s',
    resultMetric: 'Pipis conseguidas',
    rules: {
      durationSeconds: 60,
      standardFoxSpawns: true,
    },
  },
  [GAME_MODE_IDS.combo]: {
    id: GAME_MODE_IDS.combo,
    label: 'Combo',
    shortLabel: 'Combo',
    description: 'Encadena huevos y sustos sin dejar que la racha se enfríe.',
    objective: 'Mantén la racha',
    resultMetric: 'Puntuación combo',
    rules: {
      comboWindowSeconds: 4.2,
      multiplierStep: 0.25,
      maxMultiplier: 5,
      pointsPerPipi: 10,
      pointsPerScare: 2,
      countsScaresForCombo: true,
      standardFoxSpawns: true,
    },
  },
  [GAME_MODE_IDS.foxWaves]: {
    id: GAME_MODE_IDS.foxWaves,
    label: 'Oleadas de zorros',
    shortLabel: 'Oleadas',
    description: 'Supera oleadas progresivas con descansos cada vez más tensos.',
    objective: 'Supera 6 oleadas',
    resultMetric: 'Oleadas superadas',
    rules: {
      standardFoxSpawns: false,
      maxWaves: 6,
      startFoxes: 2,
      foxesPerWave: 1,
      maxSimultaneousFoxes: 8,
      spawnBatchSize: 2,
      spawnIntervalSeconds: 1.1,
      restSeconds: 3,
      restReductionPerWave: 0.28,
      minRestSeconds: 1.15,
      speedMultiplierPerWave: 0.12,
      maxSpeedMultiplier: 1.8,
    },
  },
};

export const GAME_MODE_LIST = Object.values(GAME_MODES);
export const DEFAULT_GAME_MODE_ID = GAME_MODE_IDS.survival;

export function getGameMode(modeId = DEFAULT_GAME_MODE_ID) {
  return GAME_MODES[modeId] ?? GAME_MODES[DEFAULT_GAME_MODE_ID];
}

export function validateGameModes(levels, modes = GAME_MODES) {
  const errors = [];
  const entries = Object.entries(modes);

  if (entries.length <= 0) errors.push('Debe existir al menos un modo de juego.');

  for (const [modeId, mode] of entries) {
    validateModeIdentity(modeId, mode, errors);
    validateModeRules(modeId, mode.rules ?? {}, errors);
  }

  validateWaveMode(levels, modes[GAME_MODE_IDS.foxWaves], errors);

  return errors;
}

export function assertGameModes(levels, modes = GAME_MODES) {
  const errors = validateGameModes(levels, modes);

  if (errors.length > 0) {
    throw new Error(`Modos de juego inválidos:\n- ${errors.join('\n- ')}`);
  }
}

function validateModeIdentity(modeId, mode, errors) {
  if (!mode?.id || mode.id !== modeId) {
    errors.push(`El modo ${modeId} necesita un id coherente.`);
  }
  if (!mode?.label) errors.push(`El modo ${modeId} necesita nombre visible.`);
  if (!mode?.description) errors.push(`El modo ${modeId} necesita descripción visible.`);
  if (!mode?.objective) errors.push(`El modo ${modeId} necesita objetivo visible.`);
}

function validateModeRules(modeId, rules, errors) {
  if (modeId === GAME_MODE_IDS.collect10 && rules.targetPipis <= 0) {
    errors.push('El modo de 10 Pipis necesita un objetivo positivo.');
  }
  if (modeId === GAME_MODE_IDS.timeAttack && rules.durationSeconds <= 0) {
    errors.push('Contrarreloj necesita una duración positiva.');
  }
  if (modeId === GAME_MODE_IDS.combo) {
    if (rules.comboWindowSeconds <= 0) errors.push('Combo necesita una ventana positiva.');
    if (rules.maxMultiplier < 1) errors.push('Combo necesita multiplicador máximo válido.');
    if (rules.pointsPerPipi <= 0) errors.push('Combo necesita puntos por Pipi positivos.');
  }
  if (modeId === GAME_MODE_IDS.foxWaves) {
    if (rules.maxWaves <= 0) errors.push('Oleadas necesita al menos una oleada.');
    if (rules.startFoxes <= 0) errors.push('Oleadas necesita zorros iniciales positivos.');
    if (rules.maxSimultaneousFoxes <= 0) {
      errors.push('Oleadas necesita límite simultáneo positivo.');
    }
    if (rules.spawnIntervalSeconds <= 0) {
      errors.push('Oleadas necesita intervalo de spawn positivo.');
    }
    if (rules.restSeconds <= 0 || rules.minRestSeconds <= 0) {
      errors.push('Oleadas necesita descansos positivos.');
    }
    if (rules.maxSpeedMultiplier < 1) {
      errors.push('Oleadas necesita multiplicador de velocidad válido.');
    }
  }
}

function validateWaveMode(levels, waveMode, errors) {
  if (!waveMode || !levels) return;

  const maxLevelCap = Math.max(...Object.values(levels).map((level) => level.maxFoxesCap ?? 0));
  const { rules } = waveMode;
  const lastWaveFoxes = rules.startFoxes + (rules.maxWaves - 1) * rules.foxesPerWave;

  if (rules.maxSimultaneousFoxes > maxLevelCap) {
    errors.push('Oleadas no puede superar el mayor maxFoxesCap de dificultad.');
  }
  if (rules.spawnBatchSize > rules.maxSimultaneousFoxes) {
    errors.push('Oleadas no puede spawnear más zorros por tanda que el máximo simultáneo.');
  }
  if (lastWaveFoxes <= 0) errors.push('Oleadas genera una última oleada imposible.');
}
