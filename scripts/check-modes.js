import { GAME_CONFIG } from '../src/js/config/gameConfig.js';
import { GAME_MODE_LIST, assertGameModes } from '../src/js/config/gameModes.js';
import { GameScene } from '../src/js/scenes/GameScene.js';
import {
  applyModeActions,
  createModeState,
  getModeFinish,
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

    const state = createModeState(mode);

    if (!state) throw new Error(`${mode.id} no puede inicializar estado.`);

    applyModeActions(mode, state, { hatched: 1, scared: 1 });
    updateModeTimers(mode, state, 0.16);

    const finish = getModeFinish(mode, state, {
      elapsedTime: mode.rules.durationSeconds ?? 1,
      chickens: level.initialChickens,
    });

    if (mode.id === 'time-attack' && finish?.outcome !== 'time') {
      throw new Error('Contrarreloj no finaliza por tiempo.');
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
