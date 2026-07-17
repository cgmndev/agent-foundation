# Roadmap — agent-foundation

Trabajo abierto del repo, en orden. El punto 1 **descongela el resto** (ver la regla de "congelado en features" en `CLAUDE.md`). Los *porqués* de cada decisión viven en `docs/foundation/` y en `git log`; esto es solo la lista de qué falta.

## Pendientes

1. **Validación real** — primera feature de un proyecto real por el ciclo completo `/new-spec → /activate-spec → implementación → /close-spec`, midiendo el checkpoint C1-C6 (`docs/foundation/11-sistema-specs.md`). Ocurre en OTRO repo, no aquí. Es lo que descongela el resto.
2. **Scaffold del monorepo automatizado** — tras 1-2 ejecuciones manuales del checklist día-cero.
3. **Harness de roles** (GERENTE / DEVs) como agentes del plugin (semilla: `agents/revisor.md`).
4. **Migración del contenido a inglés** (v2) + poda de docs guiada por la telemetría de lecturas (`.git/agent-foundation-doc-reads.log`).

## Excepción documentada al freeze (2026-07-16 — CERRADA)

Paquete pre-validación aprobado tras el contraste con el main flow de mattpocock/skills (análisis efímero de jul-2026, descartado tras absorber sus conclusiones). Criterio de entrada: solo doctrina ya escrita (09 §Flujo estándar) que la validación ejercita sí o sí, más el argumento de snapshot (lo que no entre a la suite antes del primer `/init-project`, la validación no lo prueba nunca). Entró:

1. `plantilla-tasks`: dimensionamiento explícito — una fase ≈ una sesión (smart zone).
2. `/new-spec`: destilación de discusión previa + propuesta de diff de hechos durables al cerrar el grilling.
3. Skill nuevo **`/implement-task`** (mínimo, **EN OBSERVACIÓN**: la señal "fricción por sesión de implementación" de `11-sistema-specs` §Checkpoint decide en C1-C6 si se consolida, crece o se elimina).
4. Este registro. Suite v1.5→v1.6 · plugin 0.4.1→0.5.0.

La excepción queda **cerrada**: lo próximo que entre debe venir de fricción real de uso, no de más análisis.
