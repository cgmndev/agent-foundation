#!/usr/bin/env node
// PreToolUse dispatcher: one fast process per event; every guard is
// consulted and the strictest verdict wins (deny > ask > allow).
// Guards split in two tiers (15-principios): METHOD guards always run;
// STACK guards run only if the project's pack declares them
// (docs/foundation/pack.json → stackGuards; without the file, the reference
// pack activates both — previous behavior). Añadir un guardia = crear
// scripts/guards/<nombre>.mjs y listarlo aquí en su tier.
// A broken guard must never break the session: errors are swallowed.

import { appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { readHookInput, deny, ask } from '../lib/io.mjs';
import { findRoot } from '../lib/project-root.mjs';
import { loadPack } from '../lib/pack.mjs';
import * as archiveGuard from '../guards/archive-guard.mjs';
import * as blockSecrets from '../guards/block-secrets.mjs';
import * as guardDeps from '../guards/guard-deps.mjs';
import * as guardMigrations from '../guards/guard-migrations.mjs';
import * as protectMain from '../guards/protect-main.mjs';
import * as driftCheck from '../guards/drift-check.mjs';

const METHOD_GUARDS = [archiveGuard, blockSecrets, protectMain, driftCheck];
const STACK_GUARDS = { 'guard-deps': guardDeps, 'guard-migrations': guardMigrations };

const input = await readHookInput();
const root = findRoot(input.cwd || process.cwd());

// Passive telemetry (never blocks): record which foundation docs get read,
// so the v2 pruning of the suite runs on data instead of intuition.
// Local best-effort log: <root>/.git/agent-foundation-doc-reads.log
try {
  if (input.tool_name === 'Read') {
    const docPath = (input.tool_input?.file_path ?? '').match(/docs\/foundation\/\S*\.md$/);
    if (docPath && root && existsSync(join(root, '.git'))) {
      appendFileSync(
        join(root, '.git', 'agent-foundation-doc-reads.log'),
        `${new Date().toISOString()} ${docPath[0]}\n`,
      );
    }
  }
} catch {
  // telemetry must never interfere
}

const pack = loadPack(root);
const guards = [
  ...METHOD_GUARDS,
  ...(Array.isArray(pack.stackGuards) ? pack.stackGuards : [])
    .map((name) => STACK_GUARDS[name])
    .filter(Boolean),
];

const verdicts = [];
for (const guard of guards) {
  try {
    const verdict = guard.check(input);
    if (verdict) verdicts.push(verdict);
  } catch {
    // swallow: enforcement must not take the session down
  }
}

const denies = verdicts.filter((v) => v.action === 'deny');
if (denies.length) deny(denies.map((v) => v.reason).join('\n'));
const asks = verdicts.filter((v) => v.action === 'ask');
if (asks.length) ask(asks.map((v) => v.reason).join('\n'));
process.exit(0);
