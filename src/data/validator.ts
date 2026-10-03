import type {
  DropTable,
  EquipmentDef,
  ExpCurve,
  GameDataBundle,
  ItemDef,
  MonsterDef,
  ShopDef,
  SkillDef,
  UpgradeDef,
} from './types/defs';

export type ValidationIssue = { path: string; message: string };

export function validateGameData(data: GameDataBundle): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const monsterIds = new Set<string>();
  for (const m of data.monsters) {
    issues.push(...validateMonster(m));
    if (monsterIds.has(m.id)) {
      issues.push({ path: `monsters.${m.id}`, message: 'duplicate id' });
    }
    monsterIds.add(m.id);
  }

  const itemIds = collectIds(data.items, 'items', issues);
  collectIds(data.equipment, 'equipment', issues);
  collectIds(data.skills, 'skills', issues);
  collectIds(data.expCurves, 'expCurves', issues);
  collectIds(data.dropTables, 'dropTables', issues);
  collectIds(data.shops, 'shops', issues);
  collectIds(data.upgrades, 'upgrades', issues);

  for (const table of data.dropTables) {
    issues.push(...validateDropTable(table, itemIds));
  }

  for (const shop of data.shops) {
    for (const entry of shop.entries) {
      if (!itemIds.has(entry.itemId)) {
        issues.push({ path: `shops.${shop.id}`, message: `unknown itemId ${entry.itemId}` });
      }
    }
  }

  return issues;
}

function collectIds<T extends { id: string }>(rows: T[], label: string, issues: ValidationIssue[]): Set<string> {
  const ids = new Set<string>();
  for (const row of rows) {
    if (!row.id.trim()) {
      issues.push({ path: `${label}`, message: 'empty id' });
    }
    if (ids.has(row.id)) {
      issues.push({ path: `${label}.${row.id}`, message: 'duplicate id' });
    }
    ids.add(row.id);
  }
  return ids;
}

function validateMonster(m: MonsterDef): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (m.maxHp <= 0) issues.push({ path: `monsters.${m.id}.maxHp`, message: 'must be > 0' });
  if (m.moveSpeed < 0) issues.push({ path: `monsters.${m.id}.moveSpeed`, message: 'must be >= 0' });
  return issues;
}

function validateDropTable(table: DropTable, itemIds: Set<string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (table.entries.length === 0) {
    issues.push({ path: `dropTables.${table.id}`, message: 'empty entries' });
  }
  for (const entry of table.entries) {
    if (!itemIds.has(entry.itemId)) {
      issues.push({ path: `dropTables.${table.id}`, message: `unknown itemId ${entry.itemId}` });
    }
    if (entry.weight <= 0) {
      issues.push({ path: `dropTables.${table.id}`, message: 'weight must be > 0' });
    }
  }
  return issues;
}

export function assertValidGameData(data: GameDataBundle): void {
  const issues = validateGameData(data);
  if (issues.length > 0) {
    const detail = issues.map((i) => `${i.path}: ${i.message}`).join('; ');
    throw new Error(`Invalid game data: ${detail}`);
  }
}

export type { EquipmentDef, ExpCurve, ItemDef, MonsterDef, ShopDef, SkillDef, UpgradeDef };
