import { getMapById } from '../../data/worldData';
import type { PlacedProp } from '../../data/types/world';
import { CollisionWorld } from '../collision/CollisionWorld';
import { loadMovementConfig } from '../../data/movementConfig';

export type PlaceholderTownLayout = {
  mapId: string;
  collisionWorld: CollisionWorld;
  placedProps: PlacedProp[];
  spawnPivotX: number;
  spawnPivotY: number;
  spawnFacing: number;
  mapWidthPx: number;
  mapHeightPx: number;
};

/** Placeholder layout — rects/colors in render; collision from spec data. */
export function buildPlaceholderTown(): PlaceholderTownLayout {
  const map = getMapById('town_silverink');
  const movement = loadMovementConfig();
  const tileSize = movement.collision.tileSizePx;
  const w = map.widthTiles;
  const h = map.heightTiles;
  const blocked = new Array<boolean>(w * h).fill(false);

  const border = map.borderBlockedTiles;
  for (let ty = 0; ty < h; ty += 1) {
    for (let tx = 0; tx < w; tx += 1) {
      if (tx < border || ty < border || tx >= w - border || ty >= h - border) {
        blocked[ty * w + tx] = true;
      }
    }
  }

  // Demo wall segment (market edge) — wall_stone tiles
  for (let ty = 22; ty <= 42; ty += 1) {
    blocked[ty * w + 10] = true;
  }

  const shrineEntry = map.entryPoints.find((e) => e.id === 'respawn_shrine');
  const spawnPivotX = shrineEntry?.worldX ?? map.widthPx / 2;
  const spawnPivotY = shrineEntry?.worldY ?? map.heightPx / 2;
  const spawnFacing = shrineEntry?.facing ?? 0;

  const placedProps: PlacedProp[] = [
    { instanceId: 'shrine_1', propId: 'shrine', pivotX: spawnPivotX, pivotY: spawnPivotY - 64 },
    { instanceId: 'house_1', propId: 'house_small', pivotX: spawnPivotX - 320, pivotY: spawnPivotY - 160 },
    { instanceId: 'house_2', propId: 'house_small', pivotX: spawnPivotX + 320, pivotY: spawnPivotY - 160 },
    { instanceId: 'tree_1', propId: 'tree_large', pivotX: spawnPivotX + 180, pivotY: spawnPivotY + 120 },
    { instanceId: 'tree_2', propId: 'tree_large', pivotX: spawnPivotX - 200, pivotY: spawnPivotY + 200 },
    { instanceId: 'gate_1', propId: 'gate_town', pivotX: 40 * tileSize + 32, pivotY: 62 * tileSize + 32 },
    { instanceId: 'crate_1', propId: 'crate', pivotX: spawnPivotX + 80, pivotY: spawnPivotY + 40 },
  ];

  const collisionWorld = new CollisionWorld({
    tileSizePx: tileSize,
    widthTiles: w,
    heightTiles: h,
    blockedTiles: blocked,
    placedProps,
    spatialCellSizePx: movement.collision.broadphase.cellSizePx,
  });

  return {
    mapId: map.id,
    collisionWorld,
    placedProps,
    spawnPivotX,
    spawnPivotY,
    spawnFacing,
    mapWidthPx: map.widthPx,
    mapHeightPx: map.heightPx,
  };
}
