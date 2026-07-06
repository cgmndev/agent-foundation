---
name: close-spec
description: Cerrar una feature terminada - verificar suite verde, cadena de hashes y trazabilidad AC→tests, extraer órganos (ADR/dominio/arquitectura) y archivar la spec. Usar al terminar la implementación de una spec.
argument-hint: <slug>
---

# /close-spec — ritual de cierre

Contrato: `docs/foundation/12-guia-specs.md` §7. *La spec se tira, pero antes se le extraen los órganos.*

## Pasos

1. Localiza `specs/active/*-<slug>`.

2. **Gates bloqueantes, en orden:**
   a. Cadena de hashes limpia: `node "${CLAUDE_PLUGIN_ROOT:-.}/scripts/spec-hash.mjs" check specs/active/<carpeta>`
   b. Suite verde: `bun run check && bun run test`. Si el repo no tiene esos scripts (p. ej. repo de docs), pide confirmación explícita de N/A al usuario.
   c. Trazabilidad: `node "${CLAUDE_PLUGIN_ROOT:-.}/scripts/check-acs.mjs" specs/active/<carpeta>/spec.md`
      - ACs sin test → **BLOQUEO**: lista cuáles y para (se escriben los tests o se justifica el cambio vía /change-spec).
      - ACs manuales → pide confirmación explícita de que se validaron, uno a uno.
   d. Tasks: si quedan checkboxes sin marcar en `tasks.md`, pregunta por qué (¿trabajo pendiente = no se cierra; task obsoleta = anotarla?).

3. **Extracción de órganos** (pregunta las tres, proponiendo tú una respuesta en cada una):
   - ¿Alguna decisión del plan merece ADR? → usa `/adr` (con `origin:` apuntando a esta spec).
   - ¿Cambió el dominio o sus reglas? → propone un DIFF sobre `docs/domain.md` (nunca edites directo: regla del CLAUDE.md).
   - ¿Cambió la arquitectura? → propone un DIFF sobre `docs/architecture.md`.

4. **Archivo:** en `spec.md`: `status: implemented` (o `superseded` si es cierre parcial desde /change-spec) y `updated:` hoy. Mueve la **carpeta completa** a `specs/archive/AAAA-MM/` (mes de cierre; `mkdir -p`; usa `git mv` si hay repo).

5. **Reporte final:** ACs verificados (test/manual), órganos extraídos, ruta de archivo, y aprendizajes de las "Notas de ejecución" de tasks.md si las hay (insumo para mejorar plantillas/fundación).
