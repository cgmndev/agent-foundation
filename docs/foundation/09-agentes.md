---
doc: agentes
version: 1.1
fecha: 2026-07-06
estado: vigente
tipo: capa-durable
---

# 09 — Integración con Agentes (Claude Code)

Cómo este paquete alimenta al agente sin inflar contexto. Complementa (no reemplaza) el harness de roles y el sistema de specs, que tienen documentación propia.

## Principios de contexto

1. **Smart zone:** mantener el contexto de trabajo <~100k tokens. Clear and reload sobre compact. Tareas descompuestas en vertical slices que quepan.
2. **Progressive disclosure:** CLAUDE.md es corto y apunta; los documentos de este paquete se cargan bajo demanda según el tipo de tarea (tabla en [00-INDICE.md](00-INDICE.md)).
3. **Guías vs sensores:** estos documentos son guías (feed-forward). Los sensores (feedback) son `bun run check`, `bun run test`, hooks y CI. Toda regla crítica debe existir como sensor, no solo como texto.
4. **MCP mínimo:** 3-5 servers máximo por proyecto (Postgres local, GitHub y poco más); utilidades como CLIs/skills.

## Plantilla CLAUDE.md de proyecto

La plantilla canónica vive en [plantillas/plantilla-claude.md](plantillas/plantilla-claude.md) — única fuente, no duplicarla en otros docs. Secciones: qué es el proyecto · stack en una línea · comandos estándar · resumen operativo de arquitectura · reglas duras · tabla de carga de contexto · specs · dominio.

Presupuesto: <~150 líneas rellenada; lo que crezca se extrae a docs referenciados o skills. Los `<>` se ajustan por proyecto; las secciones de comandos y reglas duras son idénticas en todos los proyectos y no se tocan.

## Hooks estándar del proyecto (enforcement mínimo)

| Hook | Evento | Función |
|---|---|---|
| block-secrets | PreToolUse (Write/Edit/Bash git) | Bloquea patrones de secretos y `.env` en commits |
| guard-migrations | PreToolUse (Bash) | Bloquea `db:migrate`/`push` contra hosts no-locales |
| guard-deps | PreToolUse (Edit package.json) | Exige confirmación para dependencias nuevas |
| verify-done | Stop/PostToolUse | Recuerda/verifica `check` + `test` al cerrar task |
| protect-main | PreToolUse (Bash git) | Bloquea push directo y force-push a main |
| archive-guard | PreToolUse (Read/Grep/Glob) | Bloquea usar `specs/archive/` como contexto espontáneo ([12-guia-specs.md](12-guia-specs.md) §8) |
| drift-check | PreToolUse (Edit/Write en `apps/`, `packages/`) | Bloquea implementar con plan/tasks desfasados respecto a la spec (hashes) |
| session-brief | SessionStart | Inyecta orientación mínima al abrir sesión: mapa + specs activas + salud de hashes |

(Implementación: plugin `agent-foundation` — en el repo de la fundación: `hooks/hooks.json` como wiring y `scripts/guards/` con un guardia por archivo. Los proyectos lo reciben instalando el plugin, no copiando archivos. Verdictos: deny para lo prohibido; **ask** para lo que requiere aprobación humana en el momento — guardrails como trust infrastructure.)

Capas de enforcement distintas y complementarias: estos hooks gobiernan al agente; lefthook (pre-commit git, [04-convenciones-codigo.md](04-convenciones-codigo.md)) y CI gobiernan a cualquier committer, humano o agente.

## Skills del proyecto

Llegan con el plugin `agent-foundation` (no se copian al repo); cada `SKILL.md` es su propia documentación:

- Lifecycle de specs: `/new-spec`, `/activate-spec`, `/change-spec`, `/close-spec`, más `/adr` (decisiones).
- Scaffolding: `/new-module <nombre>` (backend según [02-arquitectura.md](02-arquitectura.md)), `/new-feature <nombre>` (frontend).
- `/review-fresh`: delega el review en el agente `revisor` del plugin — contexto limpio garantizado.
- `/init-project`: instancia la fundación completa en un repo nuevo (día cero, parte mecánica).
- Regla general: skills ligeras propias sobre frameworks pesados de terceros.

## Flujo de trabajo estándar de una task

1. Sesión limpia → cargar CLAUDE.md (automático) + doc(s) de fundación según tabla + spec/task activa.
2. Plan mode para tasks no triviales; el plan referencia los AC-NN.
3. Implementar el vertical slice completo (DB → API → frontend si aplica).
4. `bun run check && bun run test` → commit convencional → siguiente task o cierre.
5. Review SIEMPRE en sesión/contexto fresco (humano o sesión dedicada), nunca en la sesión implementadora — mecanizado con `/review-fresh` (agente `revisor`).
6. Multi-task paralelo: git worktrees (2-3 máximo mientras el review sea el cuello de botella).

## Documentación que el agente mantiene (definition of done documental)

- `.env.example` al agregar config.
- `docs/domain.md` al introducir conceptos de dominio nuevos.
- README de módulo si el módulo supera ~6 archivos.
- ADR cuando una task tome una decisión que contradiga o extienda este paquete.
El drift de estos documentos se audita al cierre de cada spec (parte del `/close-spec`).
