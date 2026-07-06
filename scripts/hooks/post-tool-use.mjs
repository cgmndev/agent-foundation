#!/usr/bin/env node
// PostToolUse(Bash): registra el momento en que corrió el feedback loop
// canónico (`pnpm check` / `pnpm test`) en .git/agent-foundation-last-check.
// Lo consume stop.mjs (verify-done). Si la respuesta del tool trae un exit
// code de fallo, no se marca.

import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readHookInput } from '../lib/io.mjs';
import { findRoot } from '../lib/project-root.mjs';

const input = await readHookInput();
if (input.tool_name !== 'Bash') process.exit(0);
const cmd = input.tool_input?.command ?? '';
const LOOP_CMD = /\b(?:pnpm|npm|yarn|bun)\s+run\s+(?:check|test)\b|\b(?:pnpm|npm|yarn)\s+(?:check|test)\b/;
if (!LOOP_CMD.test(cmd)) process.exit(0);

const exitCode = input.tool_response?.exit_code ?? input.tool_response?.exitCode;
if (typeof exitCode === 'number' && exitCode !== 0) process.exit(0);

const root = findRoot(input.cwd || process.cwd());
if (!root || !existsSync(join(root, '.git'))) process.exit(0);
try {
  writeFileSync(join(root, '.git', 'agent-foundation-last-check'), new Date().toISOString() + '\n');
} catch {
  // best effort
}
process.exit(0);
