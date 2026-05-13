import { GAME_CONFIG } from '../src/js/config/gameConfig.js';
import { GAME_MODE_IDS, GAME_MODE_LIST, assertGameModes } from '../src/js/config/gameModes.js';
import { GameScene } from '../src/js/scenes/GameScene.js';
import {
  applyModeActions,
  createModeState,
  getModeFinish,
  getModeInitialChickens,
  shouldUseStandardFoxSpawns,
  updateModeTimers,
  updateWaveSpawns,
} from '../src/js/modes/modeRules.js';

assertGameModes(GAME_CONFIG.levels);

const scene = new GameScene({
  input: {
    consumeTaps: () => [],
    consumeKeyboardScare: () => false,
  },
  sprites: {},
  onStats: () => {},
  onGameOver: () => {},
  onTutorialComplete: () => {},
  onFeedback: () => {},
});

for (const mode of GAME_MODE_LIST) {
  for (const [levelKey, level] of Object.entries(GAME_CONFIG.levels)) {
    scene.reset(levelKey, mode.id);
    if (scene.gameMode.id !== mode.id) {
      throw new Error(`${mode.id} no se reinicia correctamente en ${levelKey}.`);
    }

    if (scene.chickens.length !== getModeInitialChickens(mode, level)) {
      throw new Error(`${mode.id} no respeta las Pipis iniciales en ${levelKey}.`);
    }

    const state = createModeState(mode);

    if (!state) throw new Error(`${mode.id} no puede inicializar estado.`);

    applyModeActions(mode, state, { hatched: 1, scared: 1 });
    updateModeTimers(mode, state, 0.16);

    const finish = getModeFinish(mode, state, {
      elapsedTime: mode.rules.durationSeconds ?? 1,
      chickens: level.initialChickens,
    });

    if (mode.rules.durationSeconds && finish?.outcome !== 'time') {
      throw new Error(`${mode.id} no finaliza por tiempo configurado.`);
    }

    const wavePlan = updateWaveSpawns(mode, state, {
      deltaTime: 0.16,
      foxesAlive: 0,
      maxFoxes: Math.min(level.maxFoxesCap, mode.rules.maxSimultaneousFoxes ?? level.maxFoxesCap),
    });

    if (
      wavePlan.count < 0 ||
      wavePlan.count > (mode.rules.maxSimultaneousFoxes ?? level.maxFoxesCap)
    ) {
      throw new Error(`${mode.id} genera un spawn imposible en ${levelKey}.`);
    }
  }
}

const onePipi = GAME_MODE_LIST.find((mode) => mode.id === GAME_MODE_IDS.onePipi);
if (!onePipi || onePipi.rules.initialChickens !== 1 || !onePipi.rules.suddenDeath) {
  throw new Error('Un solo pipi necesita una Pipi inicial y muerte súbita.');
}

const peaceful = GAME_MODE_LIST.find((mode) => mode.id === GAME_MODE_IDS.peaceful);
if (!peaceful || shouldUseStandardFoxSpawns(peaceful)) {
  throw new Error('Pacífico no debe generar amenazas estándar.');
}

const night = GAME_MODE_LIST.find((mode) => mode.id === GAME_MODE_IDS.night);
if (!night || night.rules.nightOverlayAlpha >= 0.75 || night.rules.spotlightRadius <= 80) {
  throw new Error('Noche necesita contraste y foco jugables.');
}

const fever = GAME_MODE_LIST.find((mode) => mode.id === GAME_MODE_IDS.fever);
if (!fever || fever.rules.durationSeconds > 45 || fever.rules.eggSpawnMultiplier >= 1) {
  throw new Error('Fiebre debe ser corta y con más huevos de lo normal.');
}

scene.resetTutorial();
if (scene.mode !== 'tutorial') throw new Error('El tutorial no se reinicia correctamente.');

console.table(
  GAME_MODE_LIST.map((mode) => ({
    id: mode.id,
    label: mode.label,
    objective: mode.objective,
  })),
);
console.log('Game mode smoke checks OK');
