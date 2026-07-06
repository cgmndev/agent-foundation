#!/usr/bin/env node
// SessionStart: brief de orientación — su stdout se inyecta como contexto de
// la sesión. Objetivo: ninguna sesión empieza perdida (mapa + specs activas +
// salud de la cadena de hashes) en <12 líneas. Silencioso fuera de proyectos
// de la fundación.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readHookInput } from '../lib/io.mjs';
import { getField } from '../lib/frontmatter.mjs';
import { findRoot } from '../lib/project-root.mjs';
import { checkFeature } from '../lib/spec-chain.mjs';

const input = await readHookInput();
const root = findRoot(input.cwd || process.cwd());
if (!root) process.exit(0);

const lines = [];
if (existsSync(join(root, 'docs', 'foundation'))) {
  lines.push('Fundación activa · mapa del repo: CLAUDE.md · suite: docs/foundation/00-INDICE.md');
}

const activeDir = join(root, 'specs', 'active');
if (existsSync(activeDir)) {
  const features = readdirSync(activeDir, { withFileTypes: true }).filter((e) => e.isDirectory());
  if (!features.length) {
    lines.push('Specs activas: ninguna.');
  }
  for (const feature of features.slice(0, 5)) {
    const dir = join(activeDir, feature.name);
    const specPath = join(dir, 'spec.md');
    const status = existsSync(specPath)
      ? (getField(readFileSync(specPath, 'utf8'), 'status') ?? 'sin status')
      : 'sin spec.md (trabajo plan/tasks-only)';
    let tasks = '';
    const tasksPath = join(dir, 'tasks.md');
    if (existsSync(tasksPath)) {
      const content = readFileSync(tasksPath, 'utf8');
      const open = (content.match(/- \[ \]/g) ?? []).length;
      const done = (content.match(/- \[x\]/gi) ?? []).length;
      tasks = ` · tasks ${done}/${done + open}`;
    }
    const drift = checkFeature(dir).length ? ' · ⚠ DRIFT (ver /change-spec)' : '';
    lines.push(`Spec activa: ${feature.name} — ${status}${tasks}${drift}`);
  }
  if (features.length > 5) lines.push(`(+${features.length - 5} specs activas más)`);
}

if (lines.length) process.stdout.write(lines.join('\n') + '\n');
process.exit(0);
