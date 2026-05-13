import { GAME_MODE_IDS } from '../config/gameModes.js';

export function createModeState(mode) {
  const rules = mode.rules;

  return {
    collectedPipis: 0,
    scaredFoxes: 0,
    score: 0,
    comboScore: 0,
    comboStreak: 0,
    comboMultiplier: 1,
    comboTimer: 0,
    wave: 1,
    waveRestTimer: 0,
    waveSpawnTimer: 0,
    pendingWaveFoxes: rules.startFoxes ?? 0,
    completedWaves: 0,
    wavesComplete: false,
  };
}

export function getModeInitialChickens(mode, level) {
  return mode.rules.initialChickens ?? level.initialChickens;
}

export function applyModeActions(mode, state, actions) {
  state.collectedPipis += actions.hatched;
  state.scaredFoxes += actions.scared;
  state.score += Math.round(
    actions.hatched * getPointsPerPipi(mode) + actions.scared * getPointsPerScare(mode),
  );

  if (mode.id !== GAME_MODE_IDS.combo) return;

  const chainActions = actions.hatched + (mode.rules.countsScaresForCombo ? actions.scared : 0);
  if (chainActions <= 0) return;

  state.comboStreak += chainActions;
  state.comboTimer = mode.rules.comboWindowSeconds;
  state.comboMultiplier = getComboMultiplier(mode, state.comboStreak);
  state.comboScore += Math.round(
    (actions.hatched * mode.rules.pointsPerPipi + actions.scared * mode.rules.pointsPerScare) *
      state.comboMultiplier,
  );
}

export function updateModeTimers(mode, state, deltaTime) {
  if (mode.id !== GAME_MODE_IDS.combo || state.comboTimer <= 0) return;

  state.comboTimer = Math.max(0, state.comboTimer - deltaTime);
  if (state.comboTimer <= 0) {
    state.comboStreak = 0;
    state.comboMultiplier = 1;
  }
}

export function getModeFinish(mode, state, { elapsedTime, chickens }) {
  if (mode.rules.durationSeconds && elapsedTime >= mode.rules.durationSeconds) {
    return { outcome: 'time', feedback: 'mission' };
  }

  if (chickens <= 0) return { outcome: 'defeat', feedback: 'gameOver' };

  if (mode.id === GAME_MODE_IDS.collect10 && state.collectedPipis >= mode.rules.targetPipis) {
    return { outcome: 'victory', feedback: 'mission' };
  }

  if (mode.id === GAME_MODE_IDS.foxWaves && state.wavesComplete) {
    return { outcome: 'victory', feedback: 'mission' };
  }

  return null;
}

export function getModeHud(mode, state, { elapsedTime }) {
  if (mode.id === GAME_MODE_IDS.collect10) {
    return {
      primary: { label: 'Objetivo', value: `${state.collectedPipis}/${mode.rules.targetPipis}` },
      secondary: { label: 'Modo', value: mode.shortLabel },
    };
  }

  if (mode.id === GAME_MODE_IDS.timeAttack || mode.id === GAME_MODE_IDS.fever) {
    return {
      primary: { label: 'Restan', value: formatTime(mode.rules.durationSeconds - elapsedTime) },
      secondary: {
        label: mode.id === GAME_MODE_IDS.fever ? 'Puntos' : 'Pipis+',
        value: String(mode.id === GAME_MODE_IDS.fever ? state.score : state.collectedPipis),
      },
    };
  }

  if (mode.id === GAME_MODE_IDS.combo) {
    return {
      primary: { label: 'Combo', value: `x${state.comboMultiplier.toFixed(2)}` },
      secondary: { label: 'Racha', value: `${state.comboStreak}` },
    };
  }

  if (mode.id === GAME_MODE_IDS.foxWaves) {
    return {
      primary: { label: 'Oleada', value: `${state.wave}/${mode.rules.maxWaves}` },
      secondary: { label: 'Pend.', value: String(state.pendingWaveFoxes) },
    };
  }

  if (mode.id === GAME_MODE_IDS.onePipi) {
    return {
      primary: { label: 'Perfecto', value: formatTime(elapsedTime) },
      secondary: { label: 'Puntos', value: String(state.score) },
    };
  }

  if (mode.id === GAME_MODE_IDS.night || mode.id === GAME_MODE_IDS.peaceful) {
    return {
      primary: { label: 'Restan', value: formatTime(mode.rules.durationSeconds - elapsedTime) },
      secondary: {
        label: mode.id === GAME_MODE_IDS.peaceful ? 'Pipis+' : 'Puntos',
        value: String(mode.id === GAME_MODE_IDS.peaceful ? state.collectedPipis : state.score),
      },
    };
  }

  return {
    primary: { label: 'Tiempo', value: formatTime(elapsedTime) },
    secondary: { label: 'Modo', value: mode.shortLabel },
  };
}

export function updateWaveSpawns(mode, state, { deltaTime, foxesAlive, maxFoxes }) {
  if (mode.id !== GAME_MODE_IDS.foxWaves || state.wavesComplete) {
    return { count: 0, speedMultiplier: 1 };
  }

  if (state.pendingWaveFoxes <= 0 && foxesAlive <= 0) {
    state.completedWaves = state.wave;

    if (state.wave >= mode.rules.maxWaves) {
      state.wavesComplete = true;
      return { count: 0, speedMultiplier: 1 };
    }

    state.wave += 1;
    state.pendingWaveFoxes = getWaveSize(mode, state.wave);
    state.waveRestTimer = getWaveRest(mode, state.wave);
    state.waveSpawnTimer = 0;
  }

  if (state.waveRestTimer > 0) {
    state.waveRestTimer = Math.max(0, state.waveRestTimer - deltaTime);
    return { count: 0, speedMultiplier: 1 };
  }

  state.waveSpawnTimer = Math.max(0, state.waveSpawnTimer - deltaTime);
  if (state.waveSpawnTimer > 0 || state.pendingWaveFoxes <= 0) {
    return { count: 0, speedMultiplier: 1 };
  }

  const availableSlots = Math.max(0, maxFoxes - foxesAlive);
  const count = Math.min(mode.rules.spawnBatchSize, state.pendingWaveFoxes, availableSlots);
  if (count <= 0) return { count: 0, speedMultiplier: 1 };

  state.pendingWaveFoxes -= count;
  state.waveSpawnTimer = mode.rules.spawnIntervalSeconds;

  return { count, speedMultiplier: getWaveSpeedMultiplier(mode, state.wave) };
}

export function shouldUseStandardFoxSpawns(mode) {
  return Boolean(mode.rules.standardFoxSpawns) && !mode.rules.peaceful;
}

export function getEggSpawnInterval(mode, baseInterval) {
  return Math.max(0.35, baseInterval * (mode.rules.eggSpawnMultiplier ?? 1));
}

export function getFoxSpawnInterval(mode, baseInterval) {
  return Math.max(0.45, baseInterval * (mode.rules.foxSpawnMultiplier ?? 1));
}

export function getEggDuration(mode, baseDuration) {
  return baseDuration * (mode.rules.eggDurationMultiplier ?? 1);
}

export function getFoxSpeed(mode, baseSpeed, extraMultiplier = 1) {
  return baseSpeed * (mode.rules.foxSpeedMultiplier ?? 1) * extraMultiplier;
}

export function getModeVisuals(mode) {
  if (mode.id !== GAME_MODE_IDS.night) return null;

  return {
    nightAlpha: mode.rules.nightOverlayAlpha,
    spotlightRadius: mode.rules.spotlightRadius,
  };
}

export function buildModeResult(mode, state, { elapsedTime, chickens, outcome }) {
  const base = {
    elapsedTime,
    outcome,
    modeLabel: mode.label,
    tracksBestTime: Boolean(mode.rules.tracksBestTime),
  };

  if (mode.id === GAME_MODE_IDS.collect10) {
    return {
      ...base,
      title: outcome === 'victory' ? '¡10 Pipis conseguidas!' : 'Las Pipis cayeron',
      summary: `Has incubado ${state.collectedPipis}/${mode.rules.targetPipis} Pipis en ${formatTime(
        elapsedTime,
      )}.`,
      detailLabel: 'Tiempo',
      detailValue: formatTime(elapsedTime),
    };
  }

  if (mode.id === GAME_MODE_IDS.timeAttack || mode.id === GAME_MODE_IDS.fever) {
    return {
      ...base,
      title: outcome === 'time' ? 'Tiempo agotado' : 'Las Pipis cayeron',
      summary: `Has conseguido ${state.collectedPipis} Pipis y ${state.score} puntos.`,
      detailLabel: mode.id === GAME_MODE_IDS.fever ? 'Puntos fiebre' : 'Pipis conseguidas',
      detailValue: String(mode.id === GAME_MODE_IDS.fever ? state.score : state.collectedPipis),
    };
  }

  if (mode.id === GAME_MODE_IDS.combo) {
    return {
      ...base,
      title: 'Racha terminada',
      summary: `Puntuación combo ${state.comboScore} con una racha final de ${state.comboStreak}.`,
      detailLabel: 'Puntos combo',
      detailValue: String(state.comboScore),
    };
  }

  if (mode.id === GAME_MODE_IDS.foxWaves) {
    return {
      ...base,
      title: outcome === 'victory' ? 'Oleadas superadas' : 'Oleada interrumpida',
      summary: `Has superado ${state.completedWaves}/${mode.rules.maxWaves} oleadas. Pipis restantes: ${chickens}.`,
      detailLabel: 'Oleada',
      detailValue: `${state.completedWaves}/${mode.rules.maxWaves}`,
    };
  }

  if (mode.id === GAME_MODE_IDS.onePipi) {
    return {
      ...base,
      title: 'Racha perfecta terminada',
      summary: `Has aguantado ${formatTime(elapsedTime)} con una sola Pipi y ${state.score} puntos.`,
      detailLabel: 'Tiempo perfecto',
      detailValue: formatTime(elapsedTime),
    };
  }

  if (mode.id === GAME_MODE_IDS.night) {
    return {
      ...base,
      title: outcome === 'time' ? 'Noche completada' : 'Las Pipis cayeron',
      summary: `Has sumado ${state.score} puntos nocturnos y ${state.collectedPipis} Pipis.`,
      detailLabel: 'Puntos nocturnos',
      detailValue: String(state.score),
    };
  }

  if (mode.id === GAME_MODE_IDS.peaceful) {
    return {
      ...base,
      title: 'Tiempo pacífico agotado',
      summary: `Has conseguido ${state.collectedPipis} Pipis sin amenaza de zorros.`,
      detailLabel: 'Pipis conseguidas',
      detailValue: String(state.collectedPipis),
    };
  }

  return {
    ...base,
    title: 'Las Pipis cayeron',
    summary: `Has sobrevivido ${formatTime(elapsedTime)} con ${state.scaredFoxes} zorros espantados.`,
    detailLabel: 'Tiempo conseguido',
    detailValue: formatTime(elapsedTime),
  };
}

function getPointsPerPipi(mode) {
  return mode.rules.pointsPerPipi ?? 1;
}

function getPointsPerScare(mode) {
  return mode.rules.pointsPerScare ?? 0;
}

function getComboMultiplier(mode, streak) {
  return Math.min(
    mode.rules.maxMultiplier,
    1 + Math.max(0, streak - 1) * mode.rules.multiplierStep,
  );
}

function getWaveSize(mode, wave) {
  return mode.rules.startFoxes + (wave - 1) * mode.rules.foxesPerWave;
}

function getWaveRest(mode, wave) {
  return Math.max(
    mode.rules.minRestSeconds,
    mode.rules.restSeconds - (wave - 1) * mode.rules.restReductionPerWave,
  );
}

function getWaveSpeedMultiplier(mode, wave) {
  return Math.min(
    mode.rules.maxSpeedMultiplier,
    1 + (wave - 1) * mode.rules.speedMultiplierPerWave,
  );
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = String(safeSeconds % 60).padStart(2, '0');

  return `${minutes}:${remainder}`;
}
