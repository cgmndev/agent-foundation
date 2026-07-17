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
TypeScript estricto · Node LTS + pnpm · Hono · pg-boss ·
React + TanStack Start (modo SPA) + Query · Zustand (solo client state) ·
Shadcn UI + Tailwind v4 + lucide-react · react-hook-form + Zod v4 ·
Drizzle + PostgreSQL · Vitest + Testcontainers + Playwright · Biome.
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
- Contratos API explícitos en packages/shared/contracts (route builders); las rutas Hono
  se registran DESDE el contrato (método+path existen una sola vez) y el cliente HTTP
  se construye desde ellos. SIN RPC: nunca inferir tipos del servidor (hono/client, tRPC).
- Tipos derivados (z.infer, $inferSelect), nunca a mano.
- Server state en TanStack Query; client state: useState/URL primero, Zustand solo si cruza rutas.
- Errores API: { error: { code, message } } desde el handler central; codes en shared.
Detalle y anti-patrones: docs/foundation/02-arquitectura.md

## Reglas duras
- Sin `any`, sin `console.log`, sin dependencias nuevas sin aprobación.
- Todo input externo se valida con Zod en el boundary.
- Errores: lanzar AppError con code estable; el handler central los traduce.
- Server functions de Start: prohibidas para lógica de negocio o acceso a DB; todo
  pasa por la API Hono. Modo SPA salvo ADR que habilite SSR.
- Import Drizzle SIEMPRE de drizzle-orm/pg-core; config dialect: 'postgresql'.
- timestamptz siempre; migraciones inmutables; jamás drizzle-kit push fuera de local.
- Toda ruta del frontend define errorComponent; __root lleva el fallback global.
- Todo payload de pg-boss extiende baseJobPayloadSchema (correlationId obligatorio);
  todo endpoint que encola jobs o llama a un LLM lleva rate limit.
- Features nuevas: Test-Last (integración tras compilar, leyendo el código real).
  Bugs: Test-First (el test reproduce el error y debe fallar antes del fix).
- Código en inglés; specs y dominio en español (docs/foundation/04, sección Idioma).
- Commits: Conventional Commits en inglés, uno por cambio lógico, al cierre de cada task.
- Sin comentarios-narración; comentarios solo para el porqué.
- Antes de implementar una spec: drift-check limpio (hashes spec/plan/tasks coherentes).
- Nunca leer specs/archive/ salvo petición explícita del usuario.
- docs/architecture.md y docs/domain.md se editan solo proponiendo diff o vía /close-spec.
- Marcar checkboxes de tasks.md al completar cada task, no en lote al final.
- Ideas fuera de alcance → fila en docs/roadmap.md (parking), no código ni TODOs.

## Prohibido → Alternativa
| Prohibido | Usar en su lugar |
|---|---|
| fetch/axios directo en componentes | Hooks de feature con TanStack Query + cliente de contratos |
| WebSockets / SSE / conexiones persistentes | Short-polling: refetchInterval 5s condicional / 15s global |
| hono/client (RPC), tRPC | Contratos explícitos en packages/shared/contracts |
| React Testing Library / render en Vitest | Playwright (money paths); Vitest solo lógica pura |
| Material UI / Chakra / CSS-in-JS / .css manual | Shadcn UI + Tailwind (components/ui) |
| Ampliar client.ts (interceptores, retries, cache) | TanStack Query; el wrapper queda en ~100 líneas |

## Carga de contexto por tarea
| Tarea | Leer antes |
|---|---|
| Feature nueva | docs/foundation/02 + 03 |
| Schema/queries | docs/foundation/05 |
| Tests | docs/foundation/06 |
| Auth/seguridad | docs/foundation/07 |
| Jobs / reactividad | docs/foundation/01 (pg-boss, polling) + 02 |
| Pipeline/deploy | docs/foundation/08 |
| Crear/cambiar/cerrar spec | docs/foundation/12 |

## Specs
Trabajo por specs (spec.md/plan.md/tasks.md) con skills /new-spec, /activate-spec,
/change-spec, /close-spec. Los AC-NN del spec se mapean 1:1 a tests.
Modo del proyecto: <consultoria | producto-propio> (ADR 0001; define el gate de activación).
Specs activas: specs/active/ · Guía: docs/foundation/12-guia-specs.md

## Dominio
Glosario y modelo: docs/domain.md · Arquitectura viva: docs/architecture.md ·
Decisiones (ADRs): docs/decisions/ · Parking: docs/roadmap.md
