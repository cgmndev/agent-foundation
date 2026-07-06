// Guard: trunk-based discipline (04-convenciones).
//   - Hard deny: force-push to main/master.
//   - Ask: commits/pushes while standing on main — day-zero bootstrap is
//     legitimate, so the human confirms instead of hitting a wall.
//
// Sample payload: {"tool_name":"Bash","tool_input":{"command":"git push --force origin main"}}

import { execSync } from 'node:child_process';

function currentBranch(cwd) {
  try {
    return execSync('git branch --show-current', {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 3000,
    }).trim();
  } catch {
    return null;
  }
}

export function check(input) {
  if (input.tool_name !== 'Bash') return null;
  const cmd = input.tool_input?.command ?? '';
  if (!/\bgit\b/.test(cmd)) return null;

  const force = /\bpush\b[^|;&]*(?:--force(?:-with-lease)?\b|\s-f\b)/.test(cmd);
  const branch = currentBranch(input.cwd || process.cwd());
  const onMain = branch === 'main' || branch === 'master';

  if (force && (/\b(main|master)\b/.test(cmd) || onMain)) {
    return { action: 'deny', reason: 'protect-main: force-push a main/master está prohibido (04-convenciones).' };
  }
  if (!onMain) return null;

  if (/\bgit\s+commit\b/.test(cmd)) {
    return {
      action: 'ask',
      reason:
        `protect-main: estás en ${branch} — la fundación pide trunk-based con ramas cortas y PR (04). ` +
        `¿Commit directo a ${branch} intencional (p. ej. bootstrap)?`,
    };
  }
  if (/\bgit\s+push\b/.test(cmd) && !/\b(feat|fix|chore|docs|refactor|test)\//.test(cmd)) {
    return {
      action: 'ask',
      reason: `protect-main: push estando en ${branch} — ¿intencional (p. ej. bootstrap del repo)?`,
    };
  }
  return null;
}
