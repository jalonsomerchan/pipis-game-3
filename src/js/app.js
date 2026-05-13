import '../css/main.css';
import { Game } from './game/Game.js';

const game = new Game({
  canvas: document.querySelector('#game-canvas'),
  overlay: document.querySelector('#overlay'),
  panels: document.querySelectorAll('[data-panel]'),
  playButton: document.querySelector('#play-button'),
  shareButton: document.querySelector('#share-button'),
  levelButtons: document.querySelectorAll('[data-level]'),
  backButton: document.querySelector('#back-button'),
  retryButton: document.querySelector('#retry-button'),
  menuButton: document.querySelector('#menu-button'),
  loadingTitle: document.querySelector('#loading-title'),
  time: document.querySelector('#time'),
  chickens: document.querySelector('#chickens'),
  eggs: document.querySelector('#eggs'),
  foxes: document.querySelector('#foxes'),
  level: document.querySelector('#level'),
  resultTime: document.querySelector('#result-time'),
  bestTime: document.querySelector('#best-time'),
});

window.game = game;
