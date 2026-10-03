import type { MovementConfig } from '../../data/types/movement';
import type { InputFrame } from '../types/InputFrame';

export type RawInputVector = {
  rawX: -1 | 0 | 1;
  rawY: -1 | 0 | 1;
};

export function rawVectorFromInput(input: InputFrame): RawInputVector {
  const rawX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const rawY = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  return {
    rawX: rawX as -1 | 0 | 1,
    rawY: rawY as -1 | 0 | 1,
  };
}

export function normalizeDirection(rawX: number, rawY: number): { dirX: number; dirY: number } {
  const len = Math.hypot(rawX, rawY);
  if (len <= 0) {
    return { dirX: 0, dirY: 0 };
  }
  return { dirX: rawX / len, dirY: rawY / len };
}

export function facingFromRaw(rawX: -1 | 0 | 1, rawY: -1 | 0 | 1, config: MovementConfig, currentFacing: number): number {
  const key = (rawX + 1) * 3 + (rawY + 1);
  const lut = config.directions.lookupTable.values;
  const idx = lut[key];
  if (idx === undefined || idx < 0) {
    return config.directions.keepFacingWhenNoInput ? currentFacing : 0;
  }
  return idx;
}
