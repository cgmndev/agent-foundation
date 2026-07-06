---
type: tasks
feature: <slug-kebab-case>
status: active           # active | done
created: AAAA-MM-DD
updated: AAAA-MM-DD
plan: ./plan.md
plan_hash: null          # SHA-256 del plan (sin frontmatter) al generar estas tasks
---

# Tasks — <Nombre de la feature>

<!--
REGLAS:
- Descomposición ejecutable del plan. Cada task: acción concreta,
  verificable, del tamaño que un agente completa sin perder foco
  (regla práctica: si una task necesita sub-decisiones de diseño,
  era material de plan.md, no de tasks.md).
- Marcar checkboxes A MEDIDA que se completan, no en lote al final.
- Referenciar los AC que cada task satisface: los tests con ID se
  escriben en la misma task, no en una fase final de "testing".
- Si plan_hash ≠ hash actual del plan → tasks stale, regenerar.
-->

## Fase 1 — <nombre de fase>

- [ ] T1.1 — <acción concreta> 
- [ ] T1.2 — <acción concreta> `[AC-01]` (incluye su test)
- [ ] T1.3 — ...

## Fase 2 — <nombre de fase>

- [ ] T2.1 — <acción concreta> `[AC-02, AC-03]` (incluye sus tests)
- [ ] T2.2 — ...

## Fase N — Cierre

- [ ] TN.1 — Suite completa verde (`bun run test`)
- [ ] TN.2 — `bun run check` limpio (Biome + tsc)
- [ ] TN.3 — Diff revisado contra "Superficie de cambio" del plan
- [ ] TN.4 — Ejecutar `/close-spec`

## Definition of Done (global)

- Todos los AC con test trazado por ID y en verde
- Sin drift: hashes de spec/plan/tasks coherentes
- Capa durable actualizada si el plan §4 lo declaró
- Carpeta archivada vía `/close-spec`

## Notas de ejecución

<!-- Espacio del agente/humano para registrar desvíos, hallazgos o
bloqueos durante la implementación. Insumo útil para el ritual de
cierre y para detectar si el plan tuvo huecos. -->
