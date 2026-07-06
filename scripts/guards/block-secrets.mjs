// Guard: no secrets in writes or commits (07-seguridad-config).
// Surfaces:
//   - Write/Edit: blocks .env* targets (except .env.example) and secret-shaped content.
//   - Bash `git add`/`git commit`: blocks staging .env files and staged diffs
//     that add secret-shaped strings.
// Self-exception: edits inside scripts/guards/ (the patterns live there).
//
// Sample payload: {"tool_name":"Write","tool_input":{"file_path":"src/x.ts","content":"..."}}

import { execSync } from 'node:child_process';

const PATTERNS = [
  ['AWS access key', /AKIA[0-9A-Z]{16}/],
  ['private key block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['GitHub token', /gh[pousr]_[A-Za-z0-9]{20,}/],
  ['Anthropic API key', /sk-ant-[A-Za-z0-9_-]{20,}/],
  ['Slack token', /xox[baprs]-[A-Za-z0-9-]{10,}/],
  [
    'connection string with password',
    /(postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s:@/]+:[^\s@/]{6,}@(?!localhost|127\.0\.0\.1|0\.0\.0\.0|postgres\b|db\b|database\b)/i,
  ],
];
const ENV_FILE = /(^|\/)\.env(\.[\w.-]+)?$/;
const ENV_OK = /(^|\/)\.env\.example$/;

function scan(text) {
  for (const [label, re] of PATTERNS) if (re.test(text)) return label;
  return null;
}

export function check(input) {
  const tool = input.tool_name;
  const ti = input.tool_input ?? {};

  if (tool === 'Write' || tool === 'Edit' || tool === 'MultiEdit') {
    const path = ti.file_path ?? '';
    if (path.includes('scripts/guards/')) return null;
    if (ENV_FILE.test(path) && !ENV_OK.test(path)) {
      return {
        action: 'deny',
        reason:
          `block-secrets: ${path} no se edita desde el agente — los secretos quedan fuera de su contexto ` +
          '(07-seguridad-config). Pide al usuario que lo edite él; .env.example sí puedes mantenerlo.',
      };
    }
    const content = [
      ti.content,
      ti.new_string,
      ...(Array.isArray(ti.edits) ? ti.edits.map((e) => e.new_string) : []),
    ]
      .filter(Boolean)
      .join('\n');
    const hit = scan(content);
    if (hit) {
      return {
        action: 'deny',
        reason:
          `block-secrets: el contenido parece incluir un secreto (${hit}). ` +
          'Usa variables de entorno / secret manager; nunca valores reales en el repo (07).',
      };
    }
    return null;
  }

  if (tool === 'Bash') {
    const cmd = ti.command ?? '';
    if (/git\s+add\b/.test(cmd) && /\.env(?!\.example)/.test(cmd)) {
      return { action: 'deny', reason: 'block-secrets: los archivos .env no se stagean ni commitean (07).' };
    }
    if (!/git\s+commit\b/.test(cmd)) return null;
    try {
      const opts = {
        cwd: input.cwd || process.cwd(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 5000,
        maxBuffer: 10 * 1024 * 1024,
      };
      const staged = execSync('git diff --cached --name-only', opts);
      const badFile = staged.split('\n').find((f) => ENV_FILE.test(f) && !ENV_OK.test(f));
      if (badFile) {
        return {
          action: 'deny',
          reason: `block-secrets: ${badFile} está staged — los .env no se commitean (07). Sácalo: git restore --staged ${badFile}`,
        };
      }
      const diff = execSync('git diff --cached -U0', opts);
      const added = diff
        .split('\n')
        .filter((l) => l.startsWith('+'))
        .join('\n');
      const hit = scan(added);
      if (hit) {
        return {
          action: 'deny',
          reason: `block-secrets: el diff staged parece incluir un secreto (${hit}). Retíralo del stage antes de commitear.`,
        };
      }
    } catch {
      // Not a git repo / nothing staged / git missing → nothing to enforce here.
    }
    return null;
  }

  return null;
}
