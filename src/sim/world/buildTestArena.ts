import { loadMovementConfig } from '../../data/movementConfig';
import { CollisionWorld } from '../collision/CollisionWorld';

/** Open floor for unit tests — no props, no blocked tiles. */
export function buildOpenTestArena(widthTiles = 64, heightTiles = 64): CollisionWorld {
  const movement = loadMovementConfig();
  const blocked = new Array<boolean>(widthTiles * heightTiles).fill(false);
  return new CollisionWorld({
    tileSizePx: movement.collision.tileSizePx,
    widthTiles,
    heightTiles,
    blockedTiles: blocked,
    placedProps: [],
    spatialCellSizePx: movement.collision.broadphase.cellSizePx,
  });
}
