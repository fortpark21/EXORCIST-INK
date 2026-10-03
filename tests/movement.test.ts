import { describe, expect, it } from 'vitest';
import { SIM_FIXED_DT_MS } from '../src/data/constants';
import { loadMovementConfig } from '../src/data/movementConfig';
import { GameSimulation } from '../src/sim/GameSimulation';
import { normalizeDirection, rawVectorFromInput } from '../src/sim/movement/direction';
import { tickHeroMovement, type HeroSimState } from '../src/sim/movement/updateHeroMovement';
import type { InputFrame } from '../src/sim/types/InputFrame';
import { EMPTY_INPUT_FRAME } from '../src/sim/types/InputFrame';
import { buildOpenTestArena } from '../src/sim/world/buildTestArena';

const dtSec = SIM_FIXED_DT_MS / 1000;
const movement = loadMovementConfig();
/** Spec: full walk speed after ~8 ticks; warm 15 ticks before measuring cruise distance. */
const WARMUP_TICKS = 15;
const MEASURE_TICKS = 60;

function runHeroTicks(hero: HeroSimState, input: InputFrame, count: number): HeroSimState {
  const world = buildOpenTestArena();
  let state = hero;
  for (let i = 0; i < count; i += 1) {
    state = tickHeroMovement(state, input, dtSec, movement, world);
  }
  return state;
}

describe('hero movement (sim)', () => {
  const baseHero: HeroSimState = {
    pivotX: 512,
    pivotY: 512,
    velX: 0,
    velY: 0,
    facing: 4,
    animState: 'idle',
    walkAnimFps: movement.animation.walk.fps,
  };

  it('walks ~180px in 1s cardinal at full speed', () => {
    const right: InputFrame = { ...EMPTY_INPUT_FRAME, right: true };
    const warmed = runHeroTicks(baseHero, right, WARMUP_TICKS);
    const startX = warmed.pivotX;
    const end = runHeroTicks(warmed, right, MEASURE_TICKS);
    expect(end.pivotX - startX).toBeGreaterThanOrEqual(178);
    expect(end.pivotX - startX).toBeLessThanOrEqual(182);
  });

  it('walks ~180px in 1s diagonal at full speed', () => {
    const downRight: InputFrame = { ...EMPTY_INPUT_FRAME, right: true, down: true };
    const warmed = runHeroTicks(baseHero, downRight, WARMUP_TICKS);
    const startX = warmed.pivotX;
    const startY = warmed.pivotY;
    const end = runHeroTicks(warmed, downRight, MEASURE_TICKS);
    const dist = Math.hypot(end.pivotX - startX, end.pivotY - startY);
    expect(dist).toBeGreaterThanOrEqual(178);
    expect(dist).toBeLessThanOrEqual(182);
  });

  it('cancels opposite horizontal keys', () => {
    const { rawX } = rawVectorFromInput({ ...EMPTY_INPUT_FRAME, left: true, right: true });
    expect(rawX).toBe(0);
    const end = runHeroTicks(baseHero, { ...EMPTY_INPUT_FRAME, left: true, right: true }, 30);
    expect(end.pivotX).toBeCloseTo(baseHero.pivotX, 0);
  });

  it('keeps facing when input released', () => {
    let hero = runHeroTicks(baseHero, { ...EMPTY_INPUT_FRAME, down: true }, 10);
    const facingAfterMove = hero.facing;
    hero = runHeroTicks(hero, { ...EMPTY_INPUT_FRAME }, 10);
    expect(hero.facing).toBe(facingAfterMove);
    expect(facingAfterMove).toBe(0);
  });

  it('normalizes diagonal direction components', () => {
    const { dirX, dirY } = normalizeDirection(1, 1);
    expect(dirX).toBeCloseTo(movement.player.diagonalComponent, 5);
    expect(dirY).toBeCloseTo(movement.player.diagonalComponent, 5);
  });

  it('GameSimulation integrates on placeholder town without throwing', () => {
    const sim = new GameSimulation();
    sim.setInputFrame({ ...EMPTY_INPUT_FRAME, up: true });
    sim.fixedUpdate(SIM_FIXED_DT_MS);
    expect(sim.getSnapshot().tick).toBe(1);
  });
});
