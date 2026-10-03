import { GameSimulation } from '../sim/GameSimulation';
import { FixedTimestepLoop } from '../sim/tick/FixedTimestepLoop';
import type { SimulationSnapshot } from '../sim/GameSimulation';
import type { InputFrame } from '../sim/types/InputFrame';
import { loadSaveFromStorage, writeSaveToStorage } from './persistence/localSave';

export type SimBridgeListener = (snapshot: SimulationSnapshot) => void;

/**
 * Connects headless simulation to Phaser render loop.
 * Render reads snapshots; sim never imports Phaser.
 */
export class SimRenderBridge {
  private readonly simulation = new GameSimulation();
  private readonly tickLoop: FixedTimestepLoop;
  private listeners = new Set<SimBridgeListener>();
  private lastSnapshot: SimulationSnapshot;
  private running = false;

  constructor() {
    this.lastSnapshot = this.simulation.getSnapshot();
    this.tickLoop = new FixedTimestepLoop((_dt) => {
      this.simulation.fixedUpdate(_dt);
      this.publish();
    });
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    const loaded = loadSaveFromStorage();
    this.simulation.loadSave(loaded.save);
    this.publish();
  }

  /** Latest input from keyboard / touch stub — applied on each sim tick until replaced. */
  submitInputFrame(input: InputFrame): void {
    this.simulation.setInputFrame(input);
  }

  /** Called from Phaser scene update with frame delta. */
  driveFrame(frameDeltaMs: number): void {
    if (!this.running) {
      return;
    }
    this.tickLoop.update(frameDeltaMs);
  }

  subscribe(listener: SimBridgeListener): () => void {
    this.listeners.add(listener);
    listener(this.lastSnapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): SimulationSnapshot {
    return this.lastSnapshot;
  }

  persistSave(): void {
    writeSaveToStorage(this.simulation.getSave());
  }

  private publish(): void {
    this.lastSnapshot = this.simulation.getSnapshot();
    for (const listener of this.listeners) {
      listener(this.lastSnapshot);
    }
  }
}
