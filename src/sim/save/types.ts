export const SAVE_VERSION_LATEST = 1 as const;

export type SaveDataV1 = {
  version: 1;
  createdAt: string;
  updatedAt: string;
  /** PLACEHOLDER — balance from data files once Phum delivers numbers. */
  player: {
    displayName: string;
    classId: 'sword_exorcist';
    level: number;
    exp: number;
  };
};

export type SaveDataLatest = SaveDataV1;

export function createDefaultSaveV1(now: Date = new Date()): SaveDataV1 {
  const iso = now.toISOString();
  return {
    version: 1,
    createdAt: iso,
    updatedAt: iso,
    player: {
      displayName: 'ผู้ฝึกตน',
      classId: 'sword_exorcist',
      level: 1,
      exp: 0,
    },
  };
}
