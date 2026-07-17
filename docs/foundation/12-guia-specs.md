---
doc: guia-specs
version: 1.6
fecha: 2026-07-16
estado: vigente
tipo: capa-durable
---

# 12 — Guía Operativa de Especificaciones

Manual de ejecución del sistema definido en [11-sistema-specs.md](11-sistema-specs.md). Todo lo necesario para operar specs sin decisiones pendientes. Plantillas en [plantillas/](plantillas/).

## §1. Estructura de directorios canónica

```
proyecto/
├── CLAUDE.md                          # Delgado (plantillas/plantilla-claude.md)
├── specs/
│   ├── active/
│   │   └── 2026-07-nombre-feature/    # Una carpeta por feature
│   │       ├── spec.md
│   │       ├── plan.md
│   │       └── tasks.md
│   └── archive/
│       └── 2026-07/                   # Mes de CIERRE
│           └── 2026-06-otra-feature/  # Carpeta completa movida al cerrar
├── docs/
│   ├── foundation/                     # Esta suite (snapshot; incluye plantillas/)
│   ├── architecture.md                # Vivo. Único. < 500 líneas
│   ├── domain.md                      # Vivo. Único. < 500 líneas
│   └── decisions/
│       └── 0001-....md                # ADRs inmutables, numeración secuencial
└── apps/ · packages/ · infra/         # Layout completo: 03-estructura-repo.md
```

Reglas:
- La carpeta de feature se nombra `AAAA-MM-slug-kebab-case`. La fecha es la de creación de la spec, no la de cierre.
- Los tres archivos dentro se llaman siempre igual (`spec.md`, `plan.md`, `tasks.md`); la identidad la da la carpeta. Esto hace los skills y hooks triviales de implementar.
- Al archivar se mueve la **carpeta completa** a `archive/AAAA-MM/` (mes de cierre). Nunca archivos sueltos.
- Si el trabajo no requiere spec (Decisión 6), la carpeta puede contener solo `plan.md` y/o `tasks.md`. La convención de nombres no cambia.

## §2. Frontmatter y hashing

Cada artefacto lleva frontmatter (definido en cada plantilla). Los campos de encadenado son:

- `spec.md` → `source_hash`: SHA-256 del propio archivo, calculado al pasar a `active` y recalculado en cada bump de versión.
- `plan.md` → `spec_hash`: copia del `source_hash` de la spec contra la que se escribió.
- `tasks.md` → `plan_hash`: SHA-256 del plan contra el que se generó.

**Detección de staleness (drift-check):** si `plan.spec_hash ≠ spec.source_hash` → el plan está desfasado y no es base válida para implementar ESA feature: se regenera/restampa antes de continuar con ella (el hook lo señala; ver §8). Ídem para tasks vs plan. Cálculo del hash:

```bash
# El hash se calcula sobre el contenido SIN el frontmatter, para evitar
# el problema circular (el hash está dentro del archivo):
sed '1{/^---$/!q;};1,/^---$/d' spec.md | sha256sum | cut -d' ' -f1
```

Los hashes los calculan y escriben los skills (`/activate-spec`, `/change-spec`); ni humano ni agente los computan a mano. Implementación canónica: `scripts/spec-hash.mjs` del plugin `agent-foundation` (el `sed` de arriba documenta la semántica).

**Versionado del formato:** los tres artefactos llevan `format: 1` en el frontmatter. Los skills verifican el campo antes de operar: ante un `format` mayor del que conocen (proyecto más nuevo que el plugin instalado) o un artefacto sin el campo (pre-1), se detienen y lo dicen — nunca migran ni operan en silencio. Es la costura del corte plugin (lógica centralizada) ↔ snapshot (plantillas por proyecto).

## §3. Trazabilidad Acceptance Criteria → Tests

Convención de tres partes:

1. **En la spec:** cada criterio tiene ID estable `AC-NN` (dos o más dígitos) en la tabla de acceptance criteria. Los IDs nunca se reutilizan ni renumeran; si un AC se elimina en un bump de versión, su número muere con él.
2. **En los tests** (Vitest, `pnpm test`): el ID aparece literal en el nombre del test o del describe block:

```typescript
describe("AC-01: el usuario puede exportar el reporte en PDF", () => {
  test("genera PDF con los campos obligatorios", () => { ... });
  test("rechaza exportación sin permisos", () => { ... });
});

// O en tests sueltos:
test("AC-03: la sesión expira a los 30 min de inactividad", () => { ... });
```

3. **Verificación mecánica** (la ejecuta `/close-spec` vía `scripts/check-acs.mjs` del plugin; el bloque siguiente documenta la semántica):

```bash
# IDs de la spec:
grep -oE 'AC-[0-9]{2,}' specs/active/$FEATURE/spec.md | sort -u > /tmp/acs_spec
# IDs presentes en tests (monorepo completo):
grep -rhoE 'AC-[0-9]{2,}' --include='*.test.ts' --include='*.test.tsx' apps packages | sort -u > /tmp/acs_tests
# ACs sin test = bloqueo del cierre:
comm -23 /tmp/acs_spec /tmp/acs_tests
```

ACs de verificación manual (raros, ej. "el cliente valida visualmente el diseño") se marcan `Verificación: manual` en la tabla de la spec y quedan exentos del grep, pero `/close-spec` exige confirmación explícita de que se validaron.

## §4. Workflow completo de una feature

| Paso | Quién | Qué ocurre |
|---|---|---|
| 1. Origen | Tú + cliente | La necesidad nace (reunión, nota en Obsidian, mensaje). Si madura, se destila del vault al repo |
| 2. `/new-spec` | Tú + agente | El skill crea la carpeta y el `spec.md` en `draft` desde plantilla. El agente entrevista (grilling): contexto, objetivo, alcance, ACs. Tú editas y cierras preguntas abiertas |
| 3. Aprobación (gate por modo) | Según ADR 0001 | **Consultoría:** la spec en lenguaje de negocio se revisa con el aprobador nombrado; aprobación escrita por el canal declarado. **Producto propio:** separación temporal — sesión distinta, mínimo una noche, y las 3 preguntas de la Decisión 9 respondidas por escrito en la spec. Solo entonces: `status: active`, se calcula `source_hash` |
| 4. Plan | Agente + tú | El agente genera `plan.md` desde la spec + `docs/architecture.md` + ADRs. Tú revisas los trade-offs — este es el review de mayor valor de todo el ciclo |
| 5. Tasks | Agente | Genera `tasks.md` desde el plan. Revisión rápida de orden y granularidad |
| 6. Implementación | Agente(s) | Ejecuta tasks marcando checkboxes — una sesión limpia por task/fase, mecanizada con `/implement-task` (§7). Los tests de ACs se escriben ANTES o JUNTO a cada task que los satisface, nunca al final |
| 7. Verificación | Tú | Suite completa verde + revisión del diff. El drift-check debe estar limpio |
| 8. `/close-spec` | Skill + tú | Ritual de cierre (§7). Extracción de órganos + archivo |

**Presupuesto de tiempo humano de referencia** (feature mediana, 2–4 días de implementación): pasos 2–3 ≈ 1–2 h; paso 4 ≈ 30–45 min de review; paso 8 ≈ 10–15 min. Si consistentemente gastas más, la feature era más grande de lo estimado o las plantillas necesitan ajuste.

## §5. Protocolo de cambio mid-feature (operativa)

Implementación del árbol de la Decisión 7. Ante cualquier petición de cambio con spec `active`:

```
¿El cambio altera algún AC?
├─ NO → editar plan.md/tasks.md, recalcular hashes. FIN.
└─ SÍ → ¿Afecta ≤ 1/3 de los ACs Y no invalida trabajo implementado?
    ├─ SÍ → /change-spec:
    │        1. Editar spec.md (ACs nuevos con IDs nuevos; los eliminados
    │           se tachan, no se borran: ~~AC-04: ...~~ [eliminado v1.1])
    │        2. Bump version + entrada en ## Changelog de la spec
    │        3. Recalcular source_hash
    │        4. Re-aprobar con cliente si participó en la v anterior
    │        5. Regenerar secciones afectadas de plan/tasks
    └─ NO → Cerrar como superseded:
             1. /close-spec parcial (extraer lo implementado que sirve)
             2. Nueva spec con supersedes: apuntando a la anterior
             3. La nueva spec hereda los ACs vigentes que sobreviven
                (mismos IDs, para no romper trazabilidad de tests ya escritos)
```

La regla de "tachar, no borrar" ACs mantiene la spec legible como historia dentro de su propia vida activa, sin caer en mantener specs cerradas.

## §6. Trabajo no-feature (referencia rápida)

| Tipo | Artefactos | Nota operativa |
|---|---|---|
| Bug simple | Ninguno + test de regresión | El test lleva ID del issue: `test("BUG-142: ...")` |
| Bug complejo | Solo `plan.md` | Secciones: síntoma, hipótesis, diagnóstico, fix, verificación |
| Refactor | `plan.md` + `tasks.md` | El plan declara la invariante de comportamiento y la suite que la protege |
| Migración | Spec completa | ACs = verificaciones post-migración + criterio de rollback |
| Spike | Nada durante; spec a posteriori si se productiviza | La spec retroactiva documenta lo construido de verdad, no lo imaginado |

## §7. Behavior specs de los skills

Implementados como skills del plugin `agent-foundation` (`skills/<nombre>/SKILL.md` en el repo de la fundación); este apartado es su contrato de comportamiento. Las plantillas se leen de `docs/foundation/plantillas/` del proyecto (fallback: las bundled en el plugin).

### `/new-spec <slug>`
1. Validar que no existe `specs/active/*-<slug>`.
2. Crear carpeta `specs/active/AAAA-MM-<slug>/` con `spec.md` desde plantilla (`status: draft`, fecha, autor).
3. Entrevistar al usuario sección por sección (contexto → objetivo → alcance → ACs → restricciones). **Reglas del grilling:** una pregunta a la vez, explicando en el prompt por qué se pregunta; **facts vs decisions** — los hechos se descubren explorando el código/repo (no se preguntan), las decisiones solo las toma el usuario (sí se preguntan). No inventar contenido.
4. **Confirmation gate:** antes de volcar contenido a los artefactos, resumir el entendimiento (objetivo, alcance, ACs) y esperar confirmación explícita del usuario. No se generan artefactos ni se implementa sin entendimiento compartido confirmado.
5. Al terminar, listar las preguntas abiertas restantes y recordar que la spec no puede pasar a `active` con preguntas abiertas — y, en modo producto propio, que la activación es en OTRA sesión (Decisión 9).
6. NO crear plan.md ni tasks.md (eso ocurre tras la aprobación).

### `/activate-spec <slug>` (o paso manual)
1. Verificar sección "Preguntas abiertas" vacía.
2. **Verificar el gate del modo** (ADR 0001): consultoría → confirmación de que existe aprobación escrita del aprobador nombrado; producto propio → separación temporal (la spec no se creó en esta misma sesión/día) y las 3 preguntas de la Decisión 9 respondidas por escrito en la spec. Si falta algo, parar y decirlo.
3. `status: active`, calcular y escribir `source_hash`.
4. Ofrecer generar `plan.md` (requiere leer `docs/architecture.md` + ADRs relevantes antes de proponer enfoque).

### `/implement-task <slug> [id-de-task]`

*(EN OBSERVACIÓN durante la validación: el checkpoint C1–C6 decide si se consolida, crece o se elimina.)*

1. Verificar `format` compatible, `status: active` y cadena de hashes limpia (`spec-hash.mjs check`); con drift, parar (§5).
2. Cargar el **contexto justo**: `plan.md` completo + tabla de ACs de la spec + la task objetivo (la primera sin marcar si no se indicó) + docs de fundación según la tabla del [00-INDICE.md](00-INDICE.md). Nunca la suite completa.
3. Implementar el vertical slice con los tests de sus `AC-NN` en la misma task; respetar la superficie declarada del plan (salirse = parar y decirlo, no una excepción silenciosa).
4. `pnpm check && pnpm test` en verde → marcar checkbox + notas de ejecución → ofrecer commit convencional.
5. Informar el presupuesto de contexto restante: siguiente task solo si cabe con holgura en la smart zone; si no, clear y sesión limpia. Última task → `/review-fresh` y `/close-spec`.

### `/change-spec <slug>`
1. Ejecutar el árbol de §5 preguntando al usuario qué ACs afecta el cambio.
2. Aplicar la rama correspondiente (edición con bump, o cierre + nueva spec).
3. Nunca editar sin dejar changelog + version + hash nuevos.

### `/close-spec <slug>`
1. Verificar suite de tests verde.
2. Ejecutar verificación de trazabilidad (§3). ACs sin test → BLOQUEO (listar cuáles).
3. Ritual de extracción de órganos (preguntas al usuario, con propuesta del agente):
   - "¿Alguna decisión de plan.md merece ADR?" → si sí, generar borrador desde plantilla.
   - "¿Cambió algo del dominio/reglas de negocio?" → si sí, proponer diff sobre `docs/domain.md`.
   - "¿Cambió la arquitectura?" → si sí, proponer diff sobre `docs/architecture.md`.
4. `status: implemented` (o `superseded` en cierre parcial), mover carpeta a `specs/archive/AAAA-MM/`.
5. Reportar resumen: ACs verificados, órganos extraídos, ubicación final.

## §8. Hooks de guardia

**archive-guard** — impedir que specs muertas contaminen contexto. PreToolUse sobre Read/Grep/Glob:

```bash
# Recibe la ruta objetivo de la herramienta:
if [[ "$path" == *"/specs/archive/"* ]]; then
  echo "BLOCK: spec archivada — no es contexto válido." >&2
  echo "Si necesitas historia, pídelo explícitamente al usuario." >&2
  exit 2   # exit 2 = bloquear la acción en hooks de Claude Code
fi
```

Notas: cubre la lectura *espontánea* del agente (Read/Grep/Glob); `cat` vía Bash lo bypasea y es aceptable — el hook protege contra contaminación accidental de contexto, no es adversarial (guardrails como trust infrastructure). Si tú pides revisar una spec histórica, se lee y se comunica.

**drift-check** — PreToolUse sobre Edit/Write en `apps/` y `packages/`: si alguna feature activa tiene `plan.spec_hash ≠ spec.source_hash` (o `tasks.plan_hash ≠ hash(plan)`), pide confirmación (**ask**) señalando la spec desfasada. Si el cambio pertenece a esa spec: detenerse y regenerar (`/change-spec`); si es trabajo ajeno (hotfix, cambio sin spec de los umbrales de la Decisión 6, otra spec sana): continuar y arreglar el drift aparte. Deny se descartó a propósito: sin ownership verificable del path editado, bloquearía trabajo ajeno y entrenaría el hábito de bypass. Escalación futura (solo con evidencia de fricción real): scoping por la "Superficie de cambio" declarada del plan.

Implementación: `scripts/guards/archive-guard.mjs` y `scripts/guards/drift-check.mjs` del plugin, despachados por `scripts/hooks/pre-tool-use.mjs`. Inventario completo de hooks del proyecto (incluye los de stack): [09-agentes.md](09-agentes.md).

## §9. CLAUDE.md

Plantilla canónica única: [plantillas/plantilla-claude.md](plantillas/plantilla-claude.md) — fusiona las reglas de stack y de specs; no existe otra versión. Presupuesto: <~150 líneas rellenada; si crece, algo que debería vivir en `docs/` se está colando.

## §10. Arranque de proyecto

El checklist único de día cero vive en [10-checklist-dia-cero.md](10-checklist-dia-cero.md): su Fase 0 instancia esta estructura (docs vivos, `decisions/`, `specs/`) y su Fase 2 instala skills y hooks.
