import Phaser from 'phaser';
import { HERO_SPRITE_PX } from '../../data/constants';
import { loadMovementConfig } from '../../data/movementConfig';

/** Pivot in sprite sheet — feet at (48, 88) per art spec. */
export const HERO_SPRITE_ORIGIN_X = 0.5;
export const HERO_SPRITE_ORIGIN_Y = 88 / HERO_SPRITE_PX;

const HERO_ASSET_ROOT = 'assets/hero';
const ALL_ASSET_DIRS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;

export type HeroAnimKind = 'idle' | 'walk';

function padFrame(frame1Based: number): string {
  return String(frame1Based).padStart(2, '0');
}

export function heroFileName(kind: HeroAnimKind, dir: string, frame1Based: number): string {
  return `hero_sword_${kind}_${dir}_${padFrame(frame1Based)}.png`;
}

export function heroTextureKey(kind: HeroAnimKind, dir: string, frame1Based: number): string {
  return `hero_${kind}_${dir}_${padFrame(frame1Based)}`;
}

export function heroAnimationKey(kind: HeroAnimKind, dir: string): string {
  return `hero_${kind}_${dir}`;
}

/** Facing index 0–7 (movement.json indexOrder) → asset dir suffix (s, sw, …). */
export function facingIndexToAssetDir(facingIndex: number): string {
  const dirs = loadMovementConfig().directions.assetDirByIndex;
  const clamped = ((facingIndex % dirs.length) + dirs.length) % dirs.length;
  return dirs[clamped] ?? 's';
}

export function preloadHeroAssets(loader: Phaser.Loader.LoaderPlugin): void {
  const movement = loadMovementConfig();
  const idleFrames = movement.animation.idle.frames;
  const walkFrames = movement.animation.walk.frames;

  for (const dir of ALL_ASSET_DIRS) {
    for (let f = 1; f <= idleFrames; f += 1) {
      const file = heroFileName('idle', dir, f);
      loader.image(heroTextureKey('idle', dir, f), `${HERO_ASSET_ROOT}/${file}`);
    }
    for (let f = 1; f <= walkFrames; f += 1) {
      const file = heroFileName('walk', dir, f);
      loader.image(heroTextureKey('walk', dir, f), `${HERO_ASSET_ROOT}/${file}`);
    }
  }
}

export function registerHeroAnimations(scene: Phaser.Scene): void {
  const movement = loadMovementConfig();
  const idleFrames = movement.animation.idle.frames;
  const walkFrames = movement.animation.walk.frames;

  for (const dir of ALL_ASSET_DIRS) {
    const idleKey = heroAnimationKey('idle', dir);
    if (!scene.anims.exists(idleKey)) {
      scene.anims.create({
        key: idleKey,
        frames: Array.from({ length: idleFrames }, (_, i) => ({
          key: heroTextureKey('idle', dir, i + 1),
        })),
        frameRate: movement.animation.idle.fps,
        repeat: -1,
      });
    }

    const walkKey = heroAnimationKey('walk', dir);
    if (!scene.anims.exists(walkKey)) {
      scene.anims.create({
        key: walkKey,
        frames: Array.from({ length: walkFrames }, (_, i) => ({
          key: heroTextureKey('walk', dir, i + 1),
        })),
        frameRate: movement.animation.walk.fps,
        repeat: -1,
      });
    }
  }
}
