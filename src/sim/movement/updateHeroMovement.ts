import type { MovementConfig } from '../../data/types/movement';
import { resolveHeroAnimState, walkAnimFps, type HeroAnimState } from '../animation/heroAnimState';
import type { CollisionWorld } from '../collision/CollisionWorld';
import { applyMovementWithCollision } from '../collision/resolveMovement';
import type { InputFrame } from '../types/InputFrame';
import { facingFromRaw, normalizeDirection, rawVectorFromInput } from './direction';
import { updateVelocity } from './velocity';

export type HeroSimState = {
  pivotX: number;
  pivotY: number;
  velX: number;
  velY: number;
  facing: number;
  animState: HeroAnimState;
  walkAnimFps: number;
};

export function tickHeroMovement(
  hero: HeroSimState,
  input: InputFrame,
  dtSec: number,
  config: MovementConfig,
  world: CollisionWorld,
): HeroSimState {
  const { rawX, rawY } = rawVectorFromInput(input);
  const { dirX, dirY } = normalizeDirection(rawX, rawY);
  const facing = facingFromRaw(rawX, rawY, config, hero.facing);

  const vel = updateVelocity({ velX: hero.velX, velY: hero.velY }, dirX, dirY, dtSec, config);
  const moved = applyMovementWithCollision(
    { pivotX: hero.pivotX, pivotY: hero.pivotY, velX: vel.velX, velY: vel.velY },
    dtSec,
    world,
    config,
  );

  const animState = resolveHeroAnimState(moved.velX, moved.velY, config);
  return {
    pivotX: moved.pivotX,
    pivotY: moved.pivotY,
    velX: moved.velX,
    velY: moved.velY,
    facing,
    animState,
    walkAnimFps: walkAnimFps(moved.velX, moved.velY, config),
  };
}
