---
doc: stack
version: 1.1
fecha: 2026-07-06
estado: vigente
tipo: capa-durable
---

# 01 — Stack Tecnológico

Decisiones cerradas. Formato por componente: **Decisión → Justificación → Reglas → Umbral de revisión**. Toda desviación por proyecto requiere ADR.

## Resumen (tabla de referencia rápida)

| Capa | Decisión | Versión base |
|---|---|---|
| Lenguaje | TypeScript estricto end-to-end | 5.x, `strict: true` |
| Runtime producción | **Node LTS** (22/24) | LTS activa |
| Toolchain dev | **Bun** (package manager + task runner) | 1.3.x |
| HTTP framework | **Hono** | 4.x |
| Frontend | React + **TanStack Router** (cliente) + **TanStack Query** | estables |
| Estado cliente | **Zustand** | 5.x |
| Estilos / UI kit | **Tailwind CSS v4** + **shadcn/ui** | estables |
| Formularios | **react-hook-form** + resolver Zod | estables |
| Validación | **Zod** | v4 |
| ORM | **Drizzle** | estable |
| Base de datos | **PostgreSQL** | 16+ gestionado |
| Auth | **better-auth** | estable |
| Testing | **Vitest** + Testcontainers + Playwright (smoke) | estables |
| Lint/format | **Biome** (+ `tsc --noEmit` como gate de tipos) | 2.x |
| Logging | **pino** (JSON estructurado) | estable |
| Monorepo | Workspaces nativos (sin Turborepo inicial) | — |
| Módulos JS | ESM only (`"type": "module"`) | — |
| Build backend | **tsx** (dev) + **tsup** (bundle prod) | estables |

## Runtime: Node en producción, Bun como toolchain

**Decisión.** Node LTS es el runtime de ejecución en desarrollo y producción (paridad total). Bun se conserva como package manager (`bun install`) y task runner (`bun run`) por velocidad de DX y CI. No se usa ninguna API `Bun.*` en código de aplicación.

**Justificación.** La compatibilidad es el criterio dominante para software de clientes: native addons, observabilidad (APM/OTel), soporte de proveedores cloud (AWS/OCI) y madurez operativa siguen del lado de Node. Node 22/24 ya absorbió los principales DX wins de Bun (TS type stripping para scripts, test runner, watch mode, `--env-file`), reduciendo el costo de renunciar a Bun como runtime. El patrón híbrido es la recomendación práctica del trimestre y elimina el riesgo sin perder la velocidad de instalación (20-40x) donde más se nota: CI.

**Reglas.**
- Código portable entre runtimes: drivers de ecosistema siempre (`pg`/`postgres.js` vía Drizzle), nunca `Bun.SQL`, `Bun.serve` ni `Bun.file`.
- Tests corren sobre Node (Vitest), porque los tests deben ejecutarse en el runtime que se despliega.
- Dockerfile con base `node:<LTS>-slim`; Bun solo aparece en la stage de build para instalar dependencias.
- Scripts utilitarios pueden ejecutarse con `node --experimental-strip-types` o `tsx`; no introducir un tercer runner.

**Umbral de revisión.** Reconsiderar Bun como runtime único si: (a) la suite completa pasa 100% en Bun, (b) no hay native addons incompatibles, (c) el APM elegido soporta Bun oficialmente.

## HTTP framework: Hono

**Decisión.** Hono sobre `@hono/node-server`, con `@hono/zod-validator` en cada endpoint y export OpenAPI (`@hono/zod-openapi`) cuando haya consumidores externos.

**Justificación.** TypeScript-native, API mínima y greppable (agent-friendly), Zod como ciudadano de primera clase, portable entre runtimes (protege la opción Bun futura) y con RPC client (`hono/client`) que da type safety end-to-end dentro del monorepo sin acoplarse a un framework de RPC propietario. Fastify queda como alternativa documentada si un proyecto exige su ecosistema de plugins; Express se descarta para proyectos nuevos.

**Reglas.**
- Todo input externo (body, params, query, headers relevantes) se valida con Zod en el boundary del endpoint. Sin excepciones.
- Contrato compartido: los schemas Zod de request/response viven en `packages/shared` y los importan API y frontend.
- Sin middlewares mágicos propios: preferir composición explícita visible en el archivo de la ruta.

**Umbral de revisión.** Si un proyecto necesita streaming complejo, plugins maduros (multipart avanzado, rate limiting sofisticado) y Hono obliga a reinventar: evaluar Fastify vía ADR.

## Frontend: React + TanStack Router + TanStack Query + Zustand

**Decisión.** SPA con TanStack Router (file-based routing, cliente). TanStack Query para todo estado de servidor. Zustand solo para estado de cliente genuino (UI, preferencias, wizards). TanStack Start NO se adopta todavía.

**Justificación.** Router (cliente) es la pieza madura del ecosistema TanStack; Start sigue en Release Candidate y con RSC pendiente — riesgo innecesario para proyectos de clientes. La separación Query/Zustand elimina la ambigüedad número uno que degrada el código de agentes en frontend: duplicar estado de servidor en stores.

**Reglas.**
- **Prohibido** guardar datos de servidor en Zustand. Si viene de la API, vive en TanStack Query (cache, invalidación, loaders del Router).
- Stores de Zustand pequeños y por dominio de UI, con selectores; nunca un store global monolítico.
- Loaders del Router hacen prefetch vía Query; los componentes consumen con `useQuery`/`useSuspenseQuery`.
- Nota para el harness: los `.d.ts` de TanStack Router son ilegibles para LLMs. El agente no debe intentar "leer" los tipos generados; las convenciones de rutas se documentan en CLAUDE.md con ejemplos concretos.

**Umbral de revisión.** Adoptar TanStack Start cuando: v1.0 final + RSC shipeado + necesidad real de SSR/SEO en el proyecto. Si un proyecto exige SEO hoy: evaluar Start RC vs Next.js vía ADR (no hay default).

## UI: Tailwind CSS v4 + shadcn/ui

**Decisión.** Tailwind CSS v4 como único sistema de estilos. shadcn/ui como base del design system: los componentes se instalan copiándose al repo (`components/ui/`) y desde ese momento son código propio del proyecto. Sin CSS-in-JS runtime, sin styled-components, sin archivos CSS por componente (solo el CSS global de tokens).

**Justificación.** Es el combo con máxima representación en training data del frontend actual: los agentes lo generan con mínima tasa de error. Los estilos colocalizados en el markup preservan local reasoning y greppability (la clase describe el estilo donde se usa, sin saltar a otro archivo). shadcn/ui da ownership total: el agente lee y modifica el componente como código del proyecto, en vez de luchar contra la API opaca de una librería.

**Reglas.**
- Design tokens (colores semánticos, radios, spacing especial) solo en `@theme`/CSS variables del CSS global; prohibido hardcodear hex/px mágicos en componentes.
- Los componentes shadcn instalados vía CLI se editan como código propio; no existe "actualizar shadcn" (es copia, no dependencia).
- `@apply` solo en el CSS global de base; en componentes, las utilidades viven en el markup.
- El orden de clases no es tema de review: lo fija el tooling (regla de ordenado de Biome cuando esté estable) o se ignora.

**Umbral de revisión.** Si el cliente impone un design system corporativo propio: ADR con estrategia de integración (tokens + wrappers).

## Formularios: react-hook-form + Zod

**Decisión.** react-hook-form con resolver de Zod (`@hookform/resolvers`) para todo formulario con validación o más de 2-3 campos. Inputs sueltos simples: `useState` y ya.

**Justificación.** Estándar de facto con máxima representación en training data (principio boring technology). Cierra el círculo del contrato único: el mismo schema Zod de `packages/shared` valida el form en el cliente y el body en el endpoint — una sola fuente de verdad de validación.

**Reglas.**
- El schema del form se deriva del schema de contrato (`.pick`/`.omit`/`.extend`), nunca se duplica.
- Errores de servidor se mapean al form usando el `code` estable del contrato de errores.

**Umbral de revisión.** TanStack Form cuando su adopción/representación en training data alcance a react-hook-form (evaluar al arrancar cada proyecto).

## Validación: Zod v4

**Decisión.** Zod v4 como única librería de schemas. Valibot/ArkType no se adoptan.

**Justificación.** Zod es el estándar de facto del ecosistema agéntico (structured output, function tools, validators de Hono, drizzle-zod): máxima representación en training data. v4 resolvió el principal contra histórico (performance de compilación de tipos). Las alternativas ganan benchmarks, no ecosistema.

**Reglas.**
- Schemas como fuente de verdad: los tipos se derivan (`z.infer`), nunca se duplican a mano.
- Un schema por entidad de dominio en `packages/shared`, con variantes derivadas (`.pick`, `.omit`, `.extend`) para create/update/response.
- `safeParse` en boundaries (no lanzar desde validación); parse duro solo en código interno donde un fallo es bug.

**Umbral de revisión.** Solo si Zod estanca desarrollo o una alternativa alcanza dominancia clara de ecosistema.

## ORM: Drizzle + PostgreSQL

**Decisión.** Drizzle sobre driver estándar de Postgres. PostgreSQL 16+ gestionado (RDS en AWS / Base Database u OCI PostgreSQL en OCI). Detalle operativo completo en [05-datos.md](05-datos.md).

**Justificación.** TypeScript-native sin paso de generación (el failure mode clásico de Prisma con agentes: olvidar `prisma generate`), schema greppable y local, respaldo full-time del core team (PlanetScale). Postgres: boring technology, máxima representación en training data, cero riesgo.

**Umbral de revisión.** Ninguno previsto. La convergencia Prisma/Drizzle no cambia el veredicto: sin paso de generación gana para agentes.

## Auth: better-auth

**Decisión.** better-auth como librería de autenticación por defecto (email/password + OAuth según proyecto), con sesiones en Postgres vía adapter de Drizzle.

**Justificación.** Es el estándar TypeScript-native emergente post-Lucia: control total de datos (importante para clientes), integración Drizzle de primera clase, sin dependencia de SaaS externo. Un IdP gestionado (Cognito/Auth0) solo si el cliente ya lo tiene o hay requisito enterprise (SSO/SAML) — vía ADR.

**Reglas.** Autorización siempre en servidor, por módulo (ver [02-arquitectura.md](02-arquitectura.md)); el frontend solo oculta UI, nunca es el enforcement.

## Tooling: Biome + tsc como gates

**Decisión.** Biome como formatter + linter único. `tsc --noEmit` como gate de tipos separado. Ambos en pre-commit (rápido) y CI (bloqueante).

**Justificación.** El feedback loop del agente necesita veredicto binario y rápido; Biome da lint+format en una herramienta, en milisegundos, con una sola config — menos superficie de configuración que ESLint+Prettier y cero conflictos entre herramientas. Los tipos los vigila `tsc`, no el linter.

**Reglas.**
- Config de Biome compartida en la raíz; los proyectos no la sobreescriben.
- El agente ejecuta `bun run check` (Biome + tsc) como paso final de toda tarea; en el harness, un hook PostToolUse puede automatizarlo.
- Excepción documentada: si un cliente impone ESLint, se adopta flat config con typescript-eslint y se registra ADR.

## Build y ejecución (monorepo TS)

**Decisión.** ESM only (`"type": "module"` en todos los package.json). Los paquetes internos (`shared`, `db`) se consumen como TS source directo (sus `exports` apuntan a `src/`, sin build propio). `apps/api`: desarrollo con `tsx watch`, producción con bundle de `tsup` (esbuild) a un `dist/` único con `node_modules` como externals. `apps/web`: Vite.

**Justificación.** Cero pasos de generación intermedios = cero estados desincronizados que el agente pueda olvidar regenerar (el mismo principio por el que Drizzle ganó a Prisma). El `moduleResolution: bundler` del tsconfig ([04-convenciones-codigo.md](04-convenciones-codigo.md)) exige exactamente este modelo. tsx y tsup son boring, ubicuos y casi sin config.

**Reglas.**
- Ningún paquete interno tiene script de build; si un cambio en `shared` rompe `api`, lo detecta el `tsc --noEmit` de `bun run check`, no un paso de compilación.
- El bundle de producción incluye solo código propio + paquetes workspace; las dependencias externas van instaladas en la imagen (stage de producción del Dockerfile, [08-devops.md](08-devops.md)).
- `engines.node` fijado a la LTS elegida; misma versión en Dockerfile y CI.

**Umbral de revisión.** Cuando Node estabilice el type-stripping completo (sin flags, con transforms), evaluar eliminar tsx/tsup y ejecutar TS directo (ADR).

## Observabilidad: pino + OpenTelemetry (opcional por proyecto)

**Decisión.** pino con logs JSON estructurados desde el día uno. OTel/APM se activa por proyecto según SLA del cliente. Sentry (o equivalente) para error tracking de frontend y backend.

**Reglas.** Nada de `console.log` en código de aplicación (regla de Biome). Logger por módulo con `child({ module })`. Detalle en [08-devops.md](08-devops.md).

## Qué queda explícitamente fuera del stack default

- **Microservicios / colas distribuidas de entrada.** Monolito modular ([02-arquitectura.md](02-arquitectura.md)). Un job runner in-process o `pg`-based (p. ej. pg-boss) cubre background jobs hasta que la escala demuestre lo contrario.
- **GraphQL.** REST + RPC tipado de Hono cubre los casos; GraphQL solo si el cliente lo exige (ADR).
- **Redis de entrada.** Postgres cubre cache ligera, jobs y locks al inicio (`UNLOGGED` tables, advisory locks). Redis entra cuando haya evidencia de necesidad.
- **Turborepo/Nx de entrada.** Workspaces + scripts hasta que el build supere ~2-3 min o haya >4 paquetes con grafo real de dependencias.
- **i18n.** Una sola lengua por proyecto como default (la del cliente); librería de i18n solo si el proyecto lo exige (ADR).
- **Realtime.** Polling con TanStack Query cubre el inicio; SSE sobre streaming de Hono si hay necesidad real; WebSockets dedicados = ADR.
- **Feature flags.** Config por entorno al inicio; servicio dedicado solo con evidencia (ADR).
- **Capa de IA en el producto.** Si el proyecto tiene features de IA: SDK oficial del proveedor (Anthropic por defecto) y decisión por proyecto vía ADR; el stack default no la presume. pgvector: ver [05-datos.md](05-datos.md).
