import { PLACEHOLDER_GAME_DATA } from './balance/placeholderData';
import type { GameDataBundle } from './types/defs';
import { assertValidGameData } from './validator';

let cached: GameDataBundle | null = null;

/**
 * Loads validated balance data. Swap source to JSON imports when sheets stabilize.
 */
export function loadGameData(): GameDataBundle {
  if (cached) {
    return cached;
  }
  const data = structuredClone(PLACEHOLDER_GAME_DATA);
  assertValidGameData(data);
  cached = data;
  return cached;
}

export function clearGameDataCacheForTests(): void {
  cached = null;
}
