import { loadMovementConfig } from '../data/movementConfig';
import { createDefaultSaveV1, type SaveDataV1 } from './save/types';
import { tickHeroMovement, type HeroSimState } from './movement/updateHeroMovement';
import { EMPTY_INPUT_FRAME, type InputFrame } from './types/InputFrame';
import { buildPlaceholderTown, type PlaceholderTownLayout } from './world/buildPlaceholderTown';
import type { PlacedProp } from '../data/types/world';

export type HeroSnapshot = Readonly<{
  pivotX: number;
  pivotY: number;
  velX: number;
  velY: number;
  facing: number;
  animState: 'idle' | 'walk';
  walkAnimFps: number;
}>;

export type SimulationSnapshot = Readonly<{
  tick: number;
  save: SaveDataV1;
  mapId: string;
  mapWidthPx: number;
  mapHeightPx: number;
  hero: HeroSnapshot;
  placedProps: readonly PlacedProp[];
}>;

/**
 * Headless game state — no Phaser, no DOM.
 */
export class GameSimulation {
  private tick = 0;
  private save: SaveDataV1;
  private readonly movement = loadMovementConfig();
  private readonly layout: PlaceholderTownLayout;
  private hero: HeroSimState;
  private pendingInput: InputFrame = { ...EMPTY_INPUT_FRAME };

  constructor(initialSave?: SaveDataV1) {
    this.save = initialSave ?? createDefaultSaveV1();
    this.layout = buildPlaceholderTown();
    this.hero = {
      pivotX: this.layout.spawnPivotX,
      pivotY: this.layout.spawnPivotY,
      velX: 0,
      velY: 0,
      facing: this.layout.spawnFacing,
      animState: 'idle',
      walkAnimFps: this.movement.animation.walk.fps,
    };
  }

  setInputFrame(input: InputFrame): void {
    this.pendingInput = { ...input };
  }

  fixedUpdate(fixedDeltaMs: number): void {
    const dtSec = fixedDeltaMs / 1000;
    this.hero = tickHeroMovement(
      this.hero,
      this.pendingInput,
      dtSec,
      this.movement,
      this.layout.collisionWorld,
    );
    this.tick += 1;
  }

  getSnapshot(): SimulationSnapshot {
    return {
      tick: this.tick,
      save: structuredClone(this.save),
      mapId: this.layout.mapId,
      mapWidthPx: this.layout.mapWidthPx,
      mapHeightPx: this.layout.mapHeightPx,
      hero: { ...this.hero },
      placedProps: this.layout.collisionWorld.getPlacedProps(),
    };
  }

  /** Test / debug hook — read collision world without exposing mutability. */
  getCollisionWorldForTests(): PlaceholderTownLayout['collisionWorld'] {
    return this.layout.collisionWorld;
  }

  loadSave(save: SaveDataV1): void {
    this.save = structuredClone(save);
  }

  getSave(): SaveDataV1 {
    return structuredClone(this.save);
  }
}
