import { describe, expect, it } from 'vitest';
import { loadMovementConfig } from '../src/data/movementConfig';
import { allKeyboardCodeToPhaserMappings, phaserKeyFromCode } from '../src/render/input/phaserKeyFromCode';

function allInputMappingCodes(): string[] {
  const mapping = loadMovementConfig().inputMapping;
  const codes = new Set<string>();
  for (const list of Object.values(mapping)) {
    for (const code of list) {
      codes.add(code);
    }
  }
  return [...codes];
}

describe('phaserKeyFromCode', () => {
  it('maps movement.json KeyboardEvent.code values to Phaser key names', () => {
    expect(phaserKeyFromCode('KeyW')).toBe('W');
    expect(phaserKeyFromCode('KeyA')).toBe('A');
    expect(phaserKeyFromCode('KeyS')).toBe('S');
    expect(phaserKeyFromCode('KeyD')).toBe('D');
    expect(phaserKeyFromCode('KeyJ')).toBe('J');
    expect(phaserKeyFromCode('KeyQ')).toBe('Q');
    expect(phaserKeyFromCode('KeyE')).toBe('E');
    expect(phaserKeyFromCode('ArrowUp')).toBe('UP');
    expect(phaserKeyFromCode('ArrowDown')).toBe('DOWN');
    expect(phaserKeyFromCode('ArrowLeft')).toBe('LEFT');
    expect(phaserKeyFromCode('ArrowRight')).toBe('RIGHT');
    expect(phaserKeyFromCode('Space')).toBe('SPACE');
  });

  it('covers every code listed in movement.json inputMapping', () => {
    const map = allKeyboardCodeToPhaserMappings();
    const codes = allInputMappingCodes();
    expect(codes.length).toBeGreaterThan(0);
    for (const code of codes) {
      expect(map[code]).toBeDefined();
      expect(phaserKeyFromCode(code)).toBe(map[code]);
    }
  });

  it('throws on unknown codes', () => {
    expect(() => phaserKeyFromCode('KeyZ')).toThrow(/Unsupported KeyboardEvent.code/);
  });
});
