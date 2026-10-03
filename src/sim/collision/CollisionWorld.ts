import type { AabbColliderDef } from '../../data/types/movement';
import type { PlacedProp } from '../../data/types/world';
import { getPropDef } from '../../data/worldData';
import { aabbFromPivot, aabbOverlap, type Aabb } from './aabb';

export type SolidAabb = {
  id: string;
  box: Aabb;
};

type PropInstance = {
  instanceId: string;
  propId: string;
  pivotX: number;
  pivotY: number;
  colliders: AabbColliderDef[];
};

/**
 * Tile + prop solids for hero foot collision (headless, no Phaser).
 */
export class CollisionWorld {
  private readonly tileSizePx: number;
  private readonly widthTiles: number;
  private readonly heightTiles: number;
  private readonly blocked: boolean[];
  private readonly propInstances: PropInstance[] = [];
  private readonly cellSizePx: number;
  private readonly propGrid = new Map<string, PropInstance[]>();

  constructor(options: {
    tileSizePx: number;
    widthTiles: number;
    heightTiles: number;
    blockedTiles: boolean[];
    placedProps: PlacedProp[];
    spatialCellSizePx: number;
  }) {
    this.tileSizePx = options.tileSizePx;
    this.widthTiles = options.widthTiles;
    this.heightTiles = options.heightTiles;
    this.blocked = options.blockedTiles;
    this.cellSizePx = options.spatialCellSizePx;

    for (const placed of options.placedProps) {
      const def = getPropDef(placed.propId);
      const inst: PropInstance = {
        instanceId: placed.instanceId,
        propId: placed.propId,
        pivotX: placed.pivotX,
        pivotY: placed.pivotY,
        colliders: def.colliders,
      };
      this.propInstances.push(inst);
      for (const collider of inst.colliders) {
        const box = aabbFromPivot(inst.pivotX, inst.pivotY, collider);
        this.insertPropIntoGrid(inst, box);
      }
    }
  }

  collectSolidsNear(pivotX: number, pivotY: number, marginPx: number): SolidAabb[] {
    const solids: SolidAabb[] = [];
    const queryBox: Aabb = {
      left: pivotX - marginPx,
      right: pivotX + marginPx,
      top: pivotY - marginPx,
      bottom: pivotY + marginPx,
    };

    this.collectBlockedTilesInAabb(queryBox, solids);
    this.collectPropsInAabb(queryBox, solids);
    return solids;
  }

  private collectBlockedTilesInAabb(query: Aabb, out: SolidAabb[]): void {
    const t = this.tileSizePx;
    const x0 = Math.max(0, Math.floor(query.left / t));
    const x1 = Math.min(this.widthTiles - 1, Math.floor(query.right / t));
    const y0 = Math.max(0, Math.floor(query.top / t));
    const y1 = Math.min(this.heightTiles - 1, Math.floor(query.bottom / t));

    for (let ty = y0; ty <= y1; ty += 1) {
      for (let tx = x0; tx <= x1; tx += 1) {
        if (!this.isTileBlocked(tx, ty)) {
          continue;
        }
        const left = tx * t;
        const top = ty * t;
        out.push({
          id: `tile_${tx}_${ty}`,
          box: { left, top, right: left + t, bottom: top + t },
        });
      }
    }
  }

  private collectPropsInAabb(query: Aabb, out: SolidAabb[]): void {
    const seen = new Set<string>();
    const cx = Math.floor((query.left + query.right) / 2 / this.cellSizePx);
    const cy = Math.floor((query.top + query.bottom) / 2 / this.cellSizePx);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const key = `${cx + dx},${cy + dy}`;
        const bucket = this.propGrid.get(key);
        if (!bucket) continue;
        for (const inst of bucket) {
          for (let ci = 0; ci < inst.colliders.length; ci += 1) {
            const collider = inst.colliders[ci];
            if (!collider) continue;
            const box = aabbFromPivot(inst.pivotX, inst.pivotY, collider);
            if (!aabbOverlap(query, box)) continue;
            const sid = `${inst.instanceId}_${ci}`;
            if (seen.has(sid)) continue;
            seen.add(sid);
            out.push({ id: sid, box });
          }
        }
      }
    }
  }

  private insertPropIntoGrid(inst: PropInstance, box: Aabb): void {
    const x0 = Math.floor(box.left / this.cellSizePx);
    const x1 = Math.floor(box.right / this.cellSizePx);
    const y0 = Math.floor(box.top / this.cellSizePx);
    const y1 = Math.floor(box.bottom / this.cellSizePx);
    for (let cy = y0; cy <= y1; cy += 1) {
      for (let cx = x0; cx <= x1; cx += 1) {
        const key = `${cx},${cy}`;
        const list = this.propGrid.get(key) ?? [];
        if (!list.includes(inst)) {
          list.push(inst);
        }
        this.propGrid.set(key, list);
      }
    }
  }

  isTileBlocked(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.widthTiles || ty >= this.heightTiles) {
      return true;
    }
    const idx = ty * this.widthTiles + tx;
    return this.blocked[idx] ?? true;
  }

  getPlacedProps(): readonly PlacedProp[] {
    return this.propInstances.map((p) => ({
      instanceId: p.instanceId,
      propId: p.propId,
      pivotX: p.pivotX,
      pivotY: p.pivotY,
    }));
  }
}
