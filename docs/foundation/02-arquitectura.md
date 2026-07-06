---
doc: arquitectura
version: 1.1
fecha: 2026-07-06
estado: vigente
tipo: capa-durable
---

# 02 — Arquitectura: El Punto Óptimo

Definición del nivel de arquitectura que maximiza mantenibilidad y rendimiento del agente sin caer en ceremonia. Es la respuesta cerrada a "¿cuánta arquitectura es suficiente?".

## Decisión central

**Monolito modular, organizado en vertical slices (módulos por feature/dominio), con multicapas pragmática DENTRO de cada módulo y módulos profundos (interfaces pequeñas, complejidad oculta). Sin hexagonal, sin DI framework, sin capas de indirection genéricas.**

En una frase: *las capas viven dentro del módulo, no el módulo dentro de las capas.*

## Justificación

1. **Los agentes escalan verticalmente, no horizontalmente.** Un módulo autocontenido cabe en la smart zone (<~100k tokens); una feature esparcida por capas globales (`controllers/`, `services/`, `repositories/` transversales) obliga al agente a cargar medio repo para tocar una feature.
2. **Módulos profundos (Ousterhout) son el mayor lever sobre la calidad del output del agente:** interfaz pequeña y explícita, complejidad interna oculta, un solo test boundary que envuelve el módulo.
3. **La hexagonal completa infla el contexto:** puertos, adaptadores, mappers y DTOs duplicados multiplican archivos que el agente debe leer y mantener sincronizados, sin beneficio real cuando hay una sola implementación de cada puerto (el caso del 95% de los proyectos greenfield).
4. **Demasiado simple también falla:** sin límites de módulo, el agente acopla todo con todo y el repo degrada en 3 meses. El punto óptimo tiene límites duros pero pocos.

## Estructura de un módulo (backend)

```
apps/api/src/modules/<modulo>/
├── index.ts          # ÚNICA interfaz pública del módulo (exports explícitos)
├── <modulo>.routes.ts    # Endpoints Hono + validación Zod (boundary HTTP)
├── <modulo>.service.ts   # Lógica de negocio (funciones puras donde sea posible)
├── <modulo>.repo.ts      # Acceso a datos (Drizzle). Único lugar con queries
├── <modulo>.types.ts     # Tipos internos del módulo
└── <modulo>.test.ts      # Test boundary del módulo (ver 06-testing.md)
```

Tres capas internas, con dependencia en un solo sentido: `routes → service → repo`. Nada más. Sin `dto/`, sin `mappers/`, sin `interfaces/` genéricas, sin factory de repositorios.

## Reglas duras (enforcement, no sugerencia)

1. **Un módulo solo importa de otro módulo a través de su `index.ts`.** Imports profundos cross-módulo (`../otro-modulo/otro.repo`) están prohibidos. Enforcement: regla de lint / hook PreToolUse del harness.
2. **`routes` nunca toca `repo` directamente.** El boundary HTTP habla con el service.
3. **Las queries SQL/Drizzle solo existen en archivos `.repo.ts`.** Si el agente escribe un `db.select()` en un service, es defecto.
4. **Los schemas Zod compartidos (contratos API) viven en `packages/shared`**, no en el módulo. El módulo puede tener schemas internos propios.
5. **Comunicación entre módulos:** llamada directa a la función pública del otro módulo (mismo proceso). Sin event bus interno, sin mensajería, hasta que un ADR lo justifique.
6. **Un archivo no supera ~300-400 líneas; un módulo no supera ~10-12 archivos.** Si lo hace, se divide el módulo (señal de que son dos dominios). Estas cifras son guía fuerte, no lint.

## Contrato API (convenciones REST)

La forma del boundary HTTP es parte de la arquitectura: idéntica en todos los proyectos para que ni el agente ni el frontend adivinen.

- **Rutas:** sustantivos en plural kebab-case (`/order-items/:id`), anidación máxima de 1 nivel (`/orders/:id/items`). Acciones no-CRUD: verbo al final (`POST /orders/:id/cancel`) — pragmatismo sobre purismo REST.
- **Respuestas 2xx:** el recurso directo (objeto), o en listados `{ data: T[], nextCursor: string | null }` (paginación keyset, [05-datos.md](05-datos.md)). Sin envelopes adicionales.
- **Errores:** siempre `{ error: { code, message, details? } }`, producido únicamente por el error handler central desde `AppError` ([04-convenciones-codigo.md](04-convenciones-codigo.md)). Los `code` estables viven en `packages/shared`.
- **Status:** 200 lectura/actualización, 201 creación, 204 borrado sin body; el resto lo mapea `AppError.status`.
- **Versionado:** sin prefijo `/v1` por defecto (consumidor único: el frontend del monorepo, desplegado en sincronía). OpenAPI (`@hono/zod-openapi`) + versionado explícito solo cuando aparezcan consumidores externos (ADR).
- **Webhooks/jobs entrantes:** handlers idempotentes por diseño (los reintentos del proveedor son la norma) y verificación de firma antes de parsear.

## Qué NO hacer (anti-patrones con nombre)

| Anti-patrón | Por qué daña al agente |
|---|---|
| Hexagonal/clean con puertos-adaptadores para todo | Indirection que el agente debe seguir en cadena; archivos duplicados (entidad, DTO, mapper) que se desincronizan |
| DI framework (Inversify, tsyringe) | Magia no-greppable; el agente no puede seguir el wiring. Composición manual explícita en `index.ts`/`main.ts` |
| Capas globales por tipo técnico (`services/`, `controllers/` en raíz) | Destruye colocation; cada feature toca 4+ carpetas distantes |
| Repositorio genérico `BaseRepository<T>` | Abstracción prematura; oculta queries reales; los tipos genéricos complejos son ilegibles para LLMs |
| Interfaces con una sola implementación "por si acaso" | Ceremonia pura; se introduce la interfaz cuando llegue la segunda implementación |
| Utils/helpers globales crecientes (`utils.ts` de 800 líneas) | Vertedero acoplado a todo; las utilidades viven en el módulo que las usa hasta que 3+ módulos las necesiten (entonces: `packages/shared`) |
| Barrel files re-exportando todo (`export * from`) | Rompe local reasoning y tree-shaking; el `index.ts` de módulo exporta EXPLÍCITAMENTE, nombre por nombre |

## Frontend: misma filosofía

```
apps/web/src/
├── routes/            # File-based routing (TanStack Router)
├── features/<feature>/
│   ├── index.ts       # Interfaz pública de la feature
│   ├── components/    # Componentes propios de la feature
│   ├── hooks/         # useQuery/useMutation de la feature
│   └── store.ts       # Zustand SOLO si hay estado de cliente real
├── components/ui/     # Design system compartido (botones, inputs...)
└── lib/               # Cliente API (hono/client), config Query
```

- Las rutas son delgadas: componen features, no contienen lógica.
- Server state en Query, client state en Zustand ([01-stack.md](01-stack.md)); esta separación es regla dura.
- Una feature no importa componentes internos de otra feature; solo vía `index.ts`.

## Cuándo escalar la arquitectura (umbrales explícitos)

| Señal | Acción |
|---|---|
| Segunda implementación real de una dependencia (p. ej. segundo proveedor de pagos) | Introducir interfaz/puerto SOLO ahí, en ese módulo |
| Un módulo necesita reaccionar a eventos de otros 3+ módulos | Evaluar event emitter in-process (ADR) |
| Background jobs con volumen real | pg-boss sobre Postgres; colas externas solo con evidencia |
| Dos apps despliegan con cadencias incompatibles | Evaluar extraer servicio (ADR); nunca preventivamente |
| El monorepo supera lo que un agente puede navegar con grep + convenciones | Reforzar docs de módulo (`README.md` por módulo) antes que partir el repo |

## Relación con vertical slices como método de trabajo

La arquitectura habilita el método: cada issue/task se implementa como **tracer bullet** que cruza DB → API → frontend dentro del slice, dejando feedback loop completo (test + typecheck) al cierre de cada issue. El agente nunca implementa "toda la capa de datos" primero. Esto conecta con el sistema de specs ([11-sistema-specs.md](11-sistema-specs.md)): tasks.md se descompone en slices, no en capas.
