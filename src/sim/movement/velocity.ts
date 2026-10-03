import type { MovementConfig } from '../../data/types/movement';
import { moveToward, magnitude, signNonZero } from '../math/util';

export type VelocityState = {
  velX: number;
  velY: number;
};

export function updateVelocity(
  vel: VelocityState,
  dirX: number,
  dirY: number,
  dtSec: number,
  config: MovementConfig,
): VelocityState {
  const { walkSpeedPxPerSec: speed, accelPxPerSec2: accel, decelPxPerSec2: decel, stopEpsilonPxPerSec: stopEpsilon, snappyReverse } =
    config.player;

  const targetVelX = dirX * speed;
  const targetVelY = dirY * speed;
  const hasInput = dirX !== 0 || dirY !== 0;

  let rateX = hasInput ? accel : decel;
  let rateY = hasInput ? accel : decel;

  if (snappyReverse && hasInput) {
    if (signNonZero(targetVelX) !== 0 && signNonZero(vel.velX) !== 0 && signNonZero(targetVelX) !== signNonZero(vel.velX)) {
      rateX = decel;
    }
    if (signNonZero(targetVelY) !== 0 && signNonZero(vel.velY) !== 0 && signNonZero(targetVelY) !== signNonZero(vel.velY)) {
      rateY = decel;
    }
  }

  let velX = moveToward(vel.velX, targetVelX, rateX * dtSec);
  let velY = moveToward(vel.velY, targetVelY, rateY * dtSec);

  if (!hasInput && magnitude(velX, velY) < stopEpsilon) {
    velX = 0;
    velY = 0;
  }

  return { velX, velY };
}
