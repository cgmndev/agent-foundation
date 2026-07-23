---
doc: agentes
version: 1.7
fecha: 2026-07-22
estado: vigente
tipo: capa-durable
capa: metodo
---

# 09 — Integración con Agentes (Claude Code)

Cómo este paquete alimenta al agente sin inflar contexto. Complementa (no reemplaza) el harness de roles (documentación separada) y el sistema de specs ([11](11-sistema-specs.md)–[12](12-guia-specs.md)).

## Principios de contexto

1. **Smart zone:** mantener el contexto de trabajo <~100k tokens. Clear and reload sobre compact. Tareas descompuestas en vertical slices que quepan.
2. **Progressive disclosure:** CLAUDE.md es corto y apunta; los documentos de este paquete se cargan bajo demanda según el tipo de tarea (tabla en [00-INDICE.md](00-INDICE.md)).
3. **Guías vs sensores:** estos documentos son guías (feed-forward). Los sensores (feedback) son `pnpm check`, `pnpm test`, hooks y CI. Toda regla crítica debe existir como sensor, no solo como texto.
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
| drift-check | PreToolUse (Edit/Write en `apps/`, `packages/`) | Señala (**ask**) implementación con plan/tasks desfasados (hashes); el humano decide si el cambio es ajeno a la spec |
| session-brief | SessionStart | Inyecta orientación mínima al abrir sesión: mapa + specs activas + salud de hashes |

(Implementación: plugin `agent-foundation` — en el repo de la fundación: `hooks/hooks.json` como wiring y `scripts/guards/` con un guardia por archivo. Los proyectos lo reciben instalando el plugin, no copiando archivos. Verdictos: deny para lo prohibido; **ask** para lo que requiere aprobación humana en el momento — guardrails como trust infrastructure.)

**Guards por capa (15-principios):** los de **método** (block-secrets, protect-main, archive-guard, drift-check) aplican en todo proyecto y no se pueden apagar; los de **stack** (guard-deps, guard-migrations) los declara el pack en `docs/foundation/pack.json` (campo `stackGuards`). El resto de la maquinaria parametrizable — qué comandos cuentan como feedback loop (verify-done exige **check Y test**), qué archivos disparan verify-done, dónde se buscan los `AC-NN` — también lee del adapter; sin `pack.json` rigen los defaults del pack de referencia.

Capas de enforcement distintas y complementarias: estos hooks gobiernan al agente; lefthook (pre-commit git, [04-convenciones-codigo.md](04-convenciones-codigo.md)) y CI gobiernan a cualquier committer, humano o agente.

## Skills del proyecto

Llegan con el plugin `agent-foundation` (no se copian al repo); cada `SKILL.md` es su propia documentación:

- Lifecycle de specs: `/new-spec`, `/activate-spec`, `/change-spec`, `/close-spec`, más `/adr` (decisiones).
- Implementación: `/implement-task` — mecaniza la sesión estándar de una task (§Flujo de abajo, pasos 1–4) con contexto justo. EN OBSERVACIÓN: el checkpoint decide su destino.
- Scaffolding: `/new-module <nombre>` (backend según [02-arquitectura.md](02-arquitectura.md)), `/new-feature <nombre>` (frontend).
- `/review-fresh`: delega el review en el agente `revisor` del plugin — contexto limpio garantizado.
- `/init-project`: instancia la fundación completa en un repo nuevo (día cero, parte mecánica).
- Regla general: skills ligeras propias sobre frameworks pesados de terceros.

## CLAUDE.md jerárquicos

El CLAUDE.md raíz se mantiene corto (~150 líneas). Cuando una app acumula reglas propias, se extraen a un CLAUDE.md anidado que Claude Code carga automáticamente al trabajar en ese directorio: `apps/api/CLAUDE.md` (módulos, jobs, datos), `apps/web/CLAUDE.md` (UI, polling, errorComponent, testing frontend) e `infra/CLAUDE.md` en el Perfil B (qué puede tocar el agente: compose y `.env.template` con placeholders; qué no: valores reales, comandos de aprovisionamiento). Regla anti-drift: cada regla vive en UN solo nivel — el anidado especializa, nunca repite al raíz.

## Flujo de trabajo estándar de una task

1. Sesión limpia → cargar CLAUDE.md (automático) + doc(s) de fundación según tabla + spec/task activa.
2. Plan mode para tasks no triviales; el plan referencia los AC-NN.
3. Implementar el vertical slice completo (DB → API → frontend si aplica).
4. Feedback loop del pack (`pnpm check && pnpm test` en el de referencia) → commit convencional → siguiente task o cierre.
5. Review SIEMPRE en sesión/contexto fresco (humano o sesión dedicada), nunca en la sesión implementadora — mecanizado con `/review-fresh` (agente `revisor`).
6. Multi-task paralelo: git worktrees (2-3 máximo mientras el review sea el cuello de botella).

(Los pasos 1–4 están mecanizados con `/implement-task`; el ritual manual de arriba sigue siendo el contrato.)

## Documentación que el agente mantiene (definition of done documental)

- `.env.example` al agregar config.
- `docs/domain.md` al introducir conceptos de dominio nuevos.
- README de módulo si el módulo supera ~6 archivos.
- ADR cuando una task tome una decisión que contradiga o extienda este paquete.
- `docs/roadmap.md` cuando una idea buena queda fuera de alcance: se registra en el parking (formato en [14-roadmap-parking.md](14-roadmap-parking.md)) en lugar de implementarse.
El drift de estos documentos se audita al cierre de cada spec (parte del `/close-spec`).
