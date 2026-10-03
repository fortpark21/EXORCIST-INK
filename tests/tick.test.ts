import { describe, expect, it } from 'vitest';
import { FixedTimestepLoop } from '../src/sim/tick/FixedTimestepLoop';
import { SIM_FIXED_DT_MS } from '../src/data/constants';

describe('FixedTimestepLoop', () => {
  it('accumulates fixed ticks at 60Hz', () => {
    let ticks = 0;
    const loop = new FixedTimestepLoop(() => {
      ticks += 1;
    });

    loop.update(SIM_FIXED_DT_MS);
    expect(ticks).toBe(1);

    loop.update(SIM_FIXED_DT_MS * 2);
    expect(ticks).toBe(3);
  });
});
