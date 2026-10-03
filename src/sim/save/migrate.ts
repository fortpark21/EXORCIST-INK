import { createDefaultSaveV1, SAVE_VERSION_LATEST, type SaveDataLatest } from './types';

export type MigrationResult =
  | { ok: true; save: SaveDataLatest; migratedFrom: number | 'unknown' }
  | { ok: false; reason: string; fallback: SaveDataLatest };

type MigrationStep = {
  from: number;
  to: number;
  migrate: (raw: Record<string, unknown>) => Record<string, unknown>;
};

/**
 * Chain migrations v1 → v2 → … Add new steps here when save schema changes.
 * PLACEHOLDER: only v1 exists; step list is empty until v2 is defined.
 */
const MIGRATION_CHAIN: MigrationStep[] = [];

export function migrateSaveFromUnknown(raw: unknown): MigrationResult {
  if (typeof raw !== 'object' || raw === null) {
    return fallback('not_object');
  }

  const record = raw as Record<string, unknown>;
  const version = record.version;

  if (typeof version !== 'number') {
    return fallback('missing_version');
  }

  if (version > SAVE_VERSION_LATEST) {
    return fallback('future_version');
  }

  let current = { ...record };
  let fromVersion = version;

  if (version === SAVE_VERSION_LATEST && MIGRATION_CHAIN.length === 0) {
    return validateV1(current, fromVersion);
  }

  while (typeof current.version === 'number' && current.version < SAVE_VERSION_LATEST) {
    const step = MIGRATION_CHAIN.find((s) => s.from === current.version);
    if (!step) {
      return fallback('unknown_migration_path');
    }
    current = step.migrate(current);
    current.version = step.to;
  }

  if (current.version !== SAVE_VERSION_LATEST) {
    return fallback('migration_incomplete');
  }

  return validateV1(current, fromVersion);
}

function validateV1(record: Record<string, unknown>, migratedFrom: number | 'unknown'): MigrationResult {
  try {
    const save = parseV1Strict(record);
    return { ok: true, save, migratedFrom };
  } catch {
    return fallback('invalid_v1_shape');
  }
}

function parseV1Strict(record: Record<string, unknown>): SaveDataLatest {
  if (record.version !== 1) {
    throw new Error('not_v1');
  }
  if (typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') {
    throw new Error('timestamps');
  }
  const player = record.player;
  if (typeof player !== 'object' || player === null) {
    throw new Error('player');
  }
  const p = player as Record<string, unknown>;
  if (
    typeof p.displayName !== 'string' ||
    p.classId !== 'sword_exorcist' ||
    typeof p.level !== 'number' ||
    typeof p.exp !== 'number'
  ) {
    throw new Error('player_fields');
  }
  return {
    version: 1,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    player: {
      displayName: p.displayName as string,
      classId: 'sword_exorcist',
      level: p.level as number,
      exp: p.exp as number,
    },
  };
}

function fallback(reason: string): MigrationResult {
  return {
    ok: false,
    reason,
    fallback: createDefaultSaveV1(),
  };
}

/** Example stub for future v1→v2 — not registered until SaveDataV2 exists. */
export function migrateV1ToV2Stub(v1: Record<string, unknown>): Record<string, unknown> {
  return {
    ...v1,
    version: 2,
    // PLACEHOLDER: map fields when v2 schema lands
  };
}
