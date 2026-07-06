// Guard: keep archived specs out of spontaneous context (12-guia-specs §8).
// Blocks Read/Grep/Glob targeting specs/archive/**. Bash `cat` bypasses it on
// purpose: this is trust infrastructure against accidental context
// contamination, not an adversarial control.
//
// Sample payload: {"tool_name":"Read","tool_input":{"file_path":"specs/archive/2026-07/x/spec.md"}}

const TOOLS = new Set(['Read', 'Grep', 'Glob']);

export function check(input) {
  if (!TOOLS.has(input.tool_name)) return null;
  const ti = input.tool_input ?? {};
  const target = [ti.file_path, ti.path, ti.glob]
    .filter((v) => typeof v === 'string')
    .join('\n');
  if (!/(^|\/)specs\/archive(\/|$)/m.test(target)) return null;
  return {
    action: 'deny',
    reason:
      'archive-guard: spec archivada — no es contexto válido (status implemented/superseded). ' +
      'Si necesitas historia, pídelo explícitamente al usuario y que él confirme.',
  };
}
