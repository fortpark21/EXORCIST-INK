import { migrateSaveFromUnknown } from '../../sim/save/migrate';
import { deserializeSave, serializeSave, STORAGE_KEY } from '../../sim/save/serialize';
import { createDefaultSaveV1, type SaveDataLatest } from '../../sim/save/types';

export type LoadSaveResult =
  | { ok: true; save: SaveDataLatest; recovered: boolean }
  | { ok: false; save: SaveDataLatest; reason: string };

export function loadSaveFromStorage(): LoadSaveResult {
  if (typeof localStorage === 'undefined') {
    return { ok: false, save: createDefaultSaveV1(), reason: 'no_local_storage' };
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return { ok: false, save: createDefaultSaveV1(), reason: 'empty' };
  }

  try {
    const direct = deserializeSave(raw);
    return { ok: true, save: direct, recovered: false };
  } catch {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      const migrated = migrateSaveFromUnknown(null);
      if (!migrated.ok) {
        return { ok: false, save: migrated.fallback, reason: 'corrupt_json' };
      }
      return { ok: true, save: migrated.save, recovered: false };
    }

    const migrated = migrateSaveFromUnknown(parsed);
    if (migrated.ok) {
      writeSaveToStorage(migrated.save);
      return { ok: true, save: migrated.save, recovered: true };
    }
    writeSaveToStorage(migrated.fallback);
    return { ok: false, save: migrated.fallback, reason: migrated.reason };
  }
}

export function writeSaveToStorage(save: SaveDataLatest): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  const payload = serializeSave({
    ...save,
    updatedAt: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, payload);
}
