import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../data/constants';
import { SimRenderBridge } from '../bridge/SimRenderBridge';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldScene } from './scenes/WorldScene';

export function createPhaserGame(parent: HTMLElement): Phaser.Game {
  const bridge = new SimRenderBridge();

  const game = new Phaser.Game({
    type: Phaser.WEBGL,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: '#0a0a0a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
    scene: [BootScene, PreloadScene, TitleScene, WorldScene],
    callbacks: {
      preBoot: (gameInstance) => {
        gameInstance.registry.set('simBridge', bridge);
      },
    },
  });

  return game;
}
