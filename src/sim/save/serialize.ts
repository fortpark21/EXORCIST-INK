import { SAVE_VERSION_LATEST, type SaveDataLatest, type SaveDataV1 } from './types';

const STORAGE_KEY = 'exorcist_ink_save_v1';

export function serializeSave(save: SaveDataLatest): string {
  return JSON.stringify(save);
}

export function deserializeSave(raw: string): SaveDataLatest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new SaveParseError('invalid_json');
  }
  return assertSaveShape(parsed);
}

function assertSaveShape(value: unknown): SaveDataV1 {
  if (typeof value !== 'object' || value === null) {
    throw new SaveParseError('not_object');
  }
  const obj = value as Record<string, unknown>;
  if (obj.version !== SAVE_VERSION_LATEST) {
    throw new SaveParseError('wrong_version_inline');
  }
  if (typeof obj.createdAt !== 'string' || typeof obj.updatedAt !== 'string') {
    throw new SaveParseError('missing_timestamps');
  }
  if (typeof obj.player !== 'object' || obj.player === null) {
    throw new SaveParseError('missing_player');
  }
  const player = obj.player as Record<string, unknown>;
  if (
    typeof player.displayName !== 'string' ||
    player.classId !== 'sword_exorcist' ||
    typeof player.level !== 'number' ||
    typeof player.exp !== 'number'
  ) {
    throw new SaveParseError('invalid_player');
  }
  return {
    version: 1,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    player: {
      displayName: player.displayName,
      classId: 'sword_exorcist',
      level: player.level,
      exp: player.exp,
    },
  };
}

export class SaveParseError extends Error {
  constructor(readonly code: string) {
    super(`Save parse error: ${code}`);
    this.name = 'SaveParseError';
  }
}

export { STORAGE_KEY };
