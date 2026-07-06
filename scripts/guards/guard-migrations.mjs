// Guard: migrations discipline (05-datos, 08-devops).
//   - `drizzle-kit push` never runs from the agent (even locally: a conscious
//     local prototype is something the human runs in their own terminal).
//   - `db:migrate` only against local databases; remote-looking targets are
//     pipeline territory (deploy job), never the agent.
//
// Sample payload: {"tool_name":"Bash","tool_input":{"command":"bun run db:push"}}

const PUSH = /\bdrizzle-kit\s+push\b|\bdb:push\b/;
const MIGRATE = /\bdrizzle-kit\s+migrate\b|\bdb:migrate\b/;
const REMOTE_HOST =
  /(amazonaws\.com|rds\.|oraclecloud|\.oci\.|neon\.tech|supabase\.(co|com)|render\.com|fly\.io|railway\.app|azure|planetscale)/i;
const REMOTE_URL = /postgres(?:ql)?:\/\/[^\s]*@(?!localhost|127\.0\.0\.1|0\.0\.0\.0)[^\s/]+/i;

export function check(input) {
  if (input.tool_name !== 'Bash') return null;
  const cmd = input.tool_input?.command ?? '';

  if (PUSH.test(cmd)) {
    return {
      action: 'deny',
      reason:
        'guard-migrations: `drizzle-kit push` está prohibido (05-datos): genera migración versionada ' +
        '(`bun run db:generate`) y aplícala (`bun run db:migrate`). Si de verdad es un prototipo local, ' +
        'que lo ejecute el usuario en su terminal.',
    };
  }
  if (MIGRATE.test(cmd) && (REMOTE_HOST.test(cmd) || REMOTE_URL.test(cmd) || /NODE_ENV=production/.test(cmd))) {
    return {
      action: 'deny',
      reason: 'guard-migrations: migraciones contra entornos no-locales las ejecuta el pipeline (08-devops), no el agente.',
    };
  }
  return null;
}
