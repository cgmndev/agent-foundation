---
doc: estructura-repo
version: 1.1
fecha: 2026-07-06
estado: vigente
tipo: capa-durable
---

# 03 — Estructura del Repositorio

Layout estándar de todo proyecto nuevo. Monorepo con workspaces nativos. El agente debe poder predecir dónde vive cualquier cosa sin buscar.

## Layout completo

```
<proyecto>/
├── apps/
│   ├── api/                    # Backend Hono sobre Node
│   │   ├── src/
│   │   │   ├── modules/        # Vertical slices (ver 02-arquitectura.md)
│   │   │   ├── core/           # Transversal mínimo: db client, logger, errors, auth setup
│   │   │   ├── app.ts          # Composición de la app Hono (monta módulos)
│   │   │   └── main.ts         # Entry point (server, señales, graceful shutdown)
│   │   ├── drizzle/            # Migraciones generadas
│   │   └── package.json
│   └── web/                    # Frontend React + TanStack Router
│       ├── src/                # (layout en 02-arquitectura.md)
│       └── package.json
├── packages/
│   ├── shared/                 # Schemas Zod de contrato + tipos + constantes de dominio
│   │   └── src/
│   │       ├── schemas/        # Un archivo por entidad: user.schema.ts, order.schema.ts
│   │       └── index.ts        # Exports explícitos
│   └── db/                     # Schema Drizzle (fuente de verdad de datos)
│       └── src/
│           ├── schema/         # Un archivo por tabla o grupo cohesivo
│           └── index.ts
├── specs/
│   ├── active/                 # Specs en curso: una carpeta AAAA-MM-slug por feature
│   └── archive/                # Specs cerradas, por mes de cierre (AAAA-MM/)
├── docs/
│   ├── foundation/              # ESTA suite (snapshot del vault; incluye plantillas/)
│   ├── decisions/              # ADRs numerados, inmutables (plantillas/plantilla-adr.md)
│   ├── architecture.md         # Doc vivo de arquitectura (instancia de plantilla)
│   ├── domain.md               # Doc vivo de dominio (instancia de plantilla)
│   └── runbook.md              # 1 página: deploy, rollback, restore, contactos (08-devops.md)
├── .claude/
│   └── settings.json           # Permissions del proyecto (skills y hooks NO se copian: llegan por el plugin `agent-foundation`)
├── infra/                      # Terraform/OpenTofu (08-devops.md): red, DB, servicio, secrets
├── CLAUDE.md                   # Guía del agente (docs/foundation/plantillas/plantilla-claude.md)
├── README.md                   # Para humanos: qué es, cómo levantar, punteros (10-20 líneas)
├── biome.json
├── lefthook.yml                # Pre-commit: biome + tsc (04-convenciones-codigo.md)
├── tsconfig.base.json
├── docker-compose.yml          # Postgres local + servicios de dev
├── .env.example                # TODAS las variables, documentadas, sin valores reales
├── pnpm-workspace.yaml         # Workspaces del monorepo (apps/*, packages/*)
└── package.json                # Scripts raíz + campo packageManager (pnpm)
```

## Reglas de dependencia entre paquetes

```
apps/web  →  packages/shared
apps/api  →  packages/shared, packages/db
packages/db  →  (nada interno)
packages/shared  →  (nada interno; solo Zod)
```

- `shared` nunca importa de `db` ni de las apps. Es la capa de contrato pura.
- El frontend NUNCA importa `packages/db` (los tipos de tablas no son el contrato API).

## Convenciones de nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos | kebab-case | `order-items.repo.ts` |
| Sufijos por rol | `.routes.ts`, `.service.ts`, `.repo.ts`, `.schema.ts`, `.test.ts`, `.store.ts` | `billing.service.ts` |
| Componentes React | PascalCase en archivo kebab-case | `invoice-table.tsx` exporta `InvoiceTable` |
| Tablas Postgres | snake_case plural | `order_items` |
| Variables/funciones | camelCase; funciones = verbo | `calculateTotal` |
| Tipos/interfaces | PascalCase sin prefijo `I` | `OrderSummary` |
| Constantes de dominio | SCREAMING_SNAKE en `shared` | `MAX_RETRY_ATTEMPTS` |
| Env vars | SCREAMING_SNAKE con prefijo de app si aplica | `API_DATABASE_URL` |
| Branches | `feat/`, `fix/`, `chore/` + slug corto | `feat/order-export` |

Los sufijos por rol son críticos para el agente: `grep -r "\.repo\.ts"` localiza toda la capa de datos; el nombre del archivo declara su responsabilidad sin abrirlo.

## Scripts raíz estandarizados (idénticos en todo proyecto)

```jsonc
{
  "scripts": {
    "dev": "…",              // levanta api + web en watch
    "build": "…",            // build de todos los workspaces
    "test": "…",             // vitest run (unit + integration)
    "test:e2e": "…",         // playwright smoke
    "check": "…",            // biome check + tsc --noEmit en todos los ws
    "db:generate": "…",      // drizzle-kit generate
    "db:migrate": "…",       // aplicar migraciones
    "db:seed": "…",          // seed de desarrollo
    "db:studio": "…"         // drizzle studio
  }
}
```

Regla para el agente: **estos nombres nunca cambian entre proyectos.** `pnpm check` y `pnpm test` son el feedback loop universal; el agente no debe descubrir comandos, los conoce a priori.

## README por módulo (opcional pero recomendado en módulos grandes)

Cuando un módulo supera ~6 archivos, añadir `README.md` de máximo 30 líneas: propósito, interfaz pública, invariantes, decisiones locales. Es la documentación que el agente carga al entrar al módulo (progressive disclosure), no un documento global.

## Qué NO va en el repo

- Documentación de investigación / Layer 1 del vault (vive en Obsidian).
- Specs cerrados de proyectos anteriores.
- Configuración personal del agente (va en `~/.claude`, no en `.claude/` del repo; el repo solo lleva lo compartible con el equipo/cliente).
