/** PLACEHOLDER markers — replace values when Phum delivers balance sheets. */

export type PlaceholderNote = 'PLACEHOLDER_AWAITING_DESIGN';

export type MonsterDef = {
  id: string;
  displayName: string;
  /** PLACEHOLDER_AWAITING_DESIGN */
  maxHp: number;
  moveSpeed: number;
  attackPower: number;
  expReward: number;
  dropTableId: string;
  _note?: PlaceholderNote;
};

export type ItemDef = {
  id: string;
  displayName: string;
  stackMax: number;
  sellPrice: number;
  _note?: PlaceholderNote;
};

export type EquipmentSlot = 'weapon' | 'head' | 'body' | 'accessory';

export type EquipmentDef = {
  id: string;
  displayName: string;
  slot: EquipmentSlot;
  attackBonus: number;
  defenseBonus: number;
  requiredLevel: number;
  _note?: PlaceholderNote;
};

export type SkillDef = {
  id: string;
  displayName: string;
  cooldownMs: number;
  manaCost: number;
  damageMultiplier: number;
  _note?: PlaceholderNote;
};

export type ExpCurve = {
  id: string;
  /** Total exp required to reach each level index (1-based level uses index level-1). */
  cumulativeExpByLevel: number[];
  _note?: PlaceholderNote;
};

export type DropEntry = {
  itemId: string;
  weight: number;
  minQty: number;
  maxQty: number;
};

export type DropTable = {
  id: string;
  entries: DropEntry[];
  _note?: PlaceholderNote;
};

export type ShopEntry = {
  itemId: string;
  buyPrice: number;
  stock: number | 'unlimited';
};

export type ShopDef = {
  id: string;
  displayName: string;
  entries: ShopEntry[];
  _note?: PlaceholderNote;
};

export type UpgradeDef = {
  id: string;
  targetEquipmentId: string;
  materialItemId: string;
  materialQty: number;
  goldCost: number;
  successRate: number;
  _note?: PlaceholderNote;
};

export type GameDataBundle = {
  monsters: MonsterDef[];
  items: ItemDef[];
  equipment: EquipmentDef[];
  skills: SkillDef[];
  expCurves: ExpCurve[];
  dropTables: DropTable[];
  shops: ShopDef[];
  upgrades: UpgradeDef[];
};
