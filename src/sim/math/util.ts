export function moveToward(current: number, target: number, maxDelta: number): number {
  const diff = target - current;
  if (Math.abs(diff) <= maxDelta) {
    return target;
  }
  return current + Math.sign(diff) * maxDelta;
}

export function magnitude(x: number, y: number): number {
  return Math.hypot(x, y);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function signNonZero(value: number): number {
  if (value > 0) return 1;
  if (value < 0) return -1;
  return 0;
}
