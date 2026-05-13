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
  modeButtons: document.querySelectorAll('[data-mode]'),
  modeBackButton: document.querySelector('#mode-back-button'),
  selectedModeTitle: document.querySelector('#selected-mode-title'),
  selectedModeDescription: document.querySelector('#selected-mode-description'),
  levelButtons: document.querySelectorAll('[data-level]'),
  backButton: document.querySelector('#back-button'),
  retryButton: document.querySelector('#retry-button'),
  menuButton: document.querySelector('#menu-button'),
  pauseButton: document.querySelector('#pause-button'),
  resumeButton: document.querySelector('#resume-button'),
  pauseTutorialButton: document.querySelector('#pause-tutorial-button'),
  quitButton: document.querySelector('#quit-button'),
  loadingTitle: document.querySelector('#loading-title'),
  resultEyebrow: document.querySelector('#result-eyebrow'),
  resultTitle: document.querySelector('#result-title'),
  resultSummary: document.querySelector('#result-summary'),
  resultTimeLabel: document.querySelector('#result-time-label'),
  resultTime: document.querySelector('#result-time'),
  bestTime: document.querySelector('#best-time'),
  feedbackStatus: document.querySelector('#feedback-status'),
});

window.game = game;
