---
name: implement-task
description: Ejecutar la siguiente task de una spec activa en una sesión con contexto justo - verifica hashes, carga plan + task + docs según tabla, implementa el vertical slice con sus tests de AC, feedback loop y checkbox. Usar al empezar (o continuar) la implementación de una spec.
argument-hint: <slug> [id-de-task]
---

# /implement-task — sesión de implementación de una task

Mecaniza el flujo estándar de una task (`docs/foundation/09-agentes.md` §Flujo de trabajo estándar). **EN OBSERVACIÓN** durante la validación real (ROADMAP): el checkpoint C1-C6 decide si se consolida, crece o se elimina.

## Pasos

1. **Localiza** la feature: `specs/active/*-<slug>` (usa `$ARGUMENTS`; si falta slug y hay UNA sola spec activa, úsala; si hay varias, pregunta). Verifica `format` compatible (12-guia §2) y `status: active` en la spec — una spec en draft no se implementa.
2. **Gate de sanidad:** `node "${CLAUDE_PLUGIN_ROOT:-.}/scripts/spec-hash.mjs" check specs/active/<carpeta>`. Con drift, para y dilo: la base no es válida para implementar ESTA feature (protocolo: 12-guia §5 / `/change-spec`).
3. **Carga el contexto justo** (smart zone — nada más que esto):
   - `plan.md` completo (enfoque, superficie de cambio, mapeo AC→test) y de `spec.md` SOLO la tabla de acceptance criteria.
   - La task objetivo: la indicada en `$ARGUMENTS` o la **primera sin marcar** de `tasks.md` (respetar el orden; las fases son secuenciales).
   - Docs de fundación SEGÚN LA TABLA de carga de `docs/foundation/00-INDICE.md` (p. ej. schema/query → 05; tests → 06). Nunca la suite completa.
4. **Implementa el vertical slice completo** de la task. Los tests de los `AC-NN` que la task referencia se escriben EN esta task, nunca en una fase final de testing. Respeta la superficie de cambio declarada en el plan: si necesitas tocar fuera de lo declarado, **para y dilo** — es material de `/change-spec` (rama A), no una excepción silenciosa.
5. **Feedback loop:** el del pack — `docs/foundation/pack.json` → `feedbackLoop` (default: `pnpm check && pnpm test`). Sin verde no hay done; no marques nada en rojo.
6. **Cierra la task:** marca su checkbox en `tasks.md` (`updated:` hoy), registra desvíos o hallazgos en "Notas de ejecución", y ofrece el commit convencional del slice.
7. **Cierra la sesión con criterio:** informa cuánto presupuesto de contexto queda. Si la siguiente task cabe con holgura en la smart zone, ofrece continuar (vuelve al paso 3); si no, recomienda commit + `/clear` y sesión limpia. Si era la última task: el siguiente paso es `/review-fresh` y después `/close-spec` — no los ejecutes tú de oficio.
