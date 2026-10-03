import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { fileImportsPhaser, listTypeScriptFilesUnder } from './helpers/simFiles';

const SIM_ROOT = join(process.cwd(), 'src', 'sim');

describe('sim/render isolation', () => {
  it('src/sim must not import phaser', () => {
    const files = listTypeScriptFilesUnder(SIM_ROOT);
    expect(files.length).toBeGreaterThan(0);

    const offenders = files.filter((f) => fileImportsPhaser(f));
    expect(offenders).toEqual([]);
  });
});
