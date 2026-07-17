---
doc: onboarding
version: 1.6
fecha: 2026-07-16
estado: vigente
tipo: capa-durable
---

# 13 — Onboarding: cómo se trabaja aquí (tutorial)

Tutorial **de humano a humano** para un dev que llega a un proyecto de la fundación. El agente
no necesita cargar este doc (su guía es el CLAUDE.md del proyecto + la tabla de carga del
[00-INDICE.md](00-INDICE.md)); este documento es para TI. No repite las reglas — te enseña el
flujo y te dice dónde está cada regla cuando la necesites.

## 1. Qué te acaban de dar

Trabajarás con **Claude Code como fuerza principal de implementación**, sobre dos piezas:

- **Esta suite** (`docs/foundation/`): las decisiones de stack, arquitectura y proceso, ya
  tomadas y justificadas. No se rediscuten por proyecto; las desviaciones se registran como ADR.
- **El plugin `agent-foundation`**: skills (los comandos `/new-spec`, `/close-spec`, etc.),
  guardias automáticos (hooks) y un agente revisor. Se instala una vez y gobierna al agente.

Idea central: el humano decide QUÉ y aprueba CÓMO; el agente implementa; los guardias y el
feedback loop (`pnpm check && pnpm test`) verifican. Sin verde no hay done.

## 2. Setup (10 minutos)

Requisitos: Node LTS, Docker, Claude Code. pnpm se instala explícito — `npm install -g pnpm@<versión>`
con la versión que fija el campo `packageManager` del repo (sin corepack; Node anunció su salida
de la distribución por defecto — [01-stack.md](01-stack.md)).

```bash
# 1. Harness (una vez por máquina)
#    Dentro de Claude Code:
/plugin marketplace add cgmndev/agent-foundation
/plugin install agent-foundation@agent-foundation

# 2. Proyecto
git clone <repo-del-proyecto> && cd <proyecto>
npm install -g pnpm@<versión-de-packageManager> && pnpm install
docker compose up -d          # Postgres local
pnpm db:migrate && pnpm db:seed
pnpm dev                      # api + web en watch

# 3. El feedback loop (tu comando más usado)
pnpm check && pnpm test
```

**Prueba de que el harness vive:** abre Claude Code en el proyecto y pídele leer algo de
`specs/archive/`. Debe negarse (archive-guard). Si no se niega, el plugin no está activo.

## 3. La primera pregunta de todo trabajo: ¿qué artefacto le toca?

Antes de escribir una línea, clasifica el trabajo (umbrales completos: [11-sistema-specs.md](11-sistema-specs.md), Decisión 6):

| Trabajo | Artefacto |
|---|---|
| Cambio < ~1h, ámbito claro | Ninguno: prompt directo al agente |
| Feature de 1h–1 día | `tasks.md` solo, o un issue bien escrito |
| Feature > 1 día, >3 módulos, o requisitos ambiguos | Spec completa (el tutorial de abajo) |
| Bug simple | Fix + test de regresión (`test("BUG-142: ...")`) |
| Bug complejo | Solo `plan.md` (hipótesis → diagnóstico → fix) |
| Refactor | `plan.md` + `tasks.md` con la invariante declarada |
| Migración de datos/infra | Spec completa, siempre |

## 4. Tutorial: una feature de punta a punta

Ejemplo: el cliente pide exportar reportes a PDF.

**Paso 1 — `/new-spec export-pdf`.** El agente crea `specs/active/2026-07-export-pdf/spec.md`
y te entrevista sección por sección (contexto → objetivo → alcance → acceptance criteria →
restricciones). Tu rol: responder con sustancia y **no dejarle inventar**. La spec es lenguaje
de negocio puro — si te descubres hablando de endpoints o tablas, eso va al plan, no aquí. Los
ACs quedan con ID estable (`AC-01`, `AC-02`…): cada uno será un test con ese ID en el nombre.

**Paso 2 — Aprobación.** Si hay cliente, la spec se revisa con él (para eso está en su idioma).
Queda en `draft` hasta que no haya preguntas abiertas.

**Paso 3 — `/activate-spec export-pdf`.** Verifica que no queden preguntas abiertas, pasa la
spec a `active` y stampea su hash (la cadena spec→plan→tasks que luego vigila el drift-check).
Después ofrece generar `plan.md`: **este es el review humano más valioso de todo el ciclo** —
lee los trade-offs con calma, cuestiona la superficie de cambio declarada, y solo entonces da el
OK. Con el plan aprobado se generan las `tasks.md` (vertical slices: cada task cruza DB→API→UI y
lleva sus tests de AC incluidos, nunca una fase final de "testing").

**Paso 4 — Implementación.** Una sesión limpia del agente por task (contexto pequeño = agente
bueno). El agente marca los checkboxes al completar cada task y cierra cada una con
`pnpm check && pnpm test` en verde. Si el cliente cambia algo a mitad de camino: **no edites la
spec a mano** — `/change-spec export-pdf` aplica el protocolo (los hashes delatan las ediciones
silenciosas).

**Paso 5 — `/review-fresh export-pdf`.** Un agente revisor con contexto limpio revisa el diff
contra la spec y las reglas (la sesión que implementó nunca se auto-revisa). Recibirás hallazgos
por severidad con veredicto; los fixes se re-revisan.

**Paso 6 — `/close-spec export-pdf`.** Gates automáticos: suite verde + cada AC con su test
(verificación mecánica por grep) + cadena de hashes limpia. Luego la *extracción de órganos*:
¿alguna decisión merece ADR?, ¿cambió el dominio o la arquitectura? (se proponen como diffs).
Al final, la carpeta completa se archiva en `specs/archive/AAAA-MM/` y deja de existir como
contexto. *La spec se tira, pero antes se le extraen los órganos.*

## 5. Los guardias: qué significa cada aviso y cómo reaccionar

Los verás actuar sobre el agente (y algunos sobre ti vía lefthook/CI). No son burocracia: cada
uno existe por un accidente que ya ocurrió o que es caro de aprender en producción.

| Aviso | Significa | Reacción correcta |
|---|---|---|
| archive-guard bloquea una lectura | Esa spec está muerta; usarla contamina el contexto | Si de verdad necesitas historia, pídela explícitamente tú |
| block-secrets bloquea write/commit | Algo parece secreto o es un `.env` | Los secretos van en env vars/secret manager; los `.env` los editas tú, no el agente |
| guard-deps pide aprobación | El agente quiere añadir una dependencia | Apruébala solo si de verdad la quieres en el proyecto (04 §Dependencias) |
| guard-migrations bloquea | `drizzle-kit push` o migración a host remoto | Flujo correcto: `pnpm db:generate` → revisar el SQL → `pnpm db:migrate` local; a remoto despliega el pipeline |
| protect-main pide confirmación | Commit/push estando en `main` | Solo legítimo en bootstrap; el resto va por rama corta + PR |
| drift-check pide confirmación | Alguna spec activa tiene la cadena de hashes desfasada | Si el cambio es de ESA spec: para y `/change-spec`. Si es trabajo ajeno: continúa y arregla el drift aparte |
| verify-done bloquea el cierre de sesión | Hay TS modificado sin pasar el feedback loop | `pnpm check && pnpm test` y deja verde |
| session-brief (al abrir sesión) | No es un error: es tu brújula | Te dice qué specs están activas, tasks pendientes y si hay drift |

## 6. Errores típicos de la primera semana

- Escribir decisiones técnicas en la spec (van en el plan; la spec la lee el cliente).
- Editar una spec `active` a mano "porque es un cambio chico" — usa `/change-spec`; el rastro
  version+changelog es también tu protección contractual.
- Tests que verifican mocks internos en vez de comportamiento (aquí se testea el módulo contra
  Postgres real; [06-testing.md](06-testing.md)).
- Escribir URLs a mano en el frontend — las rutas son builders en `packages/shared`
  ([01-stack.md](01-stack.md) §Cliente API).
- `npm install` / `bun` por costumbre: aquí todo es `pnpm` (y `pnpm add` te pedirá aprobación).
- Editar `docs/architecture.md` o `docs/domain.md` directo — se proponen como diff o vía
  `/close-spec`.
- Cerrar una task "casi verde". No existe casi verde.

## 7. Dónde leer más (cuando surja la duda)

| Duda | Doc |
|---|---|
| ¿Qué librería uso para X? / ¿por qué este stack? | [01-stack.md](01-stack.md) |
| ¿Dónde va este código? / módulo nuevo | [02-arquitectura.md](02-arquitectura.md) + [03-estructura-repo.md](03-estructura-repo.md) |
| Estilo, errores, idioma, git | [04-convenciones-codigo.md](04-convenciones-codigo.md) |
| Schema, queries, migraciones | [05-datos.md](05-datos.md) |
| Tests | [06-testing.md](06-testing.md) |
| Auth, secrets, validación | [07-seguridad-config.md](07-seguridad-config.md) |
| Pipeline, deploy | [08-devops.md](08-devops.md) |
| El sistema de specs a fondo | [11-sistema-specs.md](11-sistema-specs.md) + [12-guia-specs.md](12-guia-specs.md) |

Y siempre: el `CLAUDE.md` del proyecto es el resumen operativo que el agente sigue — léelo tú
también; es el contrato compartido entre humanos y agentes.
