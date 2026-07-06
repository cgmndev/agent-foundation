// Locate the project root from a starting directory: nearest ancestor that
// contains .git, specs/ or package.json (first hit wins, walking upward).
// Hooks receive `cwd` in their payload; skills run from the project root.

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function findRoot(start, markers = ['.git', 'specs', 'package.json']) {
  let dir = start || process.cwd();
  for (;;) {
    if (markers.some((m) => existsSync(join(dir, m)))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
