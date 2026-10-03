import type { AabbColliderDef } from '../../data/types/movement';

export type Aabb = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export function aabbFromPivot(pivotX: number, pivotY: number, collider: AabbColliderDef): Aabb {
  const cx = pivotX + collider.offsetXPx;
  const cy = pivotY + collider.offsetYPx;
  const halfW = collider.widthPx / 2;
  const halfH = collider.heightPx / 2;
  return {
    left: cx - halfW,
    right: cx + halfW,
    top: cy - halfH,
    bottom: cy + halfH,
  };
}

export function aabbOverlap(a: Aabb, b: Aabb): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
