import { GAME_CONFIG } from '../src/js/config/gameConfig.js';
import { assertBalanceConfig, summarizeBalance } from '../src/js/config/difficultyCurves.js';

assertBalanceConfig(GAME_CONFIG);

const rows = summarizeBalance(GAME_CONFIG).map((row) => ({
  level: row.levelKey,
  minute: row.elapsedSeconds / 60,
  firstFox: row.firstFoxDelay,
  firstEgg: row.firstEggDelay,
  foxEvery: Number(row.foxSpawnInterval.toFixed(2)),
  eggEvery: Number(row.eggSpawnInterval.toFixed(2)),
  eggLasts: Number(row.eggDuration.toFixed(2)),
  foxSpeed: Number(row.foxSpeed.toFixed(1)),
  maxFoxes: row.maxFoxes,
}));

console.table(rows);
console.log('Balance smoke checks OK');
