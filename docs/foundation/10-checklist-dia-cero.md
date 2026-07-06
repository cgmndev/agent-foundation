---
doc: checklist-dia-cero
version: 1.1
fecha: 2026-07-06
estado: vigente
tipo: capa-durable
---

# 10 — Checklist Día Cero

Secuencia ejecutable para iniciar un proyecto nuevo. Objetivo: repo productivo con feedback loop completo en medio día; infra base en un día. Todo lo de abajo es automatizable como plantilla/skill una vez ejecutado 2 veces a mano.

## Fase 0 — Antes de escribir código

- [ ] Kickoff con cliente cerrado: alcance macro, entorno cloud (AWS u OCI), dominio DNS, y quién aprueba deploys a production.
- [ ] Crear repo (privado) con branch protection en `main` (PR obligatoria, checks requeridos).
- [ ] Harness instalado: `/plugin marketplace add cgmndev/agent-foundation` + `/plugin install agent-foundation@agent-foundation`.
- [ ] `/init-project` ejecutado: copia esta suite a `docs/foundation/`, instancia `CLAUDE.md`, `docs/architecture.md`, `docs/domain.md` (glosario inicial), `docs/decisions/`, `specs/` y `.claude/settings.json`.
- [ ] Escribir `docs/domain.md` inicial: glosario de 10-20 términos del negocio en el idioma del cliente. Es el documento más rentable del proyecto para el agente.
- [ ] Primer spec creado con `/new-spec` para el slice inicial (walking skeleton).

## Fase 1 — Scaffold del monorepo (medio día)

- [ ] Estructura según [03-estructura-repo.md](03-estructura-repo.md): `apps/api`, `apps/web`, `packages/shared`, `packages/db`.
- [ ] Raíz: `package.json` con workspaces + scripts estandarizados, `tsconfig.base.json` estricto ([04-convenciones-codigo.md](04-convenciones-codigo.md)), `biome.json`, `lefthook.yml` (pre-commit operativo, verificado con un commit de prueba), `.env.example`, `.gitignore`, `README.md`.
- [ ] `docker-compose.yml` con Postgres (misma major que producción) + volumen.
- [ ] `apps/api`: Hono + `@hono/node-server`, `core/` (config Zod fail-fast, logger pino, errors, db client Drizzle), `app.ts` con `secureHeaders`, error handler central, `/health` y `/ready`.
- [ ] `packages/db`: schema inicial (tabla de prueba con columnas estándar), `drizzle.config.ts` (`dialect: 'postgresql'`), primera migración generada y aplicada.
- [ ] `packages/shared`: primer schema Zod de contrato + export explícito.
- [ ] `apps/web`: Vite + React + TanStack Router (file-based) + Query provider + Tailwind v4 + shadcn/ui inicializado (`components/ui/`) + cliente `hono/client` tipado; una ruta que consume el endpoint de prueba end-to-end.
- [ ] Testing operativo: Vitest configurado en api/web, Testcontainers con un test de integración real del módulo de prueba, Playwright con un smoke.
- [ ] **Gate:** `bun run check && bun run test && bun run test:e2e` en verde. Este es el nacimiento del feedback loop; no avanzar sin él.

## Fase 2 — Harness del agente (2-3 horas)

- [ ] `CLAUDE.md` (generado por `/init-project`) ajustado al dominio del proyecto.
- [ ] `.claude/settings.json` (generado) revisado.
- [ ] Hooks del plugin verificados con pruebas reales: leer `specs/archive/` se bloquea (archive-guard), `drizzle-kit push` se bloquea (guard-migrations), una dependencia nueva pide aprobación (guard-deps).
- [ ] Skills del plugin visibles: `/new-spec` … `/init-project`.
- [ ] MCP: solo Postgres local (+ GitHub si aplica). Verificar tokens de arranque de contexto (<30k).
- [ ] Prueba de fuego: pedir al agente un módulo trivial de punta a punta y verificar que respeta estructura, reglas y cierre con checks.

## Fase 3 — Pipeline e infraestructura (1 día)

- [ ] GitHub Actions: workflow de PR (install → check → test → build) bloqueante.
- [ ] `infra/` con Terraform/OpenTofu desde el módulo base reutilizable: red mínima, Postgres gestionado, servicio contenedor, secrets, registry.
- [ ] Dockerfile multi-stage (build con Bun, runtime `node:<LTS>-slim`, non-root) construyendo local OK.
- [ ] Staging desplegado end-to-end desde `main` (imagen → migraciones → app → smoke E2E contra staging).
- [ ] Secrets en Secrets Manager/Vault; ninguno en repo ni en CI en claro.
- [ ] Sentry conectado (backend + frontend) con release por SHA.
- [ ] Alertas mínimas: 5xx, CPU/memoria, storage/conexiones de DB → canal del proyecto.
- [ ] Environment protection: aprobación manual para production.

## Fase 4 — Primer vertical slice real (resto de semana 1)

- [ ] Activar el spec del walking skeleton (`/activate-spec`): un flujo de negocio real, delgado, DB→API→UI, desplegado a staging.
- [ ] Demo al cliente sobre staging al cierre de la semana (ancla la relación de transparencia).
- [ ] Retro de 30 min: qué regla del paquete faltó o estorbó → ADR o propuesta de cambio a la fundación (versionar).

## Criterio de "proyecto iniciado correctamente"

1. Feedback loop total en verde (`check` + `test` + `test:e2e`) local y en CI.
2. Deploy a staging reproducible desde `main` sin pasos manuales (salvo aprobación).
3. El agente produce un módulo conforme a las reglas sin correcciones estructurales.
4. `domain.md` existe y el cliente validó el glosario.
5. Ningún secreto en repo, historial ni contexto del agente.
