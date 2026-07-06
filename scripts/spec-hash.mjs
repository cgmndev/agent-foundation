#!/usr/bin/env node
// Spec-chain hashing CLI — el ÚNICO escritor de campos hash (12-guia §2):
// ni humanos ni agentes los computan a mano; los skills invocan esto.
//
//   spec-hash.mjs compute <archivo.md>              imprime sha256 del body (sin frontmatter)
//   spec-hash.mjs stamp <carpeta-feature> [que...]  que: spec | plan | tasks | all (default: all)
//   spec-hash.mjs check <carpeta-feature>           verifica la cadena; exit 1 + reporte si hay drift
//   spec-hash.mjs check --all [raiz]                todas las features de specs/active/
//
// Cadena: spec.source_hash = hash(spec) → plan.spec_hash = copia → tasks.plan_hash = hash(plan).
// Stampear frontmatter no altera el hash del body: el orden spec→plan→tasks es estable.

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { bodyHash, getField, setField } from './lib/frontmatter.mjs';
import { checkAllActive, checkFeature } from './lib/spec-chain.mjs';

const [, , command, target, ...rest] = process.argv;

function fail(message) {
  process.stderr.write(message + '\n');
  process.exit(1);
}

function stampOne(dir, what) {
  const spec = join(dir, 'spec.md');
  const plan = join(dir, 'plan.md');
  const tasks = join(dir, 'tasks.md');
  switch (what) {
    case 'spec': {
      if (!existsSync(spec)) return `spec.md no existe (feature plan/tasks-only) — omitido`;
      setField(spec, 'source_hash', bodyHash(spec));
      return `spec.md → source_hash ${bodyHash(spec).slice(0, 12)}…`;
    }
    case 'plan': {
      if (!existsSync(plan)) return 'plan.md no existe — omitido';
      if (existsSync(spec)) {
        const sourceHash = getField(readFileSync(spec, 'utf8'), 'source_hash');
        if (!sourceHash) fail('spec.md sin source_hash: stampea la spec primero (stamp <dir> spec — lo hace /activate-spec).');
        setField(plan, 'spec_hash', sourceHash);
        return `plan.md → spec_hash ${sourceHash.slice(0, 12)}…`;
      }
      return 'plan.md sin spec.md hermana — nada que encadenar';
    }
    case 'tasks': {
      if (!existsSync(tasks)) return 'tasks.md no existe — omitido';
      if (!existsSync(plan)) return 'tasks.md sin plan.md hermana — nada que encadenar';
      const hash = bodyHash(plan);
      setField(tasks, 'plan_hash', hash);
      return `tasks.md → plan_hash ${hash.slice(0, 12)}…`;
    }
    default:
      fail(`no sé stampear "${what}" (usa: spec | plan | tasks | all)`);
  }
}

switch (command) {
  case 'compute': {
    if (!target || !existsSync(target)) fail('uso: spec-hash.mjs compute <archivo.md>');
    process.stdout.write(bodyHash(target) + '\n');
    break;
  }
  case 'stamp': {
    if (!target || !existsSync(target)) fail('uso: spec-hash.mjs stamp <carpeta-feature> [spec|plan|tasks|all]');
    const dir = resolve(target);
    const whats = rest.length && !rest.includes('all') ? rest : ['spec', 'plan', 'tasks'];
    for (const what of whats) process.stdout.write(stampOne(dir, what) + '\n');
    break;
  }
  case 'check': {
    let problems;
    if (target === '--all') {
      problems = checkAllActive(resolve(rest[0] ?? '.'));
    } else {
      if (!target || !existsSync(target)) fail('uso: spec-hash.mjs check <carpeta-feature> | check --all [raiz]');
      problems = checkFeature(resolve(target));
    }
    if (problems.length) {
      process.stderr.write('DRIFT:\n- ' + problems.join('\n- ') + '\n');
      process.exit(1);
    }
    process.stdout.write('cadena spec→plan→tasks: OK\n');
    break;
  }
  default:
    fail('uso: spec-hash.mjs compute|stamp|check … (ver cabecera del archivo)');
}
