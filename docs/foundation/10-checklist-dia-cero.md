---
doc: checklist-dia-cero
version: 1.6
fecha: 2026-07-16
estado: vigente
tipo: capa-durable
---

# 10 — Checklist Día Cero

Secuencia ejecutable para iniciar un proyecto nuevo. Objetivo: repo productivo con feedback loop completo en medio día; infra base en un día. Todo lo de abajo es automatizable como plantilla/skill una vez ejecutado 2 veces a mano.

## Fase 0 — Antes de escribir código

- [ ] Kickoff con cliente cerrado: alcance macro, **perfil de despliegue y modelo de tenancy registrados como ADR-000** (default: Perfil B VPS + Coolify; Perfil A solo con gatillo de compliance/SLA/cloud existente del cliente — [08-devops.md](08-devops.md)), dominio DNS, y quién aprueba deploys a production.
- [ ] Crear repo (privado) con branch protection en `main` (PR obligatoria, checks requeridos, solo Squash and Merge).
- [ ] Harness instalado: `/plugin marketplace add cgmndev/agent-foundation` + `/plugin install agent-foundation@agent-foundation`.
- [ ] `/init-project` ejecutado: copia esta suite a `docs/foundation/`, instancia `CLAUDE.md`, `docs/architecture.md`, `docs/domain.md` (glosario inicial), `docs/decisions/`, `specs/` y `.claude/settings.json`.
- [ ] `docs/domain.md` completado: glosario de 10-20 términos del negocio en el idioma del cliente. Es el documento más rentable del proyecto para el agente.
- [ ] `docs/roadmap.md` creado desde [14-roadmap-parking.md](14-roadmap-parking.md) (parking vacío).
- [ ] Primer spec creado con `/new-spec` para el slice inicial (walking skeleton).

## Fase 1 — Scaffold del monorepo (medio día)

- [ ] Estructura según [03-estructura-repo.md](03-estructura-repo.md): `apps/api`, `apps/web`, `packages/shared`, `packages/db`.
- [ ] Raíz: `pnpm-workspace.yaml`, `package.json` con scripts estandarizados y `packageManager` pinneado (pnpm instalado explícito en CI/Docker, sin corepack), `tsconfig.base.json` estricto ([04-convenciones-codigo.md](04-convenciones-codigo.md)), `biome.json`, `lefthook.yml` (pre-commit operativo, verificado con un commit de prueba), `.env.example`, `.gitignore`, `README.md`.
- [ ] `docker-compose.yml` con Postgres (misma major que producción) + volumen.
- [ ] `apps/api`: Hono + `@hono/node-server`, `core/` (config Zod fail-fast, logger pino, errors, db client Drizzle), `app.ts` con `secureHeaders`, error handler central, `/health` y `/ready`.
- [ ] `packages/db`: schema inicial (tabla de prueba con columnas estándar), `drizzle.config.ts` (`dialect: 'postgresql'`), primera migración generada y aplicada.
- [ ] `packages/shared`: primer schema Zod + primer contrato (route builder) + fetch wrapper tipado (`client.ts`) + exports explícitos.
- [ ] `apps/web`: TanStack Start en modo SPA + Query provider + cliente API consumiendo el contrato de `shared`; una ruta con `errorComponent` que consume el endpoint de prueba end-to-end (verifica la cadena contrato→API→UI).
- [ ] UI base: Tailwind v4 + Shadcn UI inicializados (`components/ui/`), lucide-react, React Hook Form + `zodResolver` en un formulario de prueba con schema de `shared`.
- [ ] `core/queue.ts` con pg-boss (defaults del doc 01), `baseJobPayloadSchema` en `shared` y un job de prueba encolado y procesado end-to-end con `correlationId` en logs.
- [ ] Testing operativo: Vitest configurado en api/web, Testcontainers con un test de integración real del módulo de prueba, Playwright con un smoke.
- [ ] **Gate:** `pnpm check && pnpm test && pnpm test:e2e` en verde. Este es el nacimiento del feedback loop; no avanzar sin él.

## Fase 2 — Harness del agente (2-3 horas)

- [ ] `CLAUDE.md` (generado por `/init-project`) ajustado al dominio del proyecto.
- [ ] `.claude/settings.json` (generado) revisado.
- [ ] Hooks del plugin verificados con pruebas reales: leer `specs/archive/` se bloquea (archive-guard), `drizzle-kit push` se bloquea (guard-migrations), una dependencia nueva pide aprobación (guard-deps).
- [ ] Skills del plugin visibles: `/new-spec` … `/init-project`.
- [ ] MCP: solo Postgres local (+ GitHub si aplica). Verificar tokens de arranque de contexto (<30k).
- [ ] Prueba de fuego: pedir al agente un módulo trivial de punta a punta y verificar que respeta estructura, reglas y cierre con checks.

## Fase 3 — Pipeline e infraestructura (1 día)

- [ ] GitHub Actions: workflow de PR (install → check → test → build) bloqueante. Branch protection: solo Squash and Merge, checks obligatorios, rama al día, borrado automático de ramas.
- [ ] (Perfil A) `infra/` con Terraform/OpenTofu desde el módulo base reutilizable: red mínima, Postgres gestionado, servicio contenedor, secrets, registry.
- [ ] (Perfil B) VPS con Coolify instalado, app conectada vía webhook a `main`, instancia "demo" como staging, `pg-backup` subiendo a bucket externo (restore verificado), Postgres sin `ports:` al host.
- [ ] Dockerfile multi-stage (`node:<LTS>-slim`, pnpm instalado explícito con la versión de `packageManager` en build, runtime slim non-root) construyendo local OK.
- [ ] Staging desplegado end-to-end desde `main` (imagen → migraciones → app → E2E money paths contra staging).
- [ ] Secrets en Secrets Manager/Vault (A) o panel de Coolify (B); ninguno en repo ni en CI en claro.
- [ ] Sentry conectado (backend + frontend) con release por SHA.
- [ ] Alertas mínimas: 5xx, CPU/memoria, storage/conexiones de DB → canal del proyecto.
- [ ] (Perfil A) Environment protection: aprobación manual para production. (En B el gate humano es el merge del PR.)

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
