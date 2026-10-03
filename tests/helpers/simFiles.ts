import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function listTypeScriptFilesUnder(rootDir: string): string[] {
  const results: string[] = [];

  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
        results.push(full);
      }
    }
  }

  walk(rootDir);
  return results;
}

export function fileImportsPhaser(filePath: string): boolean {
  const content = readFileSync(filePath, 'utf-8');
  const patterns = [
    /from\s+['"]phaser['"]/,
    /import\s*\(\s*['"]phaser['"]\s*\)/,
    /require\s*\(\s*['"]phaser['"]\s*\)/,
  ];
  return patterns.some((re) => re.test(content));
}
