#!/bin/bash
# Batería de pruebas del harness agent-foundation contra un proyecto fixture
# temporal (guardias, CLIs de hashing/trazabilidad, hooks de sesión y la
# costura método/pack — docs/foundation/pack.json). Correr tras cualquier
# cambio en scripts/: `bash scripts/test-harness.sh`. Exit code = nº de fallos.
REPO="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
FIX="$WORK/fixture"
trap 'rm -rf "$WORK"' EXIT
PASS=0; FAIL=0

check() { # check <desc> <expected_exit> <actual_exit>
  if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "PASS: $1";
  else FAIL=$((FAIL+1)); echo "FAIL: $1 (esperado exit $2, obtuvo $3)"; fi
}
contains() { # contains <desc> <needle> <haystack>
  if echo "$3" | grep -qF "$2"; then PASS=$((PASS+1)); echo "PASS: $1";
  else FAIL=$((FAIL+1)); echo "FAIL: $1 (no contiene: $2) — got: $3"; fi
}

# ── Fixture ──────────────────────────────────────────────────────────────
mkdir -p "$FIX/specs/active/2026-07-demo" "$FIX/specs/archive/2026-06/2026-05-vieja" "$FIX/apps/api/src"
cd "$FIX"
git init -q -b main . && git config user.email t@t.dev && git config user.name Test

cat > package.json <<'EOF'
{
  "name": "fixture",
  "type": "module",
  "scripts": { "check": "true", "test": "true" }
}
EOF

cat > specs/active/2026-07-demo/spec.md <<'EOF'
---
type: spec
feature: demo
status: active
version: 1.0
source_hash: null
---

# Spec — Demo

| ID | Criterio | Verificación |
|----|----------|--------------|
| AC-01 | hace la cosa principal | test |
| AC-02 | el cliente valida el diseño | manual |
| ~~AC-03~~ | ~~criterio viejo~~ [eliminado v1.1] | test |
EOF

cat > specs/active/2026-07-demo/plan.md <<'EOF'
---
type: plan
feature: demo
spec_hash: null
---

# Plan — Demo
Enfoque técnico de prueba.
EOF

cat > specs/active/2026-07-demo/tasks.md <<'EOF'
---
type: tasks
feature: demo
plan_hash: null
---

# Tasks — Demo
- [x] T1.1 — hecho
- [ ] T1.2 — pendiente
EOF

cat > apps/api/src/demo.test.ts <<'EOF'
import { describe, it } from 'vitest';
describe('AC-01: hace la cosa principal', () => { it('ok', () => {}); });
EOF

git add -A && git commit -qm init

# ── 1. JSON de manifiestos válidos ──────────────────────────────────────
node -e "JSON.parse(require('fs').readFileSync('$REPO/.claude-plugin/plugin.json'))"; check "plugin.json válido" 0 $?
node -e "JSON.parse(require('fs').readFileSync('$REPO/.claude-plugin/marketplace.json'))"; check "marketplace.json válido" 0 $?
node -e "JSON.parse(require('fs').readFileSync('$REPO/hooks/hooks.json'))"; check "hooks.json válido" 0 $?
node -e "JSON.parse(require('fs').readFileSync('$REPO/docs/foundation/pack.json'))"; check "pack.json (pack de referencia) válido" 0 $?

# ── 2. spec-hash: stamp + check ──────────────────────────────────────────
OUT=$(node "$REPO/scripts/spec-hash.mjs" stamp specs/active/2026-07-demo 2>&1); check "stamp all" 0 $?
OUT=$(node "$REPO/scripts/spec-hash.mjs" check specs/active/2026-07-demo 2>&1); check "check tras stamp = OK" 0 $?
contains "check reporta OK" "OK" "$OUT"

# ── 3. drift: editar spec sin restampar ─────────────────────────────────
echo "línea nueva que cambia el body" >> specs/active/2026-07-demo/spec.md
OUT=$(node "$REPO/scripts/spec-hash.mjs" check specs/active/2026-07-demo 2>&1); check "check detecta drift" 1 $?
contains "drift menciona restampar" "restampar" "$OUT"

# guard drift-check bloquea Edit en apps/
P="{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/apps/api/src/x.ts\",\"old_string\":\"a\",\"new_string\":\"b\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); RC=$?
check "drift-check no bloquea en seco (exit 0)" 0 $RC
contains "drift-check pide confirmación (ask)" '"permissionDecision":"ask"' "$OUT"
contains "drift-check nombra la feature" "2026-07-demo" "$OUT"

# restampar → pasa limpio (sin ask)
node "$REPO/scripts/spec-hash.mjs" stamp specs/active/2026-07-demo spec plan tasks >/dev/null 2>&1
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); RC=$?
[ -z "$OUT" ] && [ $RC = 0 ]; check "tras restamp, Edit pasa sin ask" 0 $?

# ── 4. archive-guard ─────────────────────────────────────────────────────
P="{\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"$FIX/specs/archive/2026-06/2026-05-vieja/spec.md\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); check "archive-guard bloquea Read" 2 $?
P="{\"tool_name\":\"Grep\",\"tool_input\":{\"pattern\":\"x\",\"path\":\"$FIX/specs/archive\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); check "archive-guard bloquea Grep" 2 $?
P="{\"tool_name\":\"Glob\",\"tool_input\":{\"pattern\":\"specs/archive/**\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); check "archive-guard bloquea Glob (campo pattern)" 2 $?
P="{\"tool_name\":\"Glob\",\"tool_input\":{\"pattern\":\"specs/active/**\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); check "Glob sobre specs/active pasa" 0 $?
P="{\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"$FIX/specs/active/2026-07-demo/spec.md\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); check "specs/active sí se lee" 0 $?

# telemetría pasiva de lecturas de docs de fundación
P="{\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"$FIX/docs/foundation/01-stack.md\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); check "lectura de doc de fundación pasa" 0 $?
grep -q '01-stack.md' "$FIX/.git/agent-foundation-doc-reads.log" 2>/dev/null; check "telemetría registra la lectura" 0 $?

# ── 5. block-secrets ─────────────────────────────────────────────────────
P="{\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"$FIX/.env\",\"content\":\"X=1\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); check "bloquea Write a .env" 2 $?
P="{\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"$FIX/.env.example\",\"content\":\"X=\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); check ".env.example sí se escribe" 0 $?
P="{\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"$FIX/apps/api/src/cfg.ts\",\"content\":\"const k = 'AKIAABCDEFGHIJKLMNOP'\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); check "bloquea AWS key en contenido" 2 $?
P="{\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"$FIX/apps/api/src/ok.ts\",\"content\":\"export const a = 1\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); check "contenido limpio pasa" 0 $?

# ── 6. guard-deps (ask) ──────────────────────────────────────────────────
P="{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"bun add left-pad\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); RC=$?
check "bun add → exit 0 (ask via JSON)" 0 $RC
contains "bun add → permissionDecision ask" '"permissionDecision":"ask"' "$OUT"
P="{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"pnpm add left-pad\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1)
contains "pnpm add → ask" '"permissionDecision":"ask"' "$OUT"
P="{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"bun install\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); RC=$?
[ -z "$OUT" ] && [ $RC = 0 ]; check "bun install (bare) pasa sin ask" 0 $?
P="{\"tool_name\":\"Edit\",\"tool_input\":{\"file_path\":\"$FIX/package.json\",\"old_string\":\"\\\"scripts\\\"\",\"new_string\":\"\\\"left-pad\\\": \\\"^1.0.0\\\", \\\"scripts\\\"\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1)
contains "Edit package.json con dep nueva → ask" '"permissionDecision":"ask"' "$OUT"

# ── 7. guard-migrations ──────────────────────────────────────────────────
P="{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"bunx drizzle-kit push\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); check "drizzle-kit push bloqueado" 2 $?
P="{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"DATABASE_URL=postgres://u:p@db.x.amazonaws.com/app bun run db:migrate\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); check "db:migrate remoto bloqueado" 2 $?
P="{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"bun run db:migrate\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); check "db:migrate local pasa" 0 $?

# ── 8. protect-main ──────────────────────────────────────────────────────
P="{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git commit -m 'feat: x'\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1)
contains "commit en main → ask" '"permissionDecision":"ask"' "$OUT"
P="{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git push --force origin main\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); check "force-push a main bloqueado" 2 $?
git -C "$FIX" checkout -q -b feat/x
P="{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git commit -m 'feat: x'\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); RC=$?
[ -z "$OUT" ] && [ $RC = 0 ]; check "commit en rama feature pasa" 0 $?
git -C "$FIX" checkout -q main

# ── 9. check-acs ─────────────────────────────────────────────────────────
OUT=$(node "$REPO/scripts/check-acs.mjs" specs/active/2026-07-demo/spec.md 2>&1); check "trazabilidad OK (AC-01 con test, AC-02 manual, AC-03 tachado)" 0 $?
contains "reporta manuales" "AC-02" "$OUT"
printf '| AC-04 | criterio sin test | test |\n' >> specs/active/2026-07-demo/spec.md
OUT=$(node "$REPO/scripts/check-acs.mjs" specs/active/2026-07-demo/spec.md 2>&1); check "AC-04 sin test → falla" 1 $?
contains "nombra el AC faltante" "AC-04" "$OUT"

# ── 10. session-start ────────────────────────────────────────────────────
P="{\"cwd\":\"$FIX\",\"source\":\"startup\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/session-start.mjs" 2>&1); check "session-brief corre" 0 $?
contains "brief lista la spec activa" "2026-07-demo" "$OUT"
contains "brief cuenta tasks" "tasks 1/2" "$OUT"
contains "brief marca drift (spec editada en test 9)" "DRIFT" "$OUT"

# ── 11. verify-done (stop): exige check Y test ──────────────────────────
touch apps/api/src/nuevo.ts
P="{\"cwd\":\"$FIX\",\"stop_hook_active\":false}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/stop.mjs" 2>&1); check "stop bloquea con TS sin verificar" 2 $?
P="{\"cwd\":\"$FIX\",\"stop_hook_active\":true}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/stop.mjs" 2>&1); check "stop_hook_active corta el bucle" 0 $?
P="{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"bun run check\"},\"tool_response\":{},\"cwd\":\"$FIX\"}"
echo "$P" | node "$REPO/scripts/hooks/post-tool-use.mjs"; check "post-tool-use marca la parte check" 0 $?
P="{\"cwd\":\"$FIX\",\"stop_hook_active\":false}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/stop.mjs" 2>&1); check "solo check NO desbloquea (falta test)" 2 $?
contains "el aviso nombra la parte faltante" "falta: test" "$OUT"
P="{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"bun run test\"},\"tool_response\":{},\"cwd\":\"$FIX\"}"
echo "$P" | node "$REPO/scripts/hooks/post-tool-use.mjs"; check "post-tool-use marca la parte test" 0 $?
P="{\"cwd\":\"$FIX\",\"stop_hook_active\":false}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/stop.mjs" 2>&1); check "con check + test, stop pasa" 0 $?

# loop completo en un solo comando compuesto (shorthand PM-agnóstico)
touch apps/api/src/otro.ts
P="{\"cwd\":\"$FIX\",\"stop_hook_active\":false}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/stop.mjs" 2>&1); check "stop vuelve a bloquear con cambio nuevo" 2 $?
P="{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"pnpm check && pnpm test\"},\"tool_response\":{},\"cwd\":\"$FIX\"}"
echo "$P" | node "$REPO/scripts/hooks/post-tool-use.mjs"; check "comando compuesto marca ambas partes" 0 $?
P="{\"cwd\":\"$FIX\",\"stop_hook_active\":false}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/stop.mjs" 2>&1); check "marcador compuesto desbloquea stop" 0 $?

# ── 12. pack.json: la costura método/stack ──────────────────────────────
mkdir -p docs/foundation lib
cat > docs/foundation/pack.json <<'EOF'
{
  "pack": "fixture-pack",
  "feedbackLoop": "make verify",
  "sourceFileRegex": "\\.py$",
  "testFileRegex": "\\.spec\\.js$",
  "codeRoots": ["lib"],
  "stackGuards": []
}
EOF
P="{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"bun add left-pad\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); RC=$?
[ -z "$OUT" ] && [ $RC = 0 ]; check "pack sin stackGuards: bun add pasa sin ask" 0 $?
P="{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"bunx drizzle-kit push\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); check "pack sin stackGuards: guard-migrations apagado" 0 $?
P="{\"tool_name\":\"Read\",\"tool_input\":{\"file_path\":\"$FIX/specs/archive/2026-06/2026-05-vieja/spec.md\"},\"cwd\":\"$FIX\"}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/pre-tool-use.mjs" 2>&1); check "guards de método no se apagan por pack" 2 $?
touch apps/api/src/ignorado.ts
P="{\"cwd\":\"$FIX\",\"stop_hook_active\":false}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/stop.mjs" 2>&1); check "pack .py: cambio .ts ya no dispara verify-done" 0 $?
touch apps/api/src/app.py
P="{\"cwd\":\"$FIX\",\"stop_hook_active\":false}"
OUT=$(echo "$P" | node "$REPO/scripts/hooks/stop.mjs" 2>&1); check "pack .py: cambio .py sí dispara" 2 $?
contains "el aviso usa el feedback loop del pack" "make verify" "$OUT"
mkdir -p specs/active/2026-07-pack
cat > specs/active/2026-07-pack/spec.md <<'EOF'
| ID | Criterio | Verificación |
|----|----------|--------------|
| AC-90 | criterio del pack fixture | test |
EOF
cat > lib/pack.spec.js <<'EOF'
describe('AC-90: criterio del pack fixture', () => {});
EOF
OUT=$(node "$REPO/scripts/check-acs.mjs" specs/active/2026-07-pack/spec.md 2>&1); check "check-acs usa codeRoots/testFileRegex del pack" 0 $?

echo ""
echo "══════ RESULTADO: $PASS PASS · $FAIL FAIL ══════"
exit $FAIL
