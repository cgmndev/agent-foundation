// Guard: no implementation on a stale plan (12-guia-specs §8).
// Fires on writes into apps/ or packages/; verifies the hash chain of every
// specs/active feature. Draft artifacts (null hashes) don't bind.
//
// Verdict is ASK, not deny: without machine-readable ownership (which spec
// "owns" the edited path) a deny would also block unrelated work — hotfixes,
// no-spec changes under the Decisión 6 thresholds, or a second healthy spec —
// and a guardrail that gets bypassed habitually trains the bypass habit.
// The human decides; the signal stays. Escalation path (only with real-world
// friction evidence): scope by the plan's declared "superficie de cambio".
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
    action: 'ask',
    reason:
      'drift-check: cadena spec→plan→tasks desfasada:\n- ' +
      problems.join('\n- ') +
      '\nSi este cambio pertenece a esa spec: NO continúes — regenera/restampa con /change-spec. ' +
      'Si es trabajo ajeno (hotfix o cambio sin spec), continúa y arregla el drift aparte.',
  };
}
