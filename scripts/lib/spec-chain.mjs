// Integrity of the spec→plan→tasks hash chain for a feature directory.
// Chain (docs/foundation/12-guia-specs.md §2):
//   plan.spec_hash  must equal spec.source_hash
//   tasks.plan_hash must equal sha256(plan body)
// Null hashes (drafts) don't bind: the chain only exists once /activate-spec
// stamps it. An active spec whose body no longer matches its own source_hash
// was edited outside the protocol.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { bodyHash, getField } from './frontmatter.mjs';

export function checkFeature(dir) {
  const problems = [];
  const name = basename(dir);
  const specPath = join(dir, 'spec.md');
  const planPath = join(dir, 'plan.md');
  const tasksPath = join(dir, 'tasks.md');

  let sourceHash = null;
  if (existsSync(specPath)) {
    const spec = readFileSync(specPath, 'utf8');
    sourceHash = getField(spec, 'source_hash');
    const status = getField(spec, 'status');
    if (status === 'active' && sourceHash && bodyHash(specPath) !== sourceHash) {
      problems.push(`${name}: spec.md editada sin restampar source_hash (usa /change-spec)`);
    }
  }
  if (existsSync(planPath)) {
    const specHash = getField(readFileSync(planPath, 'utf8'), 'spec_hash');
    if (specHash && sourceHash && specHash !== sourceHash) {
      problems.push(`${name}: plan.md desfasado respecto a spec.md (spec_hash ≠ source_hash)`);
    }
    if (existsSync(tasksPath)) {
      const planHash = getField(readFileSync(tasksPath, 'utf8'), 'plan_hash');
      if (planHash && planHash !== bodyHash(planPath)) {
        problems.push(`${name}: tasks.md desfasado respecto a plan.md (plan_hash ≠ hash del plan)`);
      }
    }
  }
  return problems;
}

export function checkAllActive(root) {
  const activeDir = join(root, 'specs', 'active');
  if (!existsSync(activeDir)) return [];
  return readdirSync(activeDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => checkFeature(join(activeDir, entry.name)));
}
