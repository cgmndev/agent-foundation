---
name: new-spec
description: Crear una spec nueva de feature (specs/active/AAAA-MM-<slug>/spec.md) desde la plantilla oficial, entrevistando al usuario sección por sección. Usar cuando se acuerde especificar una feature o el usuario pida una spec nueva.
argument-hint: <slug-kebab-case>
---

# /new-spec — crear una spec

Contrato de comportamiento: `docs/foundation/12-guia-specs.md` §7. Antes de empezar, valida contra los umbrales de la Decisión 6 (`docs/foundation/11-sistema-specs.md`): si el trabajo no amerita spec (cambio <1h, bug simple, spike), dilo y propone la alternativa correcta (prompt directo, issue + test de regresión, o solo plan/tasks).

## Pasos

1. **Slug:** usa `$ARGUMENTS`; si falta, pídelo. Valida kebab-case corto y descriptivo.
2. **Unicidad:** verifica que no exista `specs/active/*-<slug>` ni aparezca en `specs/archive/**` (los slugs no se reutilizan). Hazlo vía Bash — `ls specs/active/ specs/archive/*/ 2>/dev/null` — porque archive-guard bloquea Read/Grep/Glob sobre el archivo y este listado puntual es el bypass legítimo documentado (12-guia §8). Si existe, para y muéstralo.
3. **Carpeta y plantilla:** crea `specs/active/AAAA-MM-<slug>/` (AAAA-MM = mes actual) y copia la plantilla de spec:
   - Primero `docs/foundation/plantillas/plantilla-spec.md` (snapshot del proyecto);
   - si el proyecto no la tiene: `"${CLAUDE_PLUGIN_ROOT:-.}/docs/foundation/plantillas/plantilla-spec.md"`.
4. **Frontmatter:** `feature: <slug>`, `created`/`updated` = hoy, `author` = `git config user.name`, `status: draft`. `source_hash` queda `null` — lo stampea `/activate-spec`, nunca tú.
5. **Entrevista sección por sección** (grilling), en este orden: contexto/problema → objetivo → alcance (incluye y NO incluye) → acceptance criteria → restricciones/supuestos. Reglas:
   - **Destilación:** si la discusión ya ocurrió en esta sesión (la idea se exploró antes de invocar el skill), no re-preguntes lo ya respondido — salta a proponer el resumen del confirmation gate (paso 6) y pregunta solo los huecos.
   - **Una pregunta a la vez, explicando por qué la haces** — la justificación en el prompt se respeta más que la instrucción sola.
   - **Facts vs decisions:** los hechos (cómo funciona el código hoy, qué existe en el repo) los descubres TÚ explorando — no se preguntan. Las decisiones (qué se quiere, qué queda fuera, trade-offs de producto) las toma SOLO el usuario — sí se preguntan.
   - No inventes contenido: pregunta. Propón redacción solo DESPUÉS de la respuesta del usuario y muéstrala para ajuste.
   - ACs con ID `AC-NN` estable y verificable, en lenguaje de negocio. **Numeración GLOBAL del proyecto:** antes de proponer IDs calcula el siguiente libre — `grep -rhoE 'AC-[0-9]+' specs/ 2>/dev/null | grep -oE '[0-9]+' | sort -n | tail -1` vía Bash — y numera desde ahí +1 (solo la primera spec del proyecto arranca en AC-01; razón en 12-guia §3). `Verificación: manual` solo si de verdad no es testeable (y justifícalo).
   - La spec es el QUÉ/POR QUÉ: si en la conversación aparecen decisiones técnicas, anótalas aparte y di que pertenecen al plan.
6. **Confirmation gate:** antes de volcar el contenido a la spec, resume el entendimiento (objetivo, alcance, ACs propuestos) en ≤15 líneas y espera confirmación explícita del usuario. Sin entendimiento compartido confirmado no se generan artefactos.
7. **Cierre:** lista las preguntas abiertas restantes en la sección 6 y recuerda: la spec **no puede pasar a `active` con preguntas abiertas** (`/activate-spec` lo verifica). Si el proyecto opera en modo producto-propio (ADR 0001), recuerda también: la activación ocurre en OTRA sesión — separación temporal obligatoria (12-guia §4/§7).
   - **Hechos durables descubiertos:** si al explorar facts encontraste hechos YA vigentes que `docs/architecture.md` o `docs/domain.md` no documentan (hechos, no decisiones nuevas — esas siguen el ciclo normal: plan → ADR al cierre), propón el diff correspondiente ahora, sin esperar al cierre de la spec. Regla de siempre: diff propuesto, el usuario aprueba; nunca edites los docs vivos directo.
8. **NO crees `plan.md` ni `tasks.md`** — eso ocurre tras la aprobación, con `/activate-spec`.
