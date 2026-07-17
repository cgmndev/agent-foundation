---
doc: stack
version: 1.5
fecha: 2026-07-16
estado: vigente
tipo: capa-durable
---

# 01 — Stack Tecnológico

Decisiones cerradas. Formato por componente: **Decisión → Justificación → Reglas → Umbral de revisión**. Toda desviación por proyecto requiere ADR.

## Resumen (tabla de referencia rápida)

| Capa | Decisión | Versión base |
|---|---|---|
| Lenguaje | TypeScript estricto end-to-end | 5.x, `strict: true` |
| Runtime (todos los entornos) | **Node LTS** (22/24) | LTS activa |
| Package manager / task runner | **pnpm** (pinneado en `packageManager`, instalado explícito) | mayor estable |
| Módulos JS | ESM only (`"type": "module"`) | — |
| Build backend | **tsx** (dev y scripts) + **tsup** (bundle prod) | estables |
| HTTP framework | **Hono** | 4.x |
| Contrato API | **Zod explícito en `packages/shared`** (route builders, sin RPC) | — |
| Frontend | React + **TanStack Start en modo SPA** + **TanStack Query** | Start 1.x |
| Estado cliente | **Zustand** | 5.x |
| UI y formularios | **Shadcn UI + Tailwind v4 + lucide-react + React Hook Form** (`zodResolver`) | estables |
| Reactividad | **Short-polling** vía TanStack Query (`refetchInterval`) | — |
| Validación | **Zod** | v4 |
| ORM | **Drizzle** | estable |
| Base de datos | **PostgreSQL** | 16+ (gestionado o contenedor según perfil de despliegue) |
| Jobs en background | **pg-boss** (cola transaccional sobre Postgres) | estable |
| Auth | **better-auth** | estable |
| Testing | **Vitest** + Testcontainers + Playwright (money paths) | estables |
| Lint/format | **Biome** (+ `tsc --noEmit` como gate de tipos) | 2.x |
| Logging | **pino** (JSON estructurado) | estable |
| Monorepo | Workspaces nativos de pnpm (sin Turborepo inicial) | — |

## Runtime y toolchain: Node en todos los entornos + pnpm

**Decisión.** Node LTS es el único runtime en desarrollo, CI y producción (paridad total). pnpm es el package manager y task runner, con versión pinneada en `packageManager` e instalación explícita (sin corepack). Bun queda fuera del stack por completo, también como toolchain.

**Justificación.** Un solo runtime en todos los entornos elimina una clase entera de fricciones (resolución de módulos, lifecycle scripts, divergencias sutiles entre instalación y ejecución) y reduce la superficie de reglas de contención del harness: desaparece la vigilancia de APIs `Bun.*` y de diferencias install/runtime. La velocidad que se cede la recupera pnpm en gran parte con su store global content-addressable y hard links — con una sinergia directa con la paralelización por **git worktrees**: cada worktree instala en segundos reutilizando el store. pnpm añade además lo que Bun no daba: **estrictez sin phantom dependencies** (un import no declarado falla ruidosamente — veredicto binario). Node 22/24 ya integró los DX wins relevantes (TS type stripping para scripts, test runner, watch mode, `--env-file`). Es boring technology aplicado con coherencia: las horas no perdidas en edge cases de doble runtime valen más que los segundos ganados en install.

**Reglas.**
- `packageManager` pinneado en el `package.json` raíz como declaración de versión; **CI y Docker instalan pnpm explícitamente** (versión pinneada), sin depender de corepack — Node ya anunció su salida de la distribución por defecto.
- CI instala con `pnpm install --frozen-lockfile` + cache del store de pnpm.
- Workspaces declarados en `pnpm-workspace.yaml`; dependencias internas con protocolo `workspace:*`.
- Drivers de ecosistema siempre (`pg`/`postgres.js` vía Drizzle); nada atado a un runtime específico.
- Tests corren sobre Node (Vitest): el runtime de tests es el runtime que se despliega.
- Scripts utilitarios con `tsx`, único runner del repo (el type stripping nativo de Node cambia de flags entre versiones; tsx es estable y suficiente).

**Umbral de revisión (reversión de Bun, 2026-07, documentada).** Bun se retiró porque el híbrido pagaba dualidad estructural (reglas de contención + trampa `bun test` + Docker de dos bases) para aprovechar solo su instalador, y pnpm cubre esa ventaja sin runtime dual. Reconsiderar Bun — como runtime+PM completo, no como híbrido — solo si: (a) los installs se vuelven cuello real en CI/worktrees (>1-2 min con caché), o (b) el ecosistema agéntico consolida tooling Bun-first, y además (c) la suite pasa 100% en Bun y (d) el APM elegido lo soporta oficialmente.

## Build y ejecución (monorepo TS)

**Decisión.** ESM only (`"type": "module"` en todos los package.json). Los paquetes internos (`shared`, `db`) se consumen como TS source directo (sus `exports` apuntan a `src/`, sin build propio). `apps/api`: desarrollo con `tsx watch`, producción con bundle de `tsup` (esbuild) a un `dist/` único con `node_modules` como externals. `apps/web`: TanStack Start (build sobre Vite; estático en modo SPA, server Nitro solo si un ADR habilita SSR).

**Justificación.** Cero pasos de generación intermedios = cero estados desincronizados que el agente pueda olvidar regenerar (el mismo principio por el que Drizzle ganó a Prisma). El `moduleResolution: bundler` del tsconfig ([04-convenciones-codigo.md](04-convenciones-codigo.md)) exige exactamente este modelo. tsx y tsup son boring, ubicuos y casi sin config.

**Reglas.**
- Ningún paquete interno tiene script de build; si un cambio en `shared` rompe `api`, lo detecta el `tsc --noEmit` de `pnpm check`, no un paso de compilación.
- El bundle de producción incluye solo código propio + paquetes workspace; las dependencias externas van instaladas en la imagen (stage de producción del Dockerfile, [08-devops.md](08-devops.md)).
- `engines.node` fijado a la LTS elegida; misma versión en Dockerfile y CI.

**Umbral de revisión.** Cuando Node estabilice el type-stripping completo (sin flags, con transforms), evaluar eliminar tsx/tsup y ejecutar TS directo (ADR).

## HTTP framework: Hono

**Decisión.** Hono sobre `@hono/node-server`, con `@hono/zod-validator` en cada endpoint y export OpenAPI (`@hono/zod-openapi`) cuando haya consumidores externos.

**Justificación.** TypeScript-native, API mínima y greppable (agent-friendly), Zod como ciudadano de primera clase y portable entre runtimes. Fastify queda como alternativa documentada si un proyecto exige su ecosistema de plugins; Express se descarta para proyectos nuevos.

**Reglas.**
- Todo input externo (body, params, query, headers relevantes) se valida con Zod en el boundary del endpoint. Sin excepciones.
- Sin middlewares mágicos propios: preferir composición explícita visible en el archivo de la ruta.

### Contrato API: explícito y sin RPC

**Decisión.** Los contratos viven en `packages/shared/contracts/` como **route builders explícitos**: por endpoint, método + path + schemas Zod de params/request/response, escritos a mano. El cliente HTTP del frontend es un fetch wrapper tipado genérico (~50-100 líneas) que consume esos contratos. `hono/client` (RPC) NO se usa; tampoco tRPC.

**Justificación.** La inferencia profunda del `AppType` del servidor es la misma clase de "magia" que los `.d.ts` complejos: no-greppable e ilegible para LLMs, degrada `tsc --noEmit` de forma no lineal al crecer la API, y además crea **doble fuente de verdad** frente a los schemas de `shared` (el envelope de error del handler central queda fuera de la inferencia, y la inferencia no valida la respuesta real en runtime). El contrato explícito da tipado centralizado y vivo (los tipos se derivan de Zod y cambian con el schema) con razonamiento 100% local: el agente lee el contrato en un archivo y sabe todo del endpoint.

**Reglas.**
- Un contrato por endpoint, junto al schema de su entidad; la API lo consume con `@hono/zod-validator` (mismo schema, cero duplicación) y el frontend vía el wrapper tipado.
- **La ruta Hono se registra DESDE el contrato:** método y path se leen del objeto contrato; el `.routes.ts` solo adjunta el handler. El path existe una sola vez en el repo, y el drift contrato↔ruta queda estructuralmente imposible.
- **El frontend jamás construye URLs a mano:** siempre consume los builders del contrato. Renombrar una ruta = un solo punto de edición.
- **Presupuesto duro del fetch wrapper (`client.ts`): ~100 líneas y alcance congelado** — armar la URL desde el contrato, validar la response con el schema y traducir errores al formato de `AppError`. Interceptores, retries, cache o middleware dentro del wrapper son defecto: eso vive en TanStack Query o no vive.
- Los tests de contrato validan que las responses reales cumplen el schema del contrato ([06-testing.md](06-testing.md)).
- Export OpenAPI desde los mismos schemas cuando haya consumidores externos.

**Umbral de revisión.** Si un proyecto necesita streaming complejo, plugins maduros (multipart avanzado, rate limiting sofisticado) y Hono obliga a reinventar: evaluar Fastify vía ADR. Consumidores externos múltiples o SDK público → OpenAPI + cliente generado, vía ADR.

## Frontend: React + TanStack Start (modo SPA) + TanStack Query + Zustand

**Decisión.** TanStack Start como framework único de frontend, operado en **modo SPA por defecto**. SSR/streaming/server functions se habilitan por proyecto vía ADR cuando exista requisito real (SEO, contenido público, TTFB). TanStack Query para todo estado de servidor; Zustand solo para estado de cliente genuino (UI, preferencias, wizards).

**Justificación.** Un solo framework, dos mundos: la decisión SPA vs SSR deja de ser una decisión de stack (con migración) y pasa a ser configuración por proyecto. Start v1.0 (marzo 2026) es estable y por debajo es el mismo TanStack Router: en modo SPA el runtime es esencialmente Router + Vite con setup estandarizado — riesgo incremental bajo. RSC sigue pendiente y Thoughtworks lo mantiene en Assess: por eso el default conservador es SPA. La separación Query/Zustand elimina la ambigüedad número uno que degrada el código de agentes en frontend: duplicar estado de servidor en stores.

**Reglas.**
- Modo SPA es el default de todo proyecto nuevo; habilitar SSR/server functions requiere ADR con el requisito que lo justifica. El modo elegido se fija en el CLAUDE.md del proyecto.
- **Las server functions NO son un segundo backend.** La lógica de negocio y el acceso a datos viven en la API Hono ([02-arquitectura.md](02-arquitectura.md)). Regla dura: si una server function toca la base de datos o contiene reglas de negocio, es defecto. Se permiten solo como glue de presentación (cookies, proxy trivial) y con ADR — son RPC por inferencia, la misma magia que rechaza §Contrato API.
- **SSR-safe desde el día uno:** cero globals de browser (`window`, `document`, `localStorage`) en scope de módulo; así SPA↔SSR es un flip de config, no un refactor.
- **Si un ADR habilita SSR:** el loader corre en server — el fetch a Hono usa base URL isomórfica (interna en server, relativa en cliente) y **forwardea la cookie de sesión** del request entrante para que better-auth valide server-side.
- **Prohibido** guardar datos de servidor en Zustand. Si viene de la API, vive en TanStack Query (cache, invalidación, loaders).
- **Escalera de estado de cliente:** `useState` local primero; URL/search params (tipados por el Router) para estado compartible; Zustand solo cuando el estado cruza rutas o componentes lejanos. Un store nuevo exige justificación en el PR — "por consistencia" no lo es. Stores pequeños con selectores; nunca un store global monolítico.
- Loaders hacen prefetch vía Query; los componentes consumen con `useQuery`/`useSuspenseQuery`.
- Nota para el harness: los `.d.ts` de TanStack son ilegibles para LLMs. El agente no debe intentar "leer" los tipos generados; las convenciones de rutas se documentan en CLAUDE.md con ejemplos concretos.

**Umbral de revisión (tripwire explícito).** Volver a Router + Vite —degradación de bajo costo, es el mismo router— sin debate si se cumple cualquiera de estos: (a) 2 incidentes de breaking config entre minors de Start, o (b) más de un día perdido en tooling de Start dentro de un mismo proyecto. Se evalúa al cierre de cada proyecto. Adoptar SSR como default solo cuando RSC esté shipeado y un proyecto lo haya validado en producción.

## UI y formularios: Shadcn UI + Tailwind CSS v4

**Decisión.** Tailwind CSS v4 + Shadcn UI (sobre Radix) como capa de UI; `lucide-react` como set único de iconos; React Hook Form + `zodResolver` para formularios, reutilizando los schemas de `packages/shared` (validación isomórfica: las mismas reglas en cliente y servidor).

**Justificación.** Shadcn no es una dependencia: el código de cada componente se descarga al repo (`components/ui/`), es editable y greppable — el modelo de ownership ideal para agentes, y de las combinaciones mejor representadas en training data. Radix aporta la accesibilidad. La validación isomórfica elimina la deriva entre reglas de formulario y reglas de API.

**Reglas.**
- Componentes base se agregan con el CLI de Shadcn a `components/ui/` y se personalizan ahí; sin wrappers genéricos encima. No existe "actualizar shadcn" (es copia, no dependencia).
- Design tokens (colores semánticos, radios, spacing especial) solo en `@theme`/CSS variables del CSS global; prohibido hardcodear hex/px mágicos en componentes.
- Prohibido: Material UI, Chakra, CSS-in-JS, archivos `.css` manuales (fuera de los globals de Tailwind), heroicons/font-awesome.
- Formularios siempre con RHF + `zodResolver` sobre schema de `shared` (derivado con `.pick`/`.omit`/`.extend`, nunca duplicado); sin validación manual en handlers. Errores de servidor se mapean al form usando el `code` estable del contrato.

**Umbral de revisión.** Si el cliente impone un design system corporativo propio: ADR con estrategia de integración (tokens + wrappers). TanStack Form: cuando su adopción/representación en training data alcance a react-hook-form (evaluar al arrancar cada proyecto).

## Reactividad: short-polling exclusivo

**Decisión.** Toda la reactividad se resuelve con `refetchInterval` de TanStack Query (short-polling). WebSockets, SSE (`EventSource`) y cualquier conexión HTTP persistente quedan prohibidos por defecto.

**Justificación.** Para backoffice/SaaS de negocio, el polling es la solución boring: sin estado de conexión, sin fricciones con reverse proxies ni límites de navegador, sin infraestructura extra, y trivial de razonar para el agente. Las respuestas HTTP en streaming/chunked (p. ej. texto largo generado por IA) están permitidas: son requests estándar, no suscripciones persistentes.

**Reglas.**
- **Polling rápido (≈5s, condicional):** al observar un recurso cuyo estado cambia activamente; se detiene al llegar a estado final (`refetchInterval` como función que devuelve `false`).
- **Polling lento (15-30s, global):** notificaciones del sistema; se monta una sola vez en el layout raíz.
- Todo recurso pollable expone un campo de estado con valores finales claros: el frontend decide el intervalo sin heurísticas.

**Umbral de revisión.** Tiempo real persistente solo vía ADR ante requisito genuino de latencia sub-segundo (colaboración en vivo, chat operativo).

## Jobs en background: pg-boss

**Decisión.** pg-boss como cola de trabajos transaccional sobre el mismo Postgres, corriendo en el mismo proceso Node que la API (monolito modular: separación lógica de carpetas, no de procesos). Sin SQS/RabbitMQ/Kafka de entrada.

**Justificación.** Un solo servicio de estado (Postgres = datos + cola + sesiones) significa un solo backup, una sola pieza que operar y cero infraestructura extra por instancia. Reintentos, backoff exponencial y dead-letter vienen resueltos. Los jobs típicos son I/O bound (LLM, APIs externas, archivos): no bloquean el event loop de la API.

**Reglas.**
- Config base (defaults del paquete, ajustables por proyecto): `retryLimit: 3`, `retryBackoff: true`, `expireInHours: 1`, `archiveCompletedAfterSeconds: 86400`, `deleteAfterDays: 14`.
- **Todo payload extiende `baseJobPayloadSchema`** (vive en `packages/shared`), que hace obligatorio `correlationId`; el handler valida el payload con su schema antes de procesar.
- **Idempotencia obligatoria:** versionado del recurso (UUID de versión que viaja en el payload y se verifica en el `WHERE` del UPDATE) y `singletonKey` para evitar duplicados en cola.
- Los handlers viven en el módulo dueño del dominio (`<modulo>.jobs.ts`) y se registran en `main.ts`; el handler valida y delega al service, no reimplementa lógica.
- Transaccionalidad: `boss.send()` no participa automáticamente en `db.transaction` de Drizzle (pools separados). Patrón por defecto: escribir → encolar → compensar si el encolado falla; si un módulo usa otra estrategia, se documenta en su README.
- Todo endpoint que encole jobs o dispare costo (LLM) lleva rate limiting ([07-seguridad-config.md](07-seguridad-config.md)).

**Umbral de revisión.** Cola externa solo con evidencia medida de escala que pg-boss no cubra (throughput sostenido alto, consumers en varios lenguajes) — vía ADR y entrada previa en el roadmap-parking ([14-roadmap-parking.md](14-roadmap-parking.md)).

## Validación: Zod v4

**Decisión.** Zod v4 como única librería de schemas. Valibot/ArkType no se adoptan.

**Justificación.** Zod es el estándar de facto del ecosistema agéntico (structured output, function tools, validators de Hono, drizzle-zod): máxima representación en training data. v4 resolvió el principal contra histórico (performance de compilación de tipos). Las alternativas ganan benchmarks, no ecosistema.

**Reglas.**
- Schemas como fuente de verdad: los tipos se derivan (`z.infer`), nunca se duplican a mano.
- Un schema por entidad de dominio en `packages/shared`, con variantes derivadas (`.pick`, `.omit`, `.extend`) para create/update/response.
- `safeParse` en boundaries (no lanzar desde validación); parse duro solo en código interno donde un fallo es bug.
- Reglas anti-error v3→v4 para el agente: [04-convenciones-codigo.md](04-convenciones-codigo.md) §Zod v4.

**Umbral de revisión.** Solo si Zod estanca desarrollo o una alternativa alcanza dominancia clara de ecosistema.

## ORM: Drizzle + PostgreSQL

**Decisión.** Drizzle sobre driver estándar de Postgres. PostgreSQL 16+: gestionado (RDS / OCI PostgreSQL) en el perfil cloud, o contenedor con backups externos en el perfil VPS ([08-devops.md](08-devops.md)). Detalle operativo completo en [05-datos.md](05-datos.md).

**Justificación.** TypeScript-native sin paso de generación (el failure mode clásico de Prisma con agentes: olvidar `prisma generate`), schema greppable y local, respaldo full-time del core team (PlanetScale). Postgres: boring technology, máxima representación en training data, cero riesgo.

**Umbral de revisión.** Ninguno previsto. La convergencia Prisma/Drizzle no cambia el veredicto: sin paso de generación gana para agentes.

## Auth: better-auth

**Decisión.** better-auth como librería de autenticación por defecto (email/password + OAuth según proyecto), con sesiones en Postgres vía adapter de Drizzle.

**Justificación.** Es el estándar TypeScript-native emergente post-Lucia: control total de datos (importante para clientes), integración Drizzle de primera clase, sin dependencia de SaaS externo. Un IdP gestionado (Cognito/Auth0) solo si el cliente ya lo tiene o hay requisito enterprise (SSO/SAML) — vía ADR.

**Reglas.** Autorización siempre en servidor, por módulo (ver [02-arquitectura.md](02-arquitectura.md)); el frontend solo oculta UI, nunca es el enforcement.

**Umbral de revisión.** better-auth es el componente más joven después de Start, pero la puerta de salida está diseñada: sesiones y usuarios viven en tu Postgres vía Drizzle, sin SaaS. Si el proyecto se estanca (cadencia de releases, respuesta a vulnerabilidades), se migra de librería vía ADR; los datos no se mueven.

## Tooling: Biome + tsc como gates

**Decisión.** Biome como formatter + linter único. `tsc --noEmit` como gate de tipos separado. Ambos en pre-commit (rápido) y CI (bloqueante).

**Justificación.** El feedback loop del agente necesita veredicto binario y rápido; Biome da lint+format en una herramienta, en milisegundos, con una sola config — menos superficie de configuración que ESLint+Prettier y cero conflictos entre herramientas. Los tipos los vigila `tsc`, no el linter.

**Reglas.**
- Config de Biome compartida en la raíz; los proyectos no la sobreescriben.
- El agente ejecuta `pnpm check` (Biome + tsc) como paso final de toda tarea; en el harness, un hook PostToolUse puede automatizarlo.
- Excepción documentada: si un cliente impone ESLint, se adopta flat config con typescript-eslint y se registra ADR.

## Observabilidad: pino + OpenTelemetry (opcional por proyecto)

**Decisión.** pino con logs JSON estructurados desde el día uno. OTel/APM se activa por proyecto según SLA del cliente. Sentry (o equivalente) para error tracking de frontend y backend.

**Reglas.** Nada de `console.log` en código de aplicación (regla de Biome). Logger por módulo con `child({ module })`. Detalle en [08-devops.md](08-devops.md).

## Qué queda explícitamente fuera del stack default

- **Microservicios / colas distribuidas (SQS, RabbitMQ, Kafka) de entrada.** Monolito modular ([02-arquitectura.md](02-arquitectura.md)) + pg-boss cubren background jobs; cola externa solo con evidencia de escala (ADR).
- **WebSockets / SSE.** Short-polling es la decisión de reactividad de este documento; tiempo real persistente solo vía ADR.
- **GraphQL.** REST + contratos tipados en `shared` cubre los casos; GraphQL solo si el cliente lo exige (ADR).
- **Redis de entrada.** Postgres cubre cache ligera, jobs y locks al inicio (`UNLOGGED` tables, advisory locks). Redis entra cuando haya evidencia de necesidad.
- **Turborepo/Nx de entrada.** pnpm workspaces + scripts hasta que el build supere ~2-3 min o haya >4 paquetes con grafo real de dependencias.
- **RPC (hono/client, tRPC).** Sustituido por contratos explícitos en `shared` (decisión de este documento); no reevaluar salvo que el patrón de contratos demuestre un costo de mantenimiento real.
- **i18n.** Una sola lengua por proyecto como default (la del cliente); librería de i18n solo si el proyecto lo exige (ADR).
- **Feature flags.** Config por entorno al inicio; servicio dedicado solo con evidencia (ADR).
- **Capa de IA en el producto.** Si el proyecto tiene features de IA: SDK oficial del proveedor (Anthropic por defecto) y decisión por proyecto vía ADR; el stack default no la presume. pgvector: ver [05-datos.md](05-datos.md).
