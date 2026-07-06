// Guard: adding a dependency is a decision, not a reflex (04-convenciones).
// Surfaces:
//   - Bash: package-manager "add" commands (bare `bun install` stays allowed).
//   - Write/Edit on package.json introducing new "name": "version" pairs.
// Verdict is "ask", not deny — the human approves in the moment (trust
// infrastructure, no friction wall for legitimate additions).
//
// Sample payload: {"tool_name":"Bash","tool_input":{"command":"bun add left-pad"}}

const ADD_CMD = /\b(?:bun|pnpm|yarn)\s+add\s+(?!-h\b|--help\b)\S|\bnpm\s+(?:install|i|add)\s+(?!-|\.($|\s))\S/;
const DEP_PAIR = /"((?:@[\w.-]+\/)?[\w.-]+)"\s*:\s*"(?:workspace:|file:|link:|latest|\*|[~^]?\d)/g;
const NOT_DEPS = new Set(['version', 'node', 'npm', 'bun', 'packageManager']);

function depNames(text) {
  const names = new Set();
  for (const match of text.matchAll(DEP_PAIR)) {
    if (!NOT_DEPS.has(match[1])) names.add(match[1]);
  }
  return names;
}

export function check(input) {
  const tool = input.tool_name;
  const ti = input.tool_input ?? {};

  if (tool === 'Bash') {
    const cmd = ti.command ?? '';
    if (ADD_CMD.test(cmd)) {
      return {
        action: 'ask',
        reason: `guard-deps: instala dependencias nuevas — requiere aprobación (04-convenciones). Comando: ${cmd.slice(0, 160)}`,
      };
    }
    return null;
  }

  if (tool !== 'Write' && tool !== 'Edit') return null;
  const path = ti.file_path ?? '';
  if (!/(^|\/)package\.json$/.test(path)) return null;

  if (tool === 'Write') {
    const names = depNames(ti.content ?? '');
    if (names.size) {
      return {
        action: 'ask',
        reason: `guard-deps: package.json declara dependencias (${[...names].slice(0, 8).join(', ')}) — confirma que están aprobadas (04).`,
      };
    }
    return null;
  }

  const before = depNames(ti.old_string ?? '');
  const added = [...depNames(ti.new_string ?? '')].filter((n) => !before.has(n));
  if (added.length) {
    return {
      action: 'ask',
      reason: `guard-deps: dependencias nuevas en package.json: ${added.join(', ')} — requiere aprobación (04).`,
    };
  }
  return null;
}
