/**
 * movement.json stores KeyboardEvent.code (spec from Phum).
 * Phaser keyboard.addKey() expects KeyCodes names (W, UP, SPACE, …).
 */
const KEYBOARD_CODE_TO_PHASER: Readonly<Record<string, string>> = {
  KeyW: 'W',
  KeyA: 'A',
  KeyS: 'S',
  KeyD: 'D',
  KeyJ: 'J',
  KeyQ: 'Q',
  KeyE: 'E',
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  Space: 'SPACE',
};

export function phaserKeyFromCode(keyboardEventCode: string): string {
  const mapped = KEYBOARD_CODE_TO_PHASER[keyboardEventCode];
  if (mapped !== undefined) {
    return mapped;
  }
  throw new Error(`Unsupported KeyboardEvent.code for Phaser binding: ${keyboardEventCode}`);
}

/** @internal tests — full map for assertions */
export function allKeyboardCodeToPhaserMappings(): Readonly<Record<string, string>> {
  return KEYBOARD_CODE_TO_PHASER;
}
