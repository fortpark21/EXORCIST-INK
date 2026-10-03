import { createPhaserGame } from './render/createPhaserGame';

const parent = document.getElementById('game-container');
if (!parent) {
  throw new Error('Missing #game-container element');
}

createPhaserGame(parent);
