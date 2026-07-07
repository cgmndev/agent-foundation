---
type: plantilla
artefacto: claude-md
---

<!--
PLANTILLA CLAUDE.md — copiar el contenido bajo la línea como CLAUDE.md del
proyecto y ajustar los <>. Presupuesto: <~150 líneas rellenada. Las secciones
"Comandos" y "Reglas duras" son idénticas en todos los proyectos: no se tocan.
-->
---

# <Proyecto>

<Una frase: qué es y para quién.>

## Stack
TypeScript estricto · Node LTS + pnpm · Hono ·
React + TanStack Start (SSR/SPA) + Query · Zustand (solo client state) · Tailwind v4 + shadcn/ui ·
react-hook-form + Zod v4 · Drizzle + PostgreSQL · Vitest + Testcontainers · Biome.
Decisiones y justificación: docs/foundation/01-stack.md

## Comandos (nunca cambian)
- pnpm dev / build / test / test:e2e / check
- pnpm db:generate / db:migrate / db:seed / db:studio
Cierre de toda task: `pnpm check && pnpm test` en verde. Sin verde no hay done.

## Arquitectura (resumen operativo)
Monolito modular en vertical slices. Módulo = apps/api/src/modules/<x> con
routes → service → repo (dependencia en un solo sentido).
- Cross-módulo SOLO vía index.ts del otro módulo.
- Queries SOLO en *.repo.ts. Escrituras multi-tabla = transacción.
- Contratos Zod en packages/shared; tipos derivados (z.infer, $inferSelect), nunca a mano.
- Server state en TanStack Query; Zustand solo estado de UI.
- Errores API: { error: { code, message } } desde el handler central; codes en shared.
Detalle y anti-patrones: docs/foundation/02-arquitectura.md

## Reglas duras
- Sin `any`, sin `console.log`, sin dependencias nuevas sin aprobación.
- Todo input externo se valida con Zod en el boundary.
- Errores: lanzar AppError con code estable; el handler central los traduce.
- Import Drizzle SIEMPRE de drizzle-orm/pg-core; config dialect: 'postgresql'.
- timestamptz siempre; migraciones inmutables; jamás drizzle-kit push fuera de local.
- Código en inglés; specs y dominio en español (docs/foundation/04, sección Idioma).
- Commits: Conventional Commits en inglés, uno por cambio lógico, al cierre de cada task.
- Sin comentarios-narración; comentarios solo para el porqué.
- Antes de implementar una spec: drift-check limpio (hashes spec/plan/tasks coherentes).
- Nunca leer specs/archive/ salvo petición explícita del usuario.
- docs/architecture.md y docs/domain.md se editan solo proponiendo diff o vía /close-spec.
- Marcar checkboxes de tasks.md al completar cada task, no en lote al final.

## Carga de contexto por tarea
| Tarea | Leer antes |
|---|---|
| Feature nueva | docs/foundation/02 + 03 |
| Schema/queries | docs/foundation/05 |
| Tests | docs/foundation/06 |
| Auth/seguridad | docs/foundation/07 |
| Pipeline/deploy | docs/foundation/08 |
| Crear/cambiar/cerrar spec | docs/foundation/12 |

## Specs
Trabajo por specs (spec.md/plan.md/tasks.md) con skills /new-spec, /activate-spec,
/change-spec, /close-spec. Los AC-NN del spec se mapean 1:1 a tests.
Specs activas: specs/active/ · Guía: docs/foundation/12-guia-specs.md

## Dominio
Glosario y modelo: docs/domain.md · Arquitectura viva: docs/architecture.md ·
Decisiones (ADRs): docs/decisions/
