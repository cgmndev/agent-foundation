// Guard: no implementation on a stale plan (12-guia-specs §8).
// Fires on writes into apps/ or packages/; verifies the hash chain of every
// specs/active feature. Draft artifacts (null hashes) don't bind — the guard
// only enforces chains that /activate-spec stamped.
//
// Sample payload: {"tool_name":"Edit","tool_input":{"file_path":"apps/api/src/x.ts",...},"cwd":"/proj"}

import { findRoot } from '../lib/project-root.mjs';
import { checkAllActive } from '../lib/spec-chain.mjs';

const CODE_PATH = /(^|\/)(apps|packages)\//;

export function check(input) {
  const tool = input.tool_name;
  if (tool !== 'Write' && tool !== 'Edit' && tool !== 'MultiEdit') return null;
  const path = input.tool_input?.file_path ?? '';
  if (!CODE_PATH.test(path)) return null;

  const root = findRoot(input.cwd || process.cwd());
  if (!root) return null;
  const problems = checkAllActive(root);
  if (!problems.length) return null;

  return {
    action: 'deny',
    reason:
      'drift-check: cadena spec→plan→tasks desfasada:\n- ' +
      problems.join('\n- ') +
      '\nRegenera/revisa con /change-spec (o restampa con spec-hash.mjs vía /activate-spec) antes de implementar.',
  };
}
