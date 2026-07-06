---
name: new-module
description: Scaffolding de un módulo backend (vertical slice routes→service→repo con test boundary) en apps/api/src/modules/. Usar al empezar un módulo o dominio nuevo del API.
argument-hint: <nombre-kebab-case>
---

# /new-module — módulo backend

Estructura y reglas: `docs/foundation/02-arquitectura.md` (léelo si no lo tienes fresco). Requiere el monorepo scaffolded (`apps/api` con `core/`); si no existe, dilo y apunta a la Fase 1 de `docs/foundation/10-checklist-dia-cero.md`.

## Pasos

1. Valida nombre kebab-case y que no exista `apps/api/src/modules/<n>/`.
2. Crea la estructura (identificadores en inglés; `<N>` = camelCase del nombre):

```
apps/api/src/modules/<n>/
├── index.ts        # ÚNICA interfaz pública: exports explícitos, nombre por nombre
├── <n>.routes.ts   # Hono + zValidator en cada endpoint; habla SOLO con el service
├── <n>.service.ts  # Lógica de negocio; funciones puras donde se pueda; lanza AppError
├── <n>.repo.ts     # ÚNICO lugar con queries Drizzle; firma (db: Database, ...)
├── <n>.types.ts    # Tipos internos del módulo
└── <n>.test.ts     # Test boundary del módulo (Postgres real vía Testcontainers)
```

3. Stubs de referencia (adapta imports al wiring real de `core/` del proyecto):

```ts
// index.ts — exporta SOLO lo que otros consumen, nombre por nombre
export { <n>Routes } from './<n>.routes';
```

```ts
// <n>.routes.ts
import { Hono } from 'hono';

export const <n>Routes = new Hono().get('/', async (c) => {
  // TODO: validar con zValidator (schema de packages/shared) y delegar al service
  return c.json({ data: [], nextCursor: null });
});
```

```ts
// <n>.service.ts
import type { Database } from '../../core/db';

// Business logic lives here; effects (db, clock) enter as parameters.
```

```ts
// <n>.repo.ts
import type { Database } from '../../core/db';

// Único lugar del módulo con queries Drizzle (05-datos). Funciones de dominio,
// no CRUD genérico: findActiveX, no findAll.
```

```ts
// <n>.test.ts — boundary test contra Postgres real (06-testing)
import { describe, expect, it } from 'vitest';

describe('<n>', () => {
  it('placeholder: reemplazar por el primer comportamiento real (AC-NN del spec)', () => {
    expect(true).toBe(true);
  });
});
```

4. Monta el módulo en `apps/api/src/app.ts`: `app.route('/<n>', <n>Routes)` (ruta plural kebab-case, contrato en 02 §Contrato API).
5. Reglas duras a respetar: schemas de contrato en `packages/shared` (no en el módulo); sin `any`; imports de otros módulos SOLO vía su `index.ts`; escrituras multi-tabla = transacción.
6. Cierre: `pnpm check && pnpm test` en verde antes de dar el módulo por creado.
