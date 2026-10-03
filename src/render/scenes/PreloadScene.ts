import Phaser from 'phaser';
import type { SimRenderBridge } from '../../bridge/SimRenderBridge';
import { preloadHeroAssets, registerHeroAnimations } from '../hero/heroAssetCatalog';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const bridge = this.registry.get('simBridge') as SimRenderBridge | undefined;
    bridge?.start();

    preloadHeroAssets(this.load);
  }

  create(): void {
    registerHeroAnimations(this);
    this.scene.start('TitleScene');
  }
}
