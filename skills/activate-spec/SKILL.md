---
name: activate-spec
description: Pasar una spec aprobada de draft a active (verifica preguntas abiertas, stampea source_hash) y ofrecer generar plan.md y tasks.md encadenados. Usar cuando el usuario/cliente aprobó la spec.
argument-hint: <slug>
---

# /activate-spec — activar spec y generar plan/tasks

Contrato: `docs/foundation/12-guia-specs.md` §7 y §2 (hashing).

## Pasos

1. Localiza `specs/active/*-<slug>` y lee `spec.md`.
2. **Gates:** `format` del artefacto compatible (12-guia §2 — si falta o es mayor al que conoces, para y dilo), la sección "Preguntas abiertas" vacía y `status: draft`. Si algo falla, explica qué y para.
3. **Activa:** `status: active`, `updated:` hoy. Stampea el hash — única forma válida de escribir hashes:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT:-.}/scripts/spec-hash.mjs" stamp specs/active/<carpeta> spec
   ```
4. **Ofrece generar `plan.md`.** Si acepta:
   - ANTES de proponer enfoque, lee: `docs/architecture.md`, los ADRs relevantes de `docs/decisions/` y `docs/foundation/02-arquitectura.md`. El plan no contradice ADRs vigentes; si lo hace, para y resuélvelo con el usuario.
   - Plantilla: `docs/foundation/plantillas/plantilla-plan.md`. Obligatorio completar: superficie de cambio (§3), impacto en capa durable (§4) y mapeo AC→test (§5).
   - El review humano del plan es el de mayor valor del ciclo: presenta los trade-offs y espera su OK.
   - Tras el OK: `node "${CLAUDE_PLUGIN_ROOT:-.}/scripts/spec-hash.mjs" stamp specs/active/<carpeta> plan`
5. **Ofrece generar `tasks.md`** desde el plan (plantilla `plantilla-tasks.md`): tasks = vertical slices ejecutables; cada AC con su test EN la misma task, nunca en una fase final de testing. Tras revisión rápida del usuario: `stamp specs/active/<carpeta> tasks`.
6. **Resumen:** status, hash stampeado, y siguiente paso (implementar por tasks, marcando checkboxes al completar cada una).
