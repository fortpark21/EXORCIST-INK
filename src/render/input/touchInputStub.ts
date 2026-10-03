import type { InputFrame } from '../../sim/types/InputFrame';
import { EMPTY_INPUT_FRAME } from '../../sim/types/InputFrame';

/**
 * Touch → InputFrame stub until Phum delivers on-screen control spec.
 * Render wires virtual D-pad here later; keyboard remains full fallback.
 */
export function readTouchInputStub(): InputFrame {
  return { ...EMPTY_INPUT_FRAME };
}

/** Hook for future virtual pad (Phase 1 stub API). */
export function setTouchInputStub(_partial: Partial<InputFrame>): void {
  // no-op until UI spec lands
}
