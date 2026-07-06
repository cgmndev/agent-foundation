#!/usr/bin/env node
// Stop guard "verify-done" (09-agentes, tabla de hooks): si hay archivos
// TS/TSX modificados posteriores a la última corrida de `bun run check|test`
// (marcador en .git/, escrito por post-tool-use.mjs), bloquea el cierre UNA
// vez e instruye cerrar el feedback loop. stop_hook_active corta el bucle.
// Limitación conocida: el marcador prueba que el loop CORRIÓ, no que quedó
// verde — los fallos son visibles en la propia sesión de todas formas.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { readHookInput } from '../lib/io.mjs';
import { findRoot } from '../lib/project-root.mjs';

const input = await readHookInput();
if (input.stop_hook_active) process.exit(0);

const root = findRoot(input.cwd || process.cwd());
if (!root || !existsSync(join(root, 'package.json'))) process.exit(0);
try {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  if (!pkg.scripts?.check) process.exit(0); // proyecto sin feedback loop estándar
} catch {
  process.exit(0);
}

let changed = [];
try {
  changed = execSync('git status --porcelain', {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 5000,
  })
    .split('\n')
    .map((line) => line.slice(3).trim())
    .filter((file) => /\.(ts|tsx)$/.test(file));
} catch {
  process.exit(0);
}
if (!changed.length) process.exit(0);

const marker = join(root, '.git', 'agent-foundation-last-check');
const markerTime = existsSync(marker) ? statSync(marker).mtimeMs : 0;
const newest = Math.max(
  ...changed.map((file) => {
    try {
      return statSync(join(root, file)).mtimeMs;
    } catch {
      return 0;
    }
  }),
);
if (newest <= markerTime) process.exit(0);

process.stderr.write(
  `verify-done: ${changed.length} archivo(s) TS modificados sin pasar el feedback loop. ` +
    'Ejecuta `bun run check && bun run test` y deja todo verde antes de cerrar (06-testing). Sin verde no hay done.',
);
process.exit(2);
