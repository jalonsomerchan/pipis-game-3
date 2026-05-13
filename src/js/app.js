import '../css/main.css';
import { Game } from './game/Game.js';

const game = new Game({
  canvas: document.querySelector('#game-canvas'),
  overlay: document.querySelector('#overlay'),
  panels: document.querySelectorAll('[data-panel]'),
  playButton: document.querySelector('#play-button'),
  tutorialButton: document.querySelector('#tutorial-button'),
  tutorialDonePlayButton: document.querySelector('#tutorial-done-play-button'),
  tutorialDoneMenuButton: document.querySelector('#tutorial-done-menu-button'),
  shareButton: document.querySelector('#share-button'),
  levelButtons: document.querySelectorAll('[data-level]'),
  backButton: document.querySelector('#back-button'),
  retryButton: document.querySelector('#retry-button'),
  menuButton: document.querySelector('#menu-button'),
  pauseButton: document.querySelector('#pause-button'),
  resumeButton: document.querySelector('#resume-button'),
  pauseTutorialButton: document.querySelector('#pause-tutorial-button'),
  quitButton: document.querySelector('#quit-button'),
  loadingTitle: document.querySelector('#loading-title'),
  resultTime: document.querySelector('#result-time'),
  bestTime: document.querySelector('#best-time'),
});

window.game = game;
