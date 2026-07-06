---
name: adr
description: Crear un ADR numerado en docs/decisions/ desde la plantilla (decisiones inmutables; los cambios se registran con supersedes, nunca editando). Usar cuando una decisión técnica merezca registro, ante desviaciones de la fundación, o desde /close-spec.
argument-hint: <titulo-corto>
---

# /adr — registrar una decisión

Los ADRs registran **desviaciones de la fundación y decisiones propias del proyecto** — el stack default no se re-documenta (`docs/foundation/11-sistema-specs.md`, Decisión 3).

## Pasos

1. **Número:** máximo existente en `docs/decisions/` + 1, formato `NNNN` (0001, 0002…). Crea `docs/decisions/` si no existe.
2. **Plantilla:** `docs/foundation/plantillas/plantilla-adr.md` (fallback: `"${CLAUDE_PLUGIN_ROOT:-.}/docs/foundation/plantillas/plantilla-adr.md"`).
3. **Frontmatter:** `id`, `title` (la decisión en una frase), `date` hoy, `status: accepted` (o `proposed` si el usuario aún no decide), `origin:` la spec si viene de un `/close-spec`.
4. **Contenido** — entrevista lo que no sepas, no lo inventes:
   - Contexto: la situación y las fuerzas EN ESTE MOMENTO (es lo que da valor al ADR años después).
   - Decisión: presente afirmativo ("Usamos X para Y").
   - Alternativas descartadas y por qué (evita que un futuro agente re-proponga lo ya descartado).
   - Consecuencias: las positivas Y la deuda asumida conscientemente.
   - Señales de revisión: qué condición futura debería disparar reconsiderarla.
5. **Reglas duras:** máximo 1 página; UNA decisión por ADR (si salen dos, son dos ADRs). Si esta decisión cambia una anterior: `supersedes:` aquí, y en el ADR viejo solo `superseded_by:` + `status: superseded` — su contenido jamás se edita.
6. **Archivo:** `docs/decisions/NNNN-<slug-del-titulo>.md`.
