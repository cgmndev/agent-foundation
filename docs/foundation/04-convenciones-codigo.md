---
doc: convenciones-codigo
version: 1.7
fecha: 2026-07-22
estado: vigente
tipo: capa-durable
capa: pack
---

# 04 — Convenciones de Código

Reglas de escritura de código. Optimizadas para: veredicto binario del tooling, local reasoning del agente, y cero ambigüedad de estilo.

## Idioma

- **Inglés:** identificadores, comentarios en código, mensajes de commit, nombres de rama, mensajes de log. Razón: coherencia con el ecosistema y el training data; evita mezclas dentro de un archivo.
- **Español:** specs, `docs/domain.md`, documentación de negocio y todo artefacto que lee el cliente. El glosario de `domain.md` mapea término de negocio (ES) ↔ nombre en código (EN) y es la fuente de verdad del naming.
- **Tests:** descripciones en español cuando citan comportamiento de negocio (son la spec ejecutable y llevan el `AC-NN`); el código interno del test, en inglés.
- **Textos de UI:** en el idioma del cliente, resueltos en el frontend a partir de los `code` estables del contrato de errores (el backend no emite copy de UX).

## TypeScript

**tsconfig.base.json — no negociable:**

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "moduleResolution": "bundler",
    "target": "ES2023",
    "skipLibCheck": true
  }
}
```

**Reglas de uso de tipos:**
- `any` prohibido (regla Biome error). `unknown` + narrowing donde haga falta.
- Derivar, no duplicar: tipos desde Zod (`z.infer`) y desde Drizzle (`$inferSelect`/`$inferInsert`). Un tipo escrito a mano que espeja un schema es defecto.
- **Tipos simples > tipos listos.** Prohibido el type-level programming barroco (conditional types anidados, mapped types recursivos, template literal types complejos): los LLMs no los leen bien y los humanos tampoco. Si un tipo necesita explicación, se reescribe.
- `as` solo en boundaries con justificación en comentario; `as unknown as` prohibido.
- Preferir tipos de retorno explícitos en funciones públicas de módulo (documentan la interfaz y aceleran `tsc`).

## Zod v4 — reglas anti-error

El training data está dominado por Zod v3; estos son los v3-ismos que el agente tiende a generar y que en v4 son defecto:

1. Formatos como función top-level: `z.email()`, `z.uuid()`, `z.url()`, `z.iso.datetime()`. Las formas encadenadas (`z.string().email()`) están deprecadas.
2. Mensajes de error: parámetro unificado `error` (`z.string({ error: '…' })`); `message:` y `errorMap` son v3.
3. `z.record(keySchema, valueSchema)` exige dos argumentos.
4. `.merge()` está deprecado: usar `.extend()` o spread de `.shape`.
5. `z.nativeEnum(X)` está deprecado: `z.enum(X)` acepta enums de TS.
6. `.default()` en v4 devuelve el valor por defecto tal cual ante `undefined` (no lo re-parsea); si se necesita el comportamiento v3, `.prefault()`.

## Manejo de errores

**Decisión: excepciones tipadas con jerarquía propia + captura centralizada en el boundary. Sin librería de Result (neverthrow) en el default.**

Justificación: es el patrón dominante en training data (menos errores del agente), evita la viralidad de Result por todo el call stack, y el boundary único garantiza respuestas HTTP consistentes.

```ts
// core/errors.ts — jerarquía completa y cerrada
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,        // estable, machine-readable: 'ORDER_NOT_FOUND'
    readonly status: number,       // HTTP status
    readonly cause?: unknown,
  ) { super(message); }
}
export class NotFoundError extends AppError { /* status 404 */ }
export class ValidationError extends AppError { /* status 400 */ }
export class ForbiddenError extends AppError { /* status 403 */ }
export class ConflictError extends AppError { /* status 409 */ }
```

**Reglas:**
- Services lanzan `AppError` (o subclase) con `code` estable. Los `code` se listan en `packages/shared` (el frontend los usa para UX).
- Un único error handler Hono (`app.onError`) traduce `AppError → HTTP` y loggea. Errores no-`AppError` = 500 + log de stack completo; nunca se filtra detalle interno al cliente.
- `try/catch` solo donde se puede actuar (retry, fallback, enriquecer contexto). Prohibido el catch-and-rethrow vacío y el `catch (e) { console.log(e) }`.
- Operaciones externas (APIs de terceros) envuelven el error original en `AppError` con `cause` para no perder el stack.
- Frontend: errores de mutación se manejan en el hook de la feature (toast/estado), usando el `code` del contrato; sin `alert()`.

## Lint y formato (Biome)

- Config única en raíz; `biome check --write` en pre-commit, `biome ci` en pipeline.
- Reglas elevadas a error: `noExplicitAny`, `noConsole` (en `apps/`, permitido en scripts), `noUnusedImports`, `useExhaustiveDependencies`.
- El formato no se discute nunca (ni humano ni agente): lo que Biome escribe, queda.

## Funciones y módulos

- Funciones pequeñas con nombre-verbo; parámetros >2 → objeto con tipo nombrado.
- Preferir funciones puras en services; los efectos (DB, HTTP externo, clock, random) entran por parámetro o viven en el repo/adapter local del módulo — esto habilita el testing sin mocks pesados.
- Sin clases salvo: errores, y casos con estado real + ciclo de vida (raro). El default es módulo de funciones.
- Early return sobre anidamiento; máximo 2 niveles de indentación lógica como guía.

## Comentarios y documentación en código

- El código dice *qué*; los comentarios dicen *por qué*. Comentario obligatorio en: workarounds, decisiones no obvias, invariantes ("este orden importa porque…").
- JSDoc solo en la interfaz pública de módulo (`index.ts`) y en `packages/shared`.
- Prohibido el comentario-narración que los agentes tienden a generar (`// ahora iteramos el array`). Regla en CLAUDE.md + limpieza en review.
- `TODO(nombre|spec-id):` con referencia; TODOs anónimos se rechazan en review.

## Git

- **Trunk-based con PRs cortas.** `main` siempre deployable; branches viven <2-3 días.
- **Squash and Merge como política única.** Un PR = un commit en `main`: historial lineal y auditable. El título del PR sigue Conventional Commits (es el mensaje del commit resultante). Branch protection: checks obligatorios, rama al día antes de merge, solo squash habilitado, borrado automático de ramas.
- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`) — habilita changelog automático y da estructura que el agente sigue bien.
- **Pre-commit con lefthook** (`lefthook.yml` en raíz, idéntico entre proyectos): `biome check --write` sobre staged + `tsc --noEmit`. Es enforcement a nivel git: aplica igual a humanos, agentes y CI.
- Un commit = un cambio lógico. El agente commitea al cerrar cada task del spec, no en mega-commits (los commits granulares viven en la rama; el squash los integra como uno solo por PR).
- PR con descripción: qué, por qué, cómo probar, spec/task asociado. Los PR de agente se revisan SIEMPRE en contexto fresco (nunca en la misma sesión que implementó).
- Prohibido `git push --force` a `main` y commits directos a `main` (branch protection + deny rule del harness).

## Dependencias

- Añadir una dependencia es una decisión, no un reflejo: preferir stdlib/plataforma; evaluar mantenimiento, tamaño y representación en training data.
- El agente tiene prohibido añadir dependencias sin aprobación explícita (deny/ask rule del harness sobre edición de `package.json`).
- Versiones pinneadas por lockfile (`pnpm-lock.yaml` commiteado); upgrades en PR dedicada mensual, nunca mezclados con features.
