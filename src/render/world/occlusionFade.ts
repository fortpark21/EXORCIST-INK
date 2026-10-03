import { loadMovementConfig } from '../../data/movementConfig';
import { getPropDef } from '../../data/worldData';
import type { HeroSnapshot } from '../../sim/GameSimulation';
import type { PlacedProp } from '../../data/types/world';
import { aabbFromPivot, aabbOverlap } from '../../sim/collision/aabb';

const movementCfg = loadMovementConfig();
const occlusionCfg = movementCfg.occlusion;
const hurtCollider = movementCfg.playerColliders.hurt;

export function computePropAlpha(
  prop: PlacedProp,
  hero: HeroSnapshot,
  currentAlpha: number,
  dtMs: number,
  holdTicksRemaining: number,
): { alpha: number; holdTicksRemaining: number } {
  const def = getPropDef(prop.propId);
  if (!def.fadeable || !def.occlusionRect) {
    return { alpha: 1, holdTicksRemaining: 0 };
  }

  const heroDepth = Math.round(hero.pivotY * 10);
  const propDepth = Math.round(prop.pivotY * 10);
  if (propDepth <= heroDepth) {
    return fadeToward(currentAlpha, 1, dtMs, holdTicksRemaining, false);
  }

  const hurtBox = aabbFromPivot(hero.pivotX, hero.pivotY, hurtCollider);
  const occBox = aabbFromPivot(prop.pivotX, prop.pivotY, def.occlusionRect);
  const overlapping = aabbOverlap(hurtBox, occBox);

  return fadeToward(currentAlpha, overlapping ? occlusionCfg.fadeAlpha : 1, dtMs, holdTicksRemaining, overlapping);
}

function fadeToward(
  current: number,
  target: number,
  dtMs: number,
  holdTicksRemaining: number,
  conditionActive: boolean,
): { alpha: number; holdTicksRemaining: number } {
  let hold = holdTicksRemaining;
  if (conditionActive) {
    hold = occlusionCfg.holdTicks;
  } else if (hold > 0) {
    hold -= 1;
    target = current > occlusionCfg.fadeAlpha ? occlusionCfg.fadeAlpha : target;
  }

  const durationMs = target < current ? occlusionCfg.fadeInMs : occlusionCfg.fadeOutMs;
  const step = dtMs / durationMs;
  if (current < target) {
    return { alpha: Math.min(target, current + step), holdTicksRemaining: hold };
  }
  return { alpha: Math.max(target, current - step), holdTicksRemaining: hold };
}
