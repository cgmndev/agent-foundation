---
name: review-fresh
description: Review de una implementación en contexto fresco delegando en el agente revisor (tests vs requisitos, boundaries, proyecciones, drift). Usar al terminar una feature, antes de un PR, o cuando el usuario pida review.
argument-hint: [slug-de-spec | rango-git]
---

# /review-fresh — review en contexto limpio

La fundación exige que el review ocurra en contexto fresco, **nunca en la sesión que implementó** (`docs/foundation/06-testing.md` §loop, `04` §git). Este skill lo mecaniza delegando en el subagente `revisor` — contexto limpio garantizado.

## Pasos

1. **Alcance:** identifica la spec activa (`specs/active/*-<slug>` si se dio slug) y el diff a revisar: `git diff main...HEAD` (o staged/working tree si no hay ramas). Si no hay ni spec ni diff, pregunta qué revisar.
2. **Lanza el agente `revisor`** con un prompt que contenga SOLO datos, no opiniones:
   - Ruta de la spec (para los ACs) y del plan (para la superficie declarada), si existen.
   - El comando de diff exacto o la lista de archivos tocados.
   - NO le pases tus conclusiones ni resúmenes de lo implementado: debe formarse juicio propio desde el código.
3. **Presenta los hallazgos del revisor sin suavizarlos**, ordenados por severidad, con `file:line` y fix propuesto. El veredicto del revisor (aprobado/cambios/rechazado) se reporta tal cual.
4. Si el usuario acepta los fixes: impleméntalos y **vuelve al paso 2** (revisor de nuevo, fresco — el que arregló no se auto-aprueba).
