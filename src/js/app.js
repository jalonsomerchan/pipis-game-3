import '../css/main.css';
import { Game } from './game/Game.js';

const game = new Game({
  canvas: document.querySelector('#game-canvas'),
  scoreElement: document.querySelector('#score'),
  bestScoreElement: document.querySelector('#best-score'),
  overlayElement: document.querySelector('#overlay'),
  playButton: document.querySelector('#play-button'),
});

window.game = game;
