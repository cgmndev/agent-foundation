---
name: change-spec
description: Aplicar un cambio a una feature con spec activa siguiendo el protocolo mid-feature (editar plan/tasks, bump de spec con changelog, o supersede). Usar cuando el usuario o cliente cambia requisitos con trabajo en curso.
argument-hint: <slug>
---

# /change-spec — protocolo de cambio mid-feature

Árbol completo: `docs/foundation/12-guia-specs.md` §5. Regla dura: **una spec `active` nunca se edita silenciosamente** — todo cambio deja version + changelog + hash nuevo.

## Pasos

1. Localiza la feature (`specs/active/*-<slug>`) y lee spec/plan/tasks; verifica `format` compatible (12-guia §2). Pide al usuario describir el cambio.
2. Pregunta explícitamente, repasando la tabla de ACs con él: **¿el cambio altera algún AC?**

**Rama A — NO altera ACs** (detalle de implementación, ajuste menor):
- Edita `plan.md`/`tasks.md` según el cambio. La spec no se toca.
- Restampa: `node "${CLAUDE_PLUGIN_ROOT:-.}/scripts/spec-hash.mjs" stamp specs/active/<carpeta> plan tasks`

**Rama B — altera ≤ 1/3 de los ACs y NO invalida trabajo ya implementado:**
- Edita `spec.md`: ACs nuevos con IDs NUEVOS (nunca reutilizar números); los eliminados se tachan, no se borran: `~~AC-04: ...~~ [eliminado v1.1]`.
- Bump de `version` en frontmatter + entrada en `## Changelog` de la spec (qué cambió y por qué).
- Regenera las secciones afectadas de plan/tasks (solo las afectadas).
- Restampa todo: `spec-hash.mjs stamp specs/active/<carpeta>` (spec → plan → tasks).
- Si el cliente aprobó la versión anterior, recuérdale al usuario que la nueva versión requiere re-aprobación.

**Rama C — invalida el enfoque o la mayoría del trabajo:**
- Cierra la spec actual como superseded: ejecuta `/close-spec <slug>` en modo parcial (extrae lo implementado que sirve).
- Crea la spec nueva con `/new-spec`, con `supersedes:` apuntando a la anterior, y completa `superseded_by:` en la vieja.
- La nueva hereda los ACs vigentes que sobreviven CON SUS MISMOS IDs (no rompas la trazabilidad de tests ya escritos).

3. Cierra con un resumen del rastro dejado: versión, changelog, hashes, y qué queda por re-aprobar.
