import { SIM_FIXED_DT_MS } from '../../data/constants';

export type SimTickCallback = (fixedDeltaMs: number, tickIndex: number) => void;

/**
 * Fixed-timestep accumulator — runs independently of render frame rate.
 * Pure logic; safe to unit-test in Node.
 */
export class FixedTimestepLoop {
  private accumulatorMs = 0;
  private tickIndex = 0;

  constructor(private readonly onTick: SimTickCallback) {}

  /** @param frameDeltaMs Wall-clock delta from the previous update (render or headless driver). */
  update(frameDeltaMs: number): void {
    const clamped = Math.min(frameDeltaMs, 250);
    this.accumulatorMs += clamped;

    while (this.accumulatorMs >= SIM_FIXED_DT_MS) {
      this.onTick(SIM_FIXED_DT_MS, this.tickIndex);
      this.tickIndex += 1;
      this.accumulatorMs -= SIM_FIXED_DT_MS;
    }
  }

  getTickIndex(): number {
    return this.tickIndex;
  }

  reset(): void {
    this.accumulatorMs = 0;
    this.tickIndex = 0;
  }
}
