import Phaser from 'phaser';
import { loadMovementConfig } from '../../data/movementConfig';
import type { InputFrame } from '../../sim/types/InputFrame';
import { phaserKeyFromCode } from './phaserKeyFromCode';
import { readTouchInputStub } from './touchInputStub';

const movementConfig = loadMovementConfig();
const KEY_MAP = movementConfig.inputMapping;

type ActionKeys = {
  up: Phaser.Input.Keyboard.Key[];
  down: Phaser.Input.Keyboard.Key[];
  left: Phaser.Input.Keyboard.Key[];
  right: Phaser.Input.Keyboard.Key[];
  attack: Phaser.Input.Keyboard.Key[];
  potion: Phaser.Input.Keyboard.Key[];
  interact: Phaser.Input.Keyboard.Key[];
};

const keysByKeyboard = new WeakMap<Phaser.Input.Keyboard.KeyboardPlugin, ActionKeys>();

function resolveKeys(keyboard: Phaser.Input.Keyboard.KeyboardPlugin): ActionKeys {
  let cached = keysByKeyboard.get(keyboard);
  if (!cached) {
    cached = {
      up: KEY_MAP.up.map((code) => keyboard.addKey(phaserKeyFromCode(code))),
      down: KEY_MAP.down.map((code) => keyboard.addKey(phaserKeyFromCode(code))),
      left: KEY_MAP.left.map((code) => keyboard.addKey(phaserKeyFromCode(code))),
      right: KEY_MAP.right.map((code) => keyboard.addKey(phaserKeyFromCode(code))),
      attack: KEY_MAP.attack.map((code) => keyboard.addKey(phaserKeyFromCode(code))),
      potion: KEY_MAP.potion.map((code) => keyboard.addKey(phaserKeyFromCode(code))),
      interact: KEY_MAP.interact.map((code) => keyboard.addKey(phaserKeyFromCode(code))),
    };
    keysByKeyboard.set(keyboard, cached);
  }
  return cached;
}

function anyDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
  for (const key of keys) {
    if (key.isDown) {
      return true;
    }
  }
  return false;
}

/** Build one InputFrame from keyboard OR + touch stub (same shape as spec). */
export function buildInputFrame(keyboard: Phaser.Input.Keyboard.KeyboardPlugin): InputFrame {
  const bound = resolveKeys(keyboard);
  const touch = readTouchInputStub();
  return {
    up: anyDown(bound.up) || touch.up,
    down: anyDown(bound.down) || touch.down,
    left: anyDown(bound.left) || touch.left,
    right: anyDown(bound.right) || touch.right,
    attack: anyDown(bound.attack) || touch.attack,
    potion: anyDown(bound.potion) || touch.potion,
    interact: anyDown(bound.interact) || touch.interact,
  };
}
