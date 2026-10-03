import { describe, expect, it } from 'vitest';
import { migrateSaveFromUnknown } from '../src/sim/save/migrate';
import { deserializeSave, SaveParseError, serializeSave } from '../src/sim/save/serialize';
import { createDefaultSaveV1 } from '../src/sim/save/types';

describe('save v1 serialize/deserialize', () => {
  it('round-trips unchanged', () => {
    const original = createDefaultSaveV1(new Date('2026-01-01T00:00:00.000Z'));
    const json = serializeSave(original);
    const restored = deserializeSave(json);
    expect(restored).toEqual(original);
  });

  it('rejects corrupt json', () => {
    expect(() => deserializeSave('{not json')).toThrow(SaveParseError);
  });

  it('rejects wrong version for strict deserialize', () => {
    const v2 = { ...createDefaultSaveV1(), version: 2 };
    expect(() => deserializeSave(JSON.stringify(v2))).toThrow(SaveParseError);
  });
});

describe('save migration', () => {
  it('accepts valid v1 object', () => {
    const v1 = createDefaultSaveV1();
    const result = migrateSaveFromUnknown(v1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.save.version).toBe(1);
      expect(result.migratedFrom).toBe(1);
    }
  });

  it('falls back on unknown version without crashing', () => {
    const weird = { version: 999, player: {} };
    const result = migrateSaveFromUnknown(weird);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fallback.version).toBe(1);
    }
  });

  it('falls back on corrupt shapes', () => {
    const result = migrateSaveFromUnknown(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('not_object');
    }
  });
});
