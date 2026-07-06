---
name: new-feature
description: Scaffolding de una feature frontend (apps/web/src/features/<n> con index, components y hooks de TanStack Query). Usar al empezar una feature de UI.
argument-hint: <nombre-kebab-case>
---

# /new-feature — feature frontend

Filosofía y reglas: `docs/foundation/02-arquitectura.md` §Frontend. Requiere `apps/web` scaffolded.

## Pasos

1. Valida nombre kebab-case y que no exista `apps/web/src/features/<n>/`.
2. Crea:

```
apps/web/src/features/<n>/
├── index.ts               # Exporta SOLO lo que las rutas consumen
├── components/<n>-view.tsx
└── hooks/use-<n>.ts       # useQuery/useMutation vía el cliente API tipado (lib/api) tipado
```

3. Stubs de referencia:

```ts
// index.ts
export { <N>View } from './components/<n>-view';
```

```tsx
// components/<n>-view.tsx — Tailwind en el markup; base desde components/ui (shadcn)
export function <N>View() {
  return <section className="p-4">{/* TODO */}</section>;
}
```

```ts
// hooks/use-<n>.ts
import { useQuery } from '@tanstack/react-query';

// Server state SOLO aquí (TanStack Query). Claves de query por dominio.
```

4. Reglas duras:
   - **NO crees `store.ts`** por defecto: Zustand solo si aparece estado de cliente genuino (UI, wizard) — y nunca datos de servidor.
   - Una feature no importa internals de otra feature: solo vía su `index.ts`.
   - Formularios: react-hook-form + resolver Zod con el schema de `packages/shared` (01-stack §Formularios).
5. Ruta: las rutas (`src/routes/`) son delgadas — componen la feature vía su `index.ts`; el loader hace prefetch vía Query.
6. Cierre: `pnpm check` en verde.
