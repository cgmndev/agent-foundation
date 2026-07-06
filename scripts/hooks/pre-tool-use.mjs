#!/usr/bin/env node
// PreToolUse dispatcher: one fast process per event; every guard is
// consulted and the strictest verdict wins (deny > ask > allow).
// Añadir un guardia = crear scripts/guards/<nombre>.mjs y listarlo aquí.
// A broken guard must never break the session: errors are swallowed.

import { readHookInput, deny, ask } from '../lib/io.mjs';
import * as archiveGuard from '../guards/archive-guard.mjs';
import * as blockSecrets from '../guards/block-secrets.mjs';
import * as guardDeps from '../guards/guard-deps.mjs';
import * as guardMigrations from '../guards/guard-migrations.mjs';
import * as protectMain from '../guards/protect-main.mjs';
import * as driftCheck from '../guards/drift-check.mjs';

const GUARDS = [archiveGuard, blockSecrets, guardDeps, guardMigrations, protectMain, driftCheck];

const input = await readHookInput();
const verdicts = [];
for (const guard of GUARDS) {
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
