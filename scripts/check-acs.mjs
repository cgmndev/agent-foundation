#!/usr/bin/env node
// Trazabilidad AC → tests (12-guia §3): todo AC-NN de la tabla de acceptance
// criteria de la spec —no tachado, no manual— debe aparecer literal en algún
// archivo de test bajo las raíces de código. Lo invoca /close-spec como gate.
// Raíces y patrón de test los define el pack del proyecto
// (docs/foundation/pack.json → codeRoots, testFileRegex; fallback: pack de
// referencia TS). Los AC-NN son únicos a nivel de PROYECTO (numeración
// global entre specs): sin eso, este grep global daría falsos positivos con
// los tests de features ya cerradas.
//
//   check-acs.mjs <spec.md> [--roots apps,packages]   (--roots pisa al pack)
//
// Salida: OK (exit 0) o lista de ACs sin test (exit 1). Los ACs manuales se
// listan aparte: exigen confirmación humana explícita, no grep.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { findRoot } from './lib/project-root.mjs';
import { loadPack, safeRegex } from './lib/pack.mjs';

const args = process.argv.slice(2);
const specPath = args.find((a) => !a.startsWith('--'));
const rootsArg = args.find((a) => a.startsWith('--roots='))?.slice('--roots='.length);

if (!specPath || !existsSync(specPath)) {
  process.stderr.write('uso: check-acs.mjs <spec.md> [--roots=apps,packages]\n');
  process.exit(1);
}

// 1. Parse the acceptance-criteria table: only table rows, skipping struck
//    (~~AC-NN~~) and manually-verified rows.
const required = new Set();
const manual = new Set();
for (const line of readFileSync(specPath, 'utf8').split('\n')) {
  if (!line.trimStart().startsWith('|')) continue;
  const match = line.match(/\|\s*(~~)?\s*(AC-\d{2,})/);
  if (!match) continue;
  const [, struck, id] = match;
  if (struck || /~~/.test(line)) continue;
  if (/\bmanual\b/i.test(line)) manual.add(id);
  else required.add(id);
}

if (!required.size && !manual.size) {
  process.stdout.write('sin ACs en la tabla de la spec — nada que trazar\n');
  process.exit(0);
}

// 2. Collect AC ids present in test files under the roots (pack-defined).
const projectRoot = findRoot(dirname(resolve(specPath))) ?? process.cwd();
const pack = loadPack(projectRoot);
const TEST_FILE_RE = safeRegex(pack.testFileRegex, /\.test\.tsx?$/);
const roots = (rootsArg ? rootsArg.split(',') : pack.codeRoots ?? ['apps', 'packages'])
  .map((r) => join(projectRoot, r.trim()))
  .filter((r) => existsSync(r));

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.turbo']);
const found = new Set();

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name));
    } else if (TEST_FILE_RE.test(entry.name)) {
      for (const id of readFileSync(join(dir, entry.name), 'utf8').matchAll(/\bAC-\d{2,}\b/g)) {
        found.add(id[0]);
      }
    }
  }
}
for (const root of roots) walk(root);

// 3. Report.
const missing = [...required].filter((id) => !found.has(id)).sort();
const covered = [...required].filter((id) => found.has(id)).sort();

process.stdout.write(`ACs testables: ${required.size} · con test: ${covered.length} · manuales: ${manual.size}\n`);
if (manual.size) {
  process.stdout.write(`Manuales (exigir confirmación humana explícita): ${[...manual].sort().join(', ')}\n`);
}
if (!roots.length && required.size) {
  process.stderr.write('No hay raíces de código (apps/, packages/) que escanear — ningún AC testable puede verificarse.\n');
}
if (missing.length) {
  process.stderr.write(`FALTA test para: ${missing.join(', ')}\n`);
  process.exit(1);
}
process.stdout.write('trazabilidad AC→tests: OK\n');
