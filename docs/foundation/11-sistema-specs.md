---
doc: sistema-specs
version: 1.2
fecha: 2026-07-06
estado: vigente
tipo: capa-durable
changelog:
  - "1.2: Integración en la suite unificada (doc 11). Diagnóstico comprimido a Fundamentos; radar de fuentes movido a 00-INDICE; roadmap retirado (pasa a spec del meta-repo); ejemplos alineados al stack final (Node LTS runtime); rutas canónicas: specs/ en raíz + docs/decisions/."
  - "1.1: Protocolo de cambio mid-feature, trazabilidad AC→tests, trabajo no-feature, criterios de checkpoint, paralelización."
  - "1.0: Versión inicial consolidando las tres investigaciones de jul-2026."
---

# 11 — Sistema de Especificaciones: Decisiones

El QUÉ y el POR QUÉ del sistema de specs. El CÓMO ejecutable (estructura, hashing, skills, hooks) vive en [12-guia-specs.md](12-guia-specs.md); las plantillas, en [plantillas/](plantillas/).

## Fundamentos (síntesis de la investigación)

Dos capas de evidencia independientes — divulgadores (Grove, Karpathy, Willison, Fowler/Böckeler, Pocock, Beck) y practitioners de trinchera (Horthy, Tane, Vincent, McDonald, Love, Vaughan, equipos PostHog/incident.io) — convergieron en las mismas conclusiones, que por eso tienen estatus de decisión y no de experimento:

1. **Las specs de feature son scaffolding:** se escriben para construir y se archivan al mergear. Nadie mantiene specs históricas actualizadas a escala.
2. **Existe una capa durable, pero es mínima:** arquitectura, decisiones (ADRs) y dominio. No "toda la documentación viva": la estrictamente necesaria.
3. **"PRD" está muerto en este contexto.** Los equipos usan frameworks internos ligeros; "spec" es el término operativo.
4. **Los frameworks pesados se abandonan** (BMAD, ceremonias multi-agente elaboradas) tras el entusiasmo inicial. De Spec Kit se saquea la idea de constitución de proyecto — que en esta suite son la fundación + CLAUDE.md —; de OpenSpec, la separación active/archive.
5. **SDD no aplica a todo:** hay umbrales de cuándo especificar (Decisión 6).

Donde las capas difieren, gana trinchera con matiz: conocimiento técnico in-repo (markdown en git, no vault); el código + tests como verdad (la spec es intención temporal — pero los acceptance criteria sobreviven como tests); formalismo mínimo (frontmatter + hash solo en artefactos activos, nunca en archivados). La procedencia completa (fuentes, sesgos, tensiones) vive en el vault como Layer 1; el radar de fuentes, en [00-INDICE.md](00-INDICE.md).

## DECISIÓN 1 — Framework propio de tres artefactos

- **Se abandona "PRD"** como término y como formato: verboso, ambiguo, herencia de otra era organizacional.
- Tres artefactos por feature:
  - `spec.md` — el QUÉ y el POR QUÉ. 1–3 páginas máximo. Sin decisiones de implementación. Plantilla: [plantillas/plantilla-spec.md](plantillas/plantilla-spec.md).
  - `plan.md` — el CÓMO: decisiones técnicas, trade-offs, superficie de cambio. Plantilla: [plantillas/plantilla-plan.md](plantillas/plantilla-plan.md).
  - `tasks.md` — descomposición ejecutable con checkboxes y orden. Plantilla: [plantillas/plantilla-tasks.md](plantillas/plantilla-tasks.md).
- La separación dura WHAT/HOW es regla inviolable (validada por ambas capas de investigación).
- **Ningún framework externo se adopta íntegro** (Spec Kit, BMAD, Kiro, OpenSpec); se saquean ideas puntuales.

## DECISIÓN 2 — Lifecycle: snapshot con archivo, no living documentation

- **Las specs de feature son snapshots.** Comunican intención en un punto de la línea temporal (con cliente, con el agente, contigo mismo futuro). No se mantienen retroactivamente; **nunca** se actualiza una spec cerrada porque otra posterior la contradiga.
- **Lifecycle formal mínimo** vía frontmatter (`status: draft | active | implemented | superseded`):
  1. `draft` → en elaboración; no es contexto válido para agentes.
  2. `active` → contrato vigente de la implementación en curso.
  3. `implemented` → mergeada; se mueve a `specs/archive/AAAA-MM/` y deja de ser contexto por defecto.
  4. `superseded` → invalidada explícitamente por otra spec (`superseded_by:` en frontmatter). Crítico para no contaminar contexto de LLM.
- El **hashing SHA-256** se restringe a detectar staleness entre `spec.md` ↔ `plan.md` ↔ `tasks.md` *dentro de una feature activa* ([12-guia-specs.md](12-guia-specs.md) §2). No se usa para mantener specs históricas.
- **Trazabilidad obligatoria AC → tests:** todo criterio recibe un ID estable (`AC-NN`) y todo test que lo verifica incluye el ID en su nombre. La verificación de `/close-spec` es mecánica (grep de IDs), no de buena voluntad (guía §3).
- **Lo único que sobrevive de una spec al archivarse:** acceptance criteria → tests trazados por ID; decisiones arquitectónicas relevantes → ADR (Decisión 3); cambios de dominio → `docs/domain.md`.

> Regla mnemotécnica: *la spec se tira, pero antes se le extraen los órganos*.

## DECISIÓN 3 — La capa durable: mínima y en el repo

```
proyecto/
├── docs/
│   ├── architecture.md        # Documento vivo ÚNICO de arquitectura
│   ├── domain.md              # Glosario y reglas de negocio (vivo)
│   └── decisions/             # ADRs numerados, inmutables una vez aceptados
│       ├── 0001-<decision>.md
│       └── ...
└── specs/
    ├── active/                # Specs en draft/active (una carpeta por feature)
    └── archive/AAAA-MM/       # Specs implemented/superseded (mes de cierre)
```

- `architecture.md` y `domain.md` son los **únicos documentos vivos** con obligación de mantenimiento. Presupuesto acotado: si superan ~500 líneas, se está documentando de más. Plantillas: [plantillas/plantilla-architecture.md](plantillas/plantilla-architecture.md) y [plantillas/plantilla-domain.md](plantillas/plantilla-domain.md).
- Los **ADRs son inmutables**: capturan una decisión en su momento con su contexto. Si la decisión cambia, se escribe un ADR nuevo con `supersedes:`. Plantilla: [plantillas/plantilla-adr.md](plantillas/plantilla-adr.md). El stack default de esta suite **no** se retro-documenta por proyecto: los ADRs del proyecto registran desviaciones de la fundación y decisiones propias.
- **`/close-spec` automatiza el ritual de archivo:** mover la spec, verificar trazabilidad AC→tests, preguntar qué órganos extraer. Disciplina mecánica, coherente con el principio enforcement > guidance.

## DECISIÓN 4 — Segundo cerebro: split por audiencia y alcance

El vault de Obsidian no desaparece: cambia de rol. Criterio de partición: *¿quién consume este conocimiento y con qué alcance?*

| Conocimiento | Vive en | Razón |
|---|---|---|
| Técnico del proyecto (arquitectura, dominio, ADRs, convenciones) | **Repo** (`docs/`) | Los agentes lo necesitan sin fricción; versionado con el código; verificable en PR review |
| Negocio del cliente, actas, contexto comercial, requisitos crudos | **Obsidian** | No pertenece al repo; el cliente y tú sois la audiencia; formato más libre |
| Cross-proyecto: playbooks, patrones reutilizables, lecciones, esta suite (copia maestra) | **Obsidian** | Trasciende repos individuales; es capital del consultor |
| Instrucciones operativas del agente | `CLAUDE.md` (delgado) + skills | Ver Decisión 5 |

- **Puente Obsidian → repo:** cuando una nota de negocio madura en requisito, se destila a una `spec.md`. Flujo unidireccional; no hay sincronización bidireccional (ahí muere el mantenimiento).
- El vault mantiene el patrón LLM Wiki con **rutina de poda trimestral**: nota sin tocar en 6 meses y sin backlinks → `_stale/`. La staleness es riesgo de primera clase también aquí.

## DECISIÓN 5 — Harness delgado, conocimiento denso

- **CLAUDE.md se mantiene delgado** (<~150 líneas): convenciones, comandos y punteros. No es un vertedero de conocimiento; es un índice con reglas. Plantilla canónica: [plantillas/plantilla-claude.md](plantillas/plantilla-claude.md).
- El conocimiento profundo vive en `docs/` y se carga bajo demanda, preservando la smart zone de contexto ([09-agentes.md](09-agentes.md)).
- **Skills para procedimientos repetibles** (`/new-spec`, `/activate-spec`, `/change-spec`, `/close-spec`), no para conocimiento estático. Behavior specs: guía §7.
- Integración con el harness de roles: GERENTE consume `domain.md` y specs; los perfiles DEV consumen `architecture.md` y ADRs. La partición por audiencia (Decisión 4) alimenta la partición por rol.

## DECISIÓN 6 — Cuándo especificar (umbrales operativos)

SDD no aplica a todo. Reglas de decisión:

| Situación | Acción |
|---|---|
| Cambio < ~1h de trabajo estimado, ámbito claro | **Sin spec.** Prompt directo con contexto. El overhead no se paga |
| Feature de 1h – 1 día, ámbito claro | `tasks.md` solo, o issue bien redactado |
| Feature > 1 día, o toca > 3 módulos, o hay ambigüedad de requisitos | **Spec completa** (spec/plan/tasks) |
| Exploración / spike / prototipo | **Sin spec previa.** Se explora, y si el resultado se productiviza, se escribe la spec *a posteriori* como contrato de la versión real |
| Trabajo con cliente no técnico involucrado | **Spec siempre**: su función primaria ahí es interfaz de comunicación humana, no solo contexto para el agente |
| **Bug simple** (causa evidente, fix localizado) | Sin spec. Issue + test de regresión obligatorio (el test ES el artefacto durable del bug) |
| **Bug complejo** (causa desconocida, cross-módulo, o de producción con impacto) | `plan.md` solo: hipótesis, diagnóstico, estrategia de fix y verificación |
| **Refactor / deuda técnica** | `plan.md` + `tasks.md`, sin spec.md. El plan declara la invariante: qué comportamiento observable NO cambia, verificado por la suite existente |
| **Migración** (datos, infra, versiones mayores) | **Spec completa** siempre: son irreversibles o caras de revertir; los ACs de verificación post-migración son críticos |

Principio general: `spec.md` existe cuando hay un QUÉ nuevo que acordar; `plan.md` cuando el CÓMO tiene riesgo o decisiones; `tasks.md` cuando hay ejecución multi-paso que un agente debe seguir sin desviarse.

## DECISIÓN 7 — Protocolo de cambio mid-feature

Tres ramas según impacto en los acceptance criteria: (1) no toca ACs → editar plan/tasks y recalcular hashes; (2) toca ≤ 1/3 de los ACs sin invalidar trabajo hecho → `/change-spec`: bump de versión + changelog + re-aprobación; (3) invalida el enfoque → cerrar como `superseded` y abrir spec nueva con `supersedes:`.

Regla dura: **una spec `active` nunca se edita silenciosamente** — todo cambio deja version + changelog. En consultoría, ese rastro es además protección contractual: documenta qué se acordó y cuándo cambió. Árbol operativo completo: [12-guia-specs.md](12-guia-specs.md) §5.

## DECISIÓN 8 — Paralelización y ownership

Para cuando se activen sesiones paralelas de agentes (worktrees):

- **Una spec activa = un worktree = una sesión de agente.** Nunca dos agentes sobre la misma spec.
- `plan.md` declara los **módulos/rutas que tocará** (sección "Superficie de cambio"). Antes de lanzar features en paralelo se comparan superficies: si dos specs activas declaran el mismo módulo, se **secuencian** — no se resuelve con merges heroicos.
- La capa durable (`docs/`) solo se edita desde la rama principal o en el ritual `/close-spec`, nunca concurrentemente desde dos worktrees.
- Umbral de activación: esta decisión permanece dormida hasta que haya ≥ 2 features grandes simultáneas de forma habitual. No montar la infraestructura antes de necesitarla.

## Checkpoint de validación (criterios ex-ante)

El plan de adopción es trabajo, no doctrina: vive como spec del propio meta-repo de la fundación. Lo durable son los criterios de éxito, definidos antes de usar el sistema:

| # | Criterio | Umbral de éxito | Cómo se mide |
|---|---|---|---|
| C1 | Coste de la capa viva | ≤ 30 min/semana en mantener `architecture.md` + `domain.md` | Registro simple de tiempo al editarlos |
| C2 | Specs efectivas | ≥ 80% de las features con spec completadas sin retrabajo mayor (>20% de tasks rehechas) | Revisión de tasks.md archivados |
| C3 | Disciplina snapshot | 0 ediciones retroactivas a specs archivadas | `git log` sobre `specs/archive/` |
| C4 | Trazabilidad | 100% de ACs de specs cerradas con test trazado por ID | Salida del `/close-spec` |
| C5 | Fricción del ritual | `/close-spec` toma < 15 min por feature | Cronometrar 3 cierres |
| C6 | Tamaño de capa viva | `architecture.md` y `domain.md` < 500 líneas cada uno | `wc -l` |

Si ≥ 5 de 6 se cumplen tras ~2 meses de uso real → el sistema queda como estándar. Si fallan C1 o C6 → simplificar la capa viva. Si falla C2 → revisar calidad de specs (probablemente ambigüedad en ACs).

## Riesgos asumidos

- **Evidencia cualitativa y reciente:** convergencia de opiniones senior, no benchmarks. El checkpoint con criterios ex-ante existe para validar contra experiencia propia.
- **Riesgo de sub-documentar:** el modelo snapshot tienta a extraer poco al archivar. Mitigación: el ritual automatizado de `/close-spec`.
- **Riesgo de re-inflar la capa viva:** `architecture.md` tiende a crecer. El límite de ~500 líneas es un tripwire, no una sugerencia (criterio C6).
- **El campo se mueve rápido:** las afirmaciones sobre herramientas caducan en meses; las decisiones estructurales (snapshot + capa durable mínima + split por audiencia) responden a economía de mantenimiento y tienen vocación de permanencia.
