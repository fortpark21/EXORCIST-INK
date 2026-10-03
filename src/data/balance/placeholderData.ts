import type { GameDataBundle } from '../types/defs';

/**
 * PLACEHOLDER_AWAITING_DESIGN — numeric balance from Phum (docs/design).
 * System code must read via loadGameData(); do not hardcode balance elsewhere.
 */
export const PLACEHOLDER_GAME_DATA: GameDataBundle = {
  monsters: [
    {
      id: 'mob_placeholder_slime',
      displayName: 'PLACEHOLDER มารทดสอบ',
      maxHp: 999,
      moveSpeed: 999,
      attackPower: 999,
      expReward: 999,
      dropTableId: 'drop_placeholder',
      _note: 'PLACEHOLDER_AWAITING_DESIGN',
    },
  ],
  items: [
    {
      id: 'item_placeholder_herb',
      displayName: 'PLACEHOLDER สมุนไพร',
      stackMax: 99,
      sellPrice: 999,
      _note: 'PLACEHOLDER_AWAITING_DESIGN',
    },
  ],
  equipment: [
    {
      id: 'eq_placeholder_sword',
      displayName: 'PLACEHOLDER ดาบเริ่มต้น',
      slot: 'weapon',
      attackBonus: 999,
      defenseBonus: 0,
      requiredLevel: 1,
      _note: 'PLACEHOLDER_AWAITING_DESIGN',
    },
  ],
  skills: [
    {
      id: 'skill_placeholder_slash',
      displayName: 'PLACEHOLDER ฟันหมึก',
      cooldownMs: 999,
      manaCost: 999,
      damageMultiplier: 999,
      _note: 'PLACEHOLDER_AWAITING_DESIGN',
    },
  ],
  expCurves: [
    {
      id: 'exp_curve_default',
      cumulativeExpByLevel: [0, 100, 250, 999999],
      _note: 'PLACEHOLDER_AWAITING_DESIGN',
    },
  ],
  dropTables: [
    {
      id: 'drop_placeholder',
      entries: [
        {
          itemId: 'item_placeholder_herb',
          weight: 1,
          minQty: 1,
          maxQty: 1,
        },
      ],
      _note: 'PLACEHOLDER_AWAITING_DESIGN',
    },
  ],
  shops: [
    {
      id: 'shop_placeholder_town',
      displayName: 'PLACEHOLDER ร้านเมือง',
      entries: [
        {
          itemId: 'item_placeholder_herb',
          buyPrice: 999,
          stock: 'unlimited',
        },
      ],
      _note: 'PLACEHOLDER_AWAITING_DESIGN',
    },
  ],
  upgrades: [
    {
      id: 'upgrade_placeholder_sword_1',
      targetEquipmentId: 'eq_placeholder_sword',
      materialItemId: 'item_placeholder_herb',
      materialQty: 999,
      goldCost: 999,
      successRate: 0.5,
      _note: 'PLACEHOLDER_AWAITING_DESIGN',
    },
  ],
};
