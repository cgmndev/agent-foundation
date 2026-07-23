---
doc: datos
version: 1.7
fecha: 2026-07-22
estado: vigente
tipo: capa-durable
capa: pack
---

# 05 — Capa de Datos: PostgreSQL + Drizzle

Convenciones completas de la capa de datos. Este documento neutraliza los errores conocidos de los agentes con Drizzle: se carga en contexto en toda tarea que toque schema o queries.

## Convenciones de schema (packages/db)

- **Dialect:** siempre `pgTable` de `drizzle-orm/pg-core`. El agente jamás importa de `mysql-core`/`sqlite-core` (error frecuente documentado).
- **drizzle.config.ts:** usar `dialect: 'postgresql'` (la key `driver` está obsoleta; el agente tiende a generarla por training data viejo).
- Un archivo por tabla o grupo cohesivo en `packages/db/src/schema/`; export explícito en `index.ts`.
- **Nombres:** tablas snake_case plural (`order_items`); columnas snake_case; en TS, propiedades camelCase mapeadas (Drizzle casing `snake_case` en config para no mapear a mano).

**Columnas estándar en TODA tabla:**

```ts
// Con casing: 'snake_case' en la config, sin nombres de columna a mano:
id: uuid().primaryKey().defaultRandom(),
createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
```

- `timestamp` SIEMPRE `withTimezone: true` (timestamptz). Fechas sin tz son defecto.
- Soft delete solo si el dominio lo exige (`deletedAt` nullable + filtro en repo); no por defecto.
- FKs siempre declaradas con `references()` + política `onDelete` explícita (decidir por relación: `cascade` para hijos dependientes, `restrict` como default seguro).
- Enums de dominio: `pgEnum` cuando los valores son estables; tabla de catálogo cuando el cliente los administra.
- Índices declarados en el schema junto a la tabla (colocation), con comentario del query que sirven.

## Relaciones

- Definir `relations()` de Drizzle para las lecturas con `db.query` (relational queries) — patrón preferido para reads con joins simples.
- Para queries complejas (agregaciones, reporting): query builder (`db.select()...`) en el repo, o `sql` template tipado si el builder oscurece la intención. SQL crudo es aceptable y a veces preferible: es greppable y el agente lo escribe bien.

## Migraciones

- **Flujo único:** editar schema TS → `pnpm db:generate` → revisar el SQL generado (obligatorio, humano) → `pnpm db:migrate`.
- Prohibido `drizzle-kit push` fuera de prototipos locales; todo cambio a entornos compartidos va por migración versionada y commiteada.
- Migraciones son inmutables una vez en `main`: los arreglos son migraciones nuevas.
- Migraciones destructivas (drop, alter con pérdida) requieren: ADR o nota en el spec + patrón expand-and-contract si hay datos en producción (añadir nuevo → backfill → cambiar lecturas → eliminar viejo).
- El agente tiene **deny rule** sobre `db:migrate` en entornos no-locales (harness DEVOPS es quien despliega migraciones).

## Patrones de acceso (repos)

- Toda query vive en `*.repo.ts` del módulo ([02-arquitectura.md](02-arquitectura.md)). El repo expone funciones de dominio (`findActiveOrdersByUser`), no un CRUD genérico.
- Los repos devuelven tipos derivados de Drizzle o proyecciones explícitas; nunca `any`, nunca el row completo "por comodidad" si el caso de uso pide 3 columnas.
- **Transacciones:** en el service, vía `db.transaction(async (tx) => …)`, pasando `tx` a las funciones del repo (que aceptan `db | tx` como primer parámetro con el tipo `Database`). Regla: si una operación de negocio escribe 2+ tablas, es transacción.
- Paginación por cursor (keyset) como default en listados; offset solo para admin/UI internas pequeñas.
- N+1: preferir relational queries o joins; si el agente genera loops de queries, es defecto de review.

## Seeds y datos de desarrollo

- `db:seed` idempotente (upsert por claves naturales), con datos realistas mínimos para levantar la app y correr Playwright smoke.
- Seeds separados de fixtures de test (los tests crean su propio estado; ver [06-testing.md](06-testing.md)).

## Operación (resumen; detalle en 08-devops.md)

- Postgres 16+ gestionado (RDS / OCI). Local: contenedor en `docker-compose.yml` con la misma major version que producción.
- Conexiones: pool del driver con límites explícitos; si el deploy es serverless/muchas instancias, PgBouncer o el pooler gestionado del proveedor.
- Backups automáticos del proveedor + verificación de restore al menos una vez por proyecto antes de go-live.
- Extensiones permitidas por defecto: `pgcrypto`, `pg_trgm` (búsqueda), `pgvector` solo si el proyecto tiene features de IA con embeddings (ADR).

## Jobs (pg-boss) y la base de datos

- pg-boss gestiona sus propias tablas en el schema `pgboss`: quedan fuera de las migraciones Drizzle y no se tocan a mano. Para diagnóstico, solo lectura (`SELECT name, state, COUNT(*) FROM pgboss.job GROUP BY 1, 2`).
- El pool se comparte entre API, worker y pg-boss: límites explícitos siempre (punto de partida: app ~10, pg-boss ~5, margen para migraciones/admin).
- Encolar + escribir: regla de transaccionalidad y compensación en [01-stack.md](01-stack.md) (sección pg-boss).

## Reglas anti-error para el agente (resumen cargable)

1. Import SIEMPRE de `drizzle-orm/pg-core`; config con `dialect: 'postgresql'`.
2. `timestamptz` siempre; UUID PK por defecto.
3. Queries solo en `*.repo.ts`; escrituras multi-tabla = transacción.
4. Nunca `push` a entornos compartidos; nunca editar migraciones ya commiteadas.
5. Tipos derivados con `$inferSelect`/`$inferInsert`; no redeclarar entidades a mano.
6. Nuevo índice = comentario con el query que lo justifica.
