import movementJson from './json/movement.json';
import type { MovementConfig } from './types/movement';

let cached: MovementConfig | null = null;

export function loadMovementConfig(): MovementConfig {
  if (!cached) {
    cached = movementJson as MovementConfig;
  }
  return cached;
}

export function clearMovementConfigCacheForTests(): void {
  cached = null;
}
