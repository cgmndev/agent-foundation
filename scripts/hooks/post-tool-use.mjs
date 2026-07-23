#!/usr/bin/env node
// PostToolUse(Bash): registra POR SEPARADO cuándo corrió cada parte del
// feedback loop del pack (default: check y test) en un marcador JSON en
// .git/agent-foundation-last-check. Lo consume stop.mjs (verify-done), que
// exige TODAS las partes — la doctrina es `check && test`, no una de las dos.
// Si la respuesta del tool trae un exit code de fallo, no se marca.
// Los comandos que cuentan los define el pack (loopCommandRegexes).

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readHookInput } from '../lib/io.mjs';
import { findRoot } from '../lib/project-root.mjs';
import { loadPack } from '../lib/pack.mjs';

const input = await readHookInput();
if (input.tool_name !== 'Bash') process.exit(0);
const cmd = input.tool_input?.command ?? '';

const root = findRoot(input.cwd || process.cwd());
if (!root || !existsSync(join(root, '.git'))) process.exit(0);

const pack = loadPack(root);
const regexes =
  pack.loopCommandRegexes && typeof pack.loopCommandRegexes === 'object' ? pack.loopCommandRegexes : {};
const ran = Object.entries(regexes)
  .filter(([, source]) => {
    try {
      return new RegExp(source).test(cmd);
    } catch {
      return false;
    }
  })
  .map(([part]) => part);
if (!ran.length) process.exit(0);

const exitCode = input.tool_response?.exit_code ?? input.tool_response?.exitCode;
if (typeof exitCode === 'number' && exitCode !== 0) process.exit(0);

const markerPath = join(root, '.git', 'agent-foundation-last-check');
let marker = {};
try {
  const parsed = JSON.parse(readFileSync(markerPath, 'utf8'));
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) marker = parsed;
} catch {
  // legacy plain-string marker or absent file: start fresh
}
const now = new Date().toISOString();
for (const part of ran) marker[part] = now;
try {
  writeFileSync(markerPath, JSON.stringify(marker) + '\n');
} catch {
  // best effort
}
process.exit(0);
