// Shared I/O for hook scripts.
// Contract (Claude Code hooks): payload arrives as JSON on stdin; exit 2 with
// stderr = deny (stderr is fed back to Claude); JSON on stdout can express an
// "ask" permission decision for PreToolUse. Reference: docs/foundation/12-guia-specs.md §8.

export async function readHookInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

export function deny(reason) {
  process.stderr.write(reason + '\n');
  process.exit(2);
}

export function ask(reason) {
  const out = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason: reason,
    },
  };
  process.stdout.write(JSON.stringify(out) + '\n');
  process.exit(0);
}
