#!/usr/bin/env node
// Stop guard "verify-done" (09-agentes, tabla de hooks): si hay archivos
// fuente (patrón del pack; default TS/TSX) modificados posteriores a la
// última corrida de CADA parte del feedback loop (marcador JSON en .git/,
// escrito por post-tool-use.mjs), bloquea el cierre UNA vez e instruye cerrar
// el loop completo — check Y test, no una de las dos. stop_hook_active corta
// el bucle. Limitación conocida: el marcador prueba que cada parte CORRIÓ
// (con exit 0 cuando el payload lo trae), no que quedó verde — los fallos son
// visibles en la propia sesión de todas formas.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { readHookInput } from '../lib/io.mjs';
import { findRoot } from '../lib/project-root.mjs';
import { loadPack, safeRegex, DEFAULT_PACK } from '../lib/pack.mjs';

const input = await readHookInput();
if (input.stop_hook_active) process.exit(0);

const root = findRoot(input.cwd || process.cwd());
if (!root) process.exit(0);

const pack = loadPack(root);
if (!pack.__fromFile) {
  // Sin adapter de pack: heurística del pack de referencia — solo aplica en
  // proyectos JS con el feedback loop estándar declarado.
  if (!existsSync(join(root, 'package.json'))) process.exit(0);
  try {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    if (!pkg.scripts?.check) process.exit(0); // proyecto sin feedback loop estándar
  } catch {
    process.exit(0);
  }
}

const SOURCE_RE = safeRegex(pack.sourceFileRegex, /\.(ts|tsx)$/);
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
    .filter((file) => SOURCE_RE.test(file));
} catch {
  process.exit(0);
}
if (!changed.length) process.exit(0);

const newest = Math.max(
  ...changed.map((file) => {
    try {
      return statSync(join(root, file)).mtimeMs;
    } catch {
      return 0;
    }
  }),
);

// Marcador JSON { parte: ISO } por parte del loop (post-tool-use.mjs).
const markerPath = join(root, '.git', 'agent-foundation-last-check');
let times = {};
try {
  const parsed = JSON.parse(readFileSync(markerPath, 'utf8'));
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) times = parsed;
} catch {
  // legacy/absent marker: exigirá el loop completo
}
const parts = Object.keys(
  pack.loopCommandRegexes &&
    typeof pack.loopCommandRegexes === 'object' &&
    Object.keys(pack.loopCommandRegexes).length
    ? pack.loopCommandRegexes
    : DEFAULT_PACK.loopCommandRegexes,
);
const missing = parts.filter((part) => {
  const at = Date.parse(times[part] ?? '');
  return !Number.isFinite(at) || newest > at;
});
if (!missing.length) process.exit(0);

const loop = pack.feedbackLoop || DEFAULT_PACK.feedbackLoop;
process.stderr.write(
  `verify-done: ${changed.length} archivo(s) fuente modificados sin cerrar el feedback loop (falta: ${missing.join(' + ')}). ` +
    `Ejecuta \`${loop}\` y deja todo verde antes de cerrar (06-testing). Sin verde no hay done.`,
);
process.exit(2);
