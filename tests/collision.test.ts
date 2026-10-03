import { describe, expect, it } from 'vitest';
import { loadMovementConfig } from '../src/data/movementConfig';
import { CollisionWorld } from '../src/sim/collision/CollisionWorld';
import { applyMovementWithCollision } from '../src/sim/collision/resolveMovement';
import { SIM_FIXED_DT_MS } from '../src/data/constants';

describe('collision (sim)', () => {
  it('slides along vertical wall when moving diagonal into it', () => {
    const movement = loadMovementConfig();
    const w = 32;
    const h = 32;
    const blocked = new Array<boolean>(w * h).fill(false);
    for (let y = 0; y < h; y += 1) {
      blocked[y * w + 15] = true;
    }

    const world = new CollisionWorld({
      tileSizePx: movement.collision.tileSizePx,
      widthTiles: w,
      heightTiles: h,
      blockedTiles: blocked,
      placedProps: [],
      spatialCellSizePx: movement.collision.broadphase.cellSizePx,
    });

    const dt = SIM_FIXED_DT_MS / 1000;
    let body = {
      pivotX: 14 * movement.collision.tileSizePx + 32,
      pivotY: 16 * movement.collision.tileSizePx + 32,
      velX: movement.player.walkSpeedPxPerSec,
      velY: movement.player.walkSpeedPxPerSec,
    };

    for (let i = 0; i < 30; i += 1) {
      body = applyMovementWithCollision(body, dt, world, movement);
    }

    expect(body.velX).toBe(0);
    expect(body.pivotY).toBeGreaterThan(16 * movement.collision.tileSizePx + 32);
  });

  it('walks under tree_large canopy (trunk collider only)', () => {
    const movement = loadMovementConfig();
    const w = 40;
    const h = 40;
    const blocked = new Array<boolean>(w * h).fill(false);
    const treeX = 20 * movement.collision.tileSizePx + 32;
    const treeY = 20 * movement.collision.tileSizePx + 32;

    const world = new CollisionWorld({
      tileSizePx: movement.collision.tileSizePx,
      widthTiles: w,
      heightTiles: h,
      blockedTiles: blocked,
      placedProps: [{ instanceId: 't1', propId: 'tree_large', pivotX: treeX, pivotY: treeY }],
      spatialCellSizePx: movement.collision.broadphase.cellSizePx,
    });

    const dt = SIM_FIXED_DT_MS / 1000;
    let body = {
      pivotX: treeX,
      pivotY: treeY + 80,
      velX: 0,
      velY: -movement.player.walkSpeedPxPerSec,
    };

    for (let i = 0; i < 40; i += 1) {
      body = applyMovementWithCollision(body, dt, world, movement);
    }

    // ใต้พุ่มเข้ามาได้ แต่ลำต้น (collider 44×32, offsetY -14) ยังกั้นไม่ให้ทะลุฐานต้น
    expect(body.pivotY).toBeLessThan(treeY + 50);
    expect(body.pivotY).toBeGreaterThan(treeY + 10);
  });
});
