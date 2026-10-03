import { describe, expect, it } from 'vitest';
import { clearGameDataCacheForTests, loadGameData } from '../src/data/loader';
import { validateGameData } from '../src/data/validator';
import { PLACEHOLDER_GAME_DATA } from '../src/data/balance/placeholderData';

describe('game data loader', () => {
  it('loads placeholder bundle with no validation errors', () => {
    clearGameDataCacheForTests();
    const data = loadGameData();
    expect(validateGameData(data)).toEqual([]);
    expect(data.monsters[0]?._note).toBe('PLACEHOLDER_AWAITING_DESIGN');
  });

  it('detects duplicate ids', () => {
    const broken = structuredClone(PLACEHOLDER_GAME_DATA);
    broken.items.push({ ...broken.items[0]! });
    const issues = validateGameData(broken);
    expect(issues.some((i) => i.message === 'duplicate id')).toBe(true);
  });
});
