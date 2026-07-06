---
name: new-spec
description: Crear una spec nueva de feature (specs/active/AAAA-MM-<slug>/spec.md) desde la plantilla oficial, entrevistando al usuario sección por sección. Usar cuando se acuerde especificar una feature o el usuario pida una spec nueva.
argument-hint: <slug-kebab-case>
---

# /new-spec — crear una spec

Contrato de comportamiento: `docs/foundation/12-guia-specs.md` §7. Antes de empezar, valida contra los umbrales de la Decisión 6 (`docs/foundation/11-sistema-specs.md`): si el trabajo no amerita spec (cambio <1h, bug simple, spike), dilo y propone la alternativa correcta (prompt directo, issue + test de regresión, o solo plan/tasks).

## Pasos

1. **Slug:** usa `$ARGUMENTS`; si falta, pídelo. Valida kebab-case corto y descriptivo.
2. **Unicidad:** verifica que no exista `specs/active/*-<slug>` ni aparezca en `specs/archive/**` (los slugs no se reutilizan). Si existe, para y muéstralo.
3. **Carpeta y plantilla:** crea `specs/active/AAAA-MM-<slug>/` (AAAA-MM = mes actual) y copia la plantilla de spec:
   - Primero `docs/foundation/plantillas/plantilla-spec.md` (snapshot del proyecto);
   - si el proyecto no la tiene: `"${CLAUDE_PLUGIN_ROOT:-.}/docs/foundation/plantillas/plantilla-spec.md"`.
4. **Frontmatter:** `feature: <slug>`, `created`/`updated` = hoy, `author` = `git config user.name`, `status: draft`. `source_hash` queda `null` — lo stampea `/activate-spec`, nunca tú.
5. **Entrevista sección por sección**, en este orden: contexto/problema → objetivo → alcance (incluye y NO incluye) → acceptance criteria → restricciones/supuestos. Reglas:
   - No inventes contenido: pregunta. Propón redacción solo DESPUÉS de la respuesta del usuario y muéstrala para ajuste.
   - ACs con ID `AC-NN` estable y verificable, en lenguaje de negocio. `Verificación: manual` solo si de verdad no es testeable (y justifícalo).
   - La spec es el QUÉ/POR QUÉ: si en la conversación aparecen decisiones técnicas, anótalas aparte y di que pertenecen al plan.
6. **Cierre:** lista las preguntas abiertas restantes en la sección 6 y recuerda: la spec **no puede pasar a `active` con preguntas abiertas** (`/activate-spec` lo verifica).
7. **NO crees `plan.md` ni `tasks.md`** — eso ocurre tras la aprobación, con `/activate-spec`.
