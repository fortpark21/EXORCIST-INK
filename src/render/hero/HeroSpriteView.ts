import Phaser from 'phaser';
import { loadMovementConfig } from '../../data/movementConfig';
import type { HeroSnapshot } from '../../sim/GameSimulation';
import {
  facingIndexToAssetDir,
  heroAnimationKey,
  heroTextureKey,
  HERO_SPRITE_ORIGIN_X,
  HERO_SPRITE_ORIGIN_Y,
} from './heroAssetCatalog';

export class HeroSpriteView {
  readonly sprite: Phaser.GameObjects.Sprite;
  private lastAnimState: HeroSnapshot['animState'] = 'idle';
  private lastFacing = 0;
  private lastAnimKey = '';

  constructor(scene: Phaser.Scene, hero: HeroSnapshot) {
    const dir = facingIndexToAssetDir(hero.facing);
    const texture = heroTextureKey('idle', dir, 1);
    this.sprite = scene.add.sprite(hero.pivotX, hero.pivotY, texture);
    this.sprite.setOrigin(HERO_SPRITE_ORIGIN_X, HERO_SPRITE_ORIGIN_Y);
    this.syncFromSnapshot(hero, true);
  }

  setPosition(pivotX: number, pivotY: number): void {
    this.sprite.setPosition(pivotX, pivotY);
  }

  setDepth(depth: number): void {
    this.sprite.setDepth(depth);
  }

  syncFromSnapshot(hero: HeroSnapshot, force = false): void {
    const dir = facingIndexToAssetDir(hero.facing);
    const animKey = heroAnimationKey(hero.animState, dir);
    const movement = loadMovementConfig();

    if (!force && animKey === this.lastAnimKey) {
      this.applyTimeScale(hero);
      return;
    }

    const walkFacingChange =
      movement.animation.keepFrameOnWalkDirectionChange &&
      this.lastAnimState === 'walk' &&
      hero.animState === 'walk' &&
      this.lastFacing !== hero.facing;

    const frameIndex = this.sprite.anims.currentFrame?.index ?? 0;

    if (walkFacingChange) {
      this.sprite.play(animKey, true);
      const anim = this.sprite.anims.currentAnim;
      const frames = anim?.frames;
      if (frames && frames.length > 0) {
        const keep = frames[Math.min(frameIndex, frames.length - 1)];
        if (keep) {
          this.sprite.anims.setCurrentFrame(keep);
        }
      }
    } else {
      this.sprite.play(animKey);
    }

    this.applyTimeScale(hero);
    this.lastAnimKey = animKey;
    this.lastAnimState = hero.animState;
    this.lastFacing = hero.facing;
  }

  private applyTimeScale(hero: HeroSnapshot): void {
    const movement = loadMovementConfig();
    if (hero.animState === 'walk') {
      const base = movement.animation.walk.fps;
      this.sprite.anims.timeScale = hero.walkAnimFps / base;
    } else {
      this.sprite.anims.timeScale = 1;
    }
  }
}
