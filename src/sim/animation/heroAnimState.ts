import type { MovementConfig } from '../../data/types/movement';
import { magnitude } from '../math/util';

export type HeroAnimState = 'idle' | 'walk';

export function resolveHeroAnimState(velX: number, velY: number, config: MovementConfig): HeroAnimState {
  const speed = magnitude(velX, velY);
  if (speed >= config.player.walkAnimThresholdPxPerSec) {
    return 'walk';
  }
  return 'idle';
}

export function walkAnimFps(velX: number, velY: number, config: MovementConfig): number {
  const speed = magnitude(velX, velY);
  const walkCfg = config.animation.walk;
  if (speed < config.player.walkSpeedPxPerSec * walkCfg.slowFpsBelowSpeedFraction) {
    return walkCfg.slowFps;
  }
  return walkCfg.fps;
}
