import type { AabbColliderDef, MovementConfig } from '../../data/types/movement';
import { aabbFromPivot, aabbOverlap } from './aabb';
import type { CollisionWorld } from './CollisionWorld';

export type MovementBody = {
  pivotX: number;
  pivotY: number;
  velX: number;
  velY: number;
};

function overlapsAnySolid(
  world: CollisionWorld,
  pivotX: number,
  pivotY: number,
  footCollider: AabbColliderDef,
): boolean {
  const heroBox = aabbFromPivot(pivotX, pivotY, footCollider);
  const margin = Math.max(footCollider.widthPx, footCollider.heightPx) + 128;
  const solids = world.collectSolidsNear(pivotX, pivotY, margin);
  return solids.some((s) => aabbOverlap(heroBox, s.box));
}

function resolveAxisPosition(
  world: CollisionWorld,
  pivotX: number,
  pivotY: number,
  from: number,
  to: number,
  axis: 'x' | 'y',
  footCollider: AabbColliderDef,
): number {
  if (!overlapsAnySolid(world, axis === 'x' ? to : pivotX, axis === 'y' ? to : pivotY, footCollider)) {
    return to;
  }
  let lo = from;
  let hi = to;
  for (let i = 0; i < 12; i += 1) {
    const mid = (lo + hi) / 2;
    const testX = axis === 'x' ? mid : pivotX;
    const testY = axis === 'y' ? mid : pivotY;
    if (overlapsAnySolid(world, testX, testY, footCollider)) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return lo;
}

export function applyMovementWithCollision(
  body: MovementBody,
  dtSec: number,
  world: CollisionWorld,
  config: MovementConfig,
): MovementBody {
  const foot = config.playerColliders.foot;
  const { subStepMaxPx, subStepTriggerPx } = config.collision;

  let pivotX = body.pivotX;
  let pivotY = body.pivotY;
  let velX = body.velX;
  let velY = body.velY;

  const stepDist = Math.hypot(velX * dtSec, velY * dtSec);
  const steps =
    stepDist > subStepTriggerPx ? Math.max(1, Math.ceil(stepDist / subStepMaxPx)) : 1;
  const subDt = dtSec / steps;

  for (let s = 0; s < steps; s += 1) {
    const nextX = pivotX + velX * subDt;
    const resolvedX = resolveAxisPosition(world, pivotX, pivotY, pivotX, nextX, 'x', foot);
    if (resolvedX !== nextX) {
      velX = 0;
    }
    pivotX = resolvedX;

    const nextY = pivotY + velY * subDt;
    const resolvedY = resolveAxisPosition(world, pivotX, pivotY, pivotY, nextY, 'y', foot);
    if (resolvedY !== nextY) {
      velY = 0;
    }
    pivotY = resolvedY;
  }

  return { pivotX, pivotY, velX, velY };
}
