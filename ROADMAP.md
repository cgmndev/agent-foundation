# Roadmap — agent-foundation

Trabajo abierto del repo, en orden. El punto 1 **descongela el resto** (ver la regla de "congelado en features" en `CLAUDE.md`). Los *porqués* de cada decisión viven en `docs/foundation/` y en `git log`; esto es solo la lista de qué falta.

## Pendientes

1. **Validación real** — primera feature de un proyecto real por el ciclo completo `/new-spec → /activate-spec → implementación → /close-spec`, midiendo el checkpoint C1-C6 (`docs/foundation/11-sistema-specs.md`). Ocurre en OTRO repo, no aquí. Es lo que descongela el resto.
2. **Scaffold del monorepo automatizado** — tras 1-2 ejecuciones manuales del checklist día-cero.
3. **Harness de roles** (GERENTE / DEVs) como agentes del plugin (semilla: `agents/revisor.md`).
4. **Migración del contenido a inglés** (v2) + poda de docs guiada por la telemetría de lecturas (`.git/agent-foundation-doc-reads.log`).
5. **Hook PreCompact** que re-ancle plan/tasks antes de compactar (complemento del re-brief post-compact que ya hace session-start; prioridad baja — parking).
6. **Segundo pack real** (Python u otro stack de cliente S2) — construir la infraestructura multi-pack SOLO cuando exista; hoy la costura (`pack.json` + `scripts/lib/pack.mjs`) es suficiente por diseño (YAGNI).

## Excepción documentada al freeze (2026-07-22 — CERRADA)

Paquete de auditoría pre-validación 2, aplicado por instrucción directa del usuario (freeze obviado deliberadamente: aún no hay proyectos sobre la fundación, y estos cambios alteran lo que el primer `/init-project` snapshotea — el mismo argumento de la excepción 1). Entró:

1. **Numeración global de ACs por proyecto** — cierra el defecto de colisión del gate de trazabilidad: `check-acs` grepa TODOS los tests, y con numeración por-spec los tests de features cerradas satisfacían specs futuras (el gate se vaciaba desde la feature 2). Cambios en 11 (D2), 12 §3/§7, plantilla-spec y `/new-spec`.
2. **Corte método / principios / pack** — la suite se declara en tres capas (campo `capa:` en frontmatter; doc nuevo `15-principios-agent-first.md` como contrato de packs) y la maquinaria del método queda parametrizada por el adapter `docs/foundation/pack.json` (`scripts/lib/pack.mjs`): feedback loop, patrones de archivos, raíces de código y guards de stack. Sin `pack.json` rigen los defaults del pack de referencia (comportamiento idéntico). Los criterios de elección son método; las elecciones son contexto del proyecto (ADR-000 registra el pack).
3. **Fixes de guardias** — archive-guard cubre el campo `pattern` de Glob (hueco real); verify-done exige check Y test (marcador JSON por parte, antes bastaba una de las dos); `/new-spec` documenta el bypass legítimo vía Bash para verificar slugs en `specs/archive/`.
4. **CI del harness** — `.github/workflows/test-harness.yml` corre la batería en cada push/PR.

Suite v1.6→**v1.7** · plugin 0.5.0→**0.6.0** · batería 47→**60** aserciones. La excepción queda **CERRADA**: lo próximo que entre debe venir de fricción real de uso, no de más análisis.

## Excepción documentada al freeze (2026-07-16 — CERRADA)

Paquete pre-validación aprobado tras el contraste con el main flow de mattpocock/skills (análisis efímero de jul-2026, descartado tras absorber sus conclusiones). Criterio de entrada: solo doctrina ya escrita (09 §Flujo estándar) que la validación ejercita sí o sí, más el argumento de snapshot (lo que no entre a la suite antes del primer `/init-project`, la validación no lo prueba nunca). Entró:

1. `plantilla-tasks`: dimensionamiento explícito — una fase ≈ una sesión (smart zone).
2. `/new-spec`: destilación de discusión previa + propuesta de diff de hechos durables al cerrar el grilling.
3. Skill nuevo **`/implement-task`** (mínimo, **EN OBSERVACIÓN**: la señal "fricción por sesión de implementación" de `11-sistema-specs` §Checkpoint decide en C1-C6 si se consolida, crece o se elimina).
4. Este registro. Suite v1.5→v1.6 · plugin 0.4.1→0.5.0.
