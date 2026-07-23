// Pack adapter: la costura entre la maquinaria del método (agnóstica al stack)
// y el pack de stack del proyecto. El proyecto lo declara en
// docs/foundation/pack.json (viaja con el snapshot de la suite); sin archivo
// —o con archivo roto— rigen los defaults del pack de referencia ts-monorepo,
// que reproducen el comportamiento previo al corte. Contrato de campos:
// docs/foundation/15-principios-agent-first.md.
//
// Consumidores: pre-tool-use (stackGuards), post-tool-use (loopCommandRegexes),
// stop (sourceFileRegex, feedbackLoop), check-acs (testFileRegex, codeRoots).
// Merge superficial: un campo presente en pack.json reemplaza el default
// completo (incluido el objeto loopCommandRegexes).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const DEFAULT_PACK = {
  pack: 'ts-monorepo',
  feedbackLoop: 'pnpm check && pnpm test',
  loopCommandRegexes: {
    check: '\\b(?:pnpm|npm|yarn|bun)\\s+run\\s+check\\b|\\b(?:pnpm|npm|yarn)\\s+check\\b',
    test: '\\b(?:pnpm|npm|yarn|bun)\\s+run\\s+test\\b|\\b(?:pnpm|npm|yarn)\\s+test\\b',
  },
  sourceFileRegex: '\\.(ts|tsx)$',
  testFileRegex: '\\.test\\.tsx?$',
  codeRoots: ['apps', 'packages'],
  stackGuards: ['guard-deps', 'guard-migrations'],
};

export function loadPack(root) {
  if (!root) return { ...DEFAULT_PACK, __fromFile: false };
  try {
    const parsed = JSON.parse(readFileSync(join(root, 'docs', 'foundation', 'pack.json'), 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('shape');
    return { ...DEFAULT_PACK, ...parsed, __fromFile: true };
  } catch {
    return { ...DEFAULT_PACK, __fromFile: false };
  }
}

export function safeRegex(source, fallback) {
  try {
    return new RegExp(source);
  } catch {
    return fallback;
  }
}
