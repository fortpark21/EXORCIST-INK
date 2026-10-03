import { describe, expect, it } from 'vitest';
import { loadMovementConfig } from '../src/data/movementConfig';
import { facingIndexToAssetDir } from '../src/render/hero/heroAssetCatalog';

describe('heroAssetCatalog', () => {
  it('maps facing index to asset dir per movement.json assetDirByIndex', () => {
    const dirs = loadMovementConfig().directions.assetDirByIndex;
    expect(dirs).toEqual(['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se']);
    for (let i = 0; i < dirs.length; i += 1) {
      expect(facingIndexToAssetDir(i)).toBe(dirs[i]);
    }
  });
});
