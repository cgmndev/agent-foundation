# HANDOFF — continuidad de sesión y contexto no versionado

> Para el agente (Claude Code u otro) que abre este repo en una sesión **sin memoria previa**
> (carpeta renombrada, máquina nueva, primer arranque). Restaura el contexto que NO vive en el
> código: historia, estado, forma de trabajo del dueño y pendientes. El mapa del repo está en
> `CLAUDE.md`; las decisiones y sus porqués, en `docs/foundation/`. Este documento no los repite.

## Si eres una sesión nueva, haz esto primero

1. Lee `CLAUDE.md` (mapa del repo) y este documento completo.
2. **Reconstruye la memoria de proyecto** (dos memorias): una `proyecto` destilada de las
   secciones *Estado* e *Historia* de abajo, y una `perfil` destilada de *Cómo trabaja el dueño*.
3. Verifica el harness: el repo ya habilita el plugin en `.claude/settings.json`; si el
   marketplace no está registrado en esta máquina (o estaba por ruta local vieja):
   `/plugin marketplace add cgmndev/agent-foundation` + `/plugin install agent-foundation@agent-foundation`.
4. Respeta el **congelamiento en features** (regla en CLAUDE.md): no propongas skills/hooks
   nuevos; solo fixes de fricción real de uso.

## Qué es este repo (30 segundos)

Meta-repo de la **Fundación de Ingeniería agent-first** de Claudio (consultor; desarrolla
software de clientes con Claude Code como fuerza principal de implementación). Dos piezas: la
**suite de decisiones** (`docs/foundation/`, se copia como snapshot a cada proyecto vía
`/init-project`) y el **harness ejecutable** (plugin de Claude Code `agent-foundation` cuya raíz
es este mismo repo: 9 skills de lifecycle de specs y scaffolding, guardias de enforcement,
agente revisor, CLIs de hashing/trazabilidad). Nunca contendrá código de aplicación.

## Estado al cierre (2026-07-06)

- Publicado: `github.com/cgmndev/agent-foundation` · rama `main` · commits `4d8c27a` (bootstrap)
  y `d6f2d6a` (ronda 1 de iteración).
- Plugin `agent-foundation` **v0.3.0** · batería `scripts/test-harness.sh` en **47/47**.
- Suite: `01-stack` v1.3, `02` y `08` v1.2, resto v1.1 · contenido en español, identificadores
  y rutas en inglés (la traducción del contenido es la v2 pendiente).
- **Congelado en features** hasta la validación real (checkpoint C1-C6 de `11-sistema-specs.md`).
- `RESUMEN-IMPLEMENTACION.md` (si existe en la raíz) es material de estudio desechable del
  dueño, excluido de git vía `.git/info/exclude` — no lo commitees ni lo borres por tu cuenta.

## Historia condensada (por qué las cosas son como son)

1. **2026-07-05** — Dos investigaciones en Claude web: stacks agent-native y sistemas de
   especificación (divulgadores + practitioners de trinchera).
2. **2026-07-06 (reconciliación)** — Las dos líneas se contradecían en puntos operativos; se
   unificaron en la suite 00–12 + plantillas y se cerraron huecos (UI, build, contrato API,
   idioma, Zod v4…).
3. **2026-07-06 (harness)** — Plugin cuya raíz ES el repo. Corte de transportabilidad:
   maquinaria centralizada (viaja por plugin, se actualiza con bump) vs. decisiones/plantillas
   snapshoteadas por proyecto (un proyecto no cambia de contrato porque el plugin se actualice).
   Rename integral `fundacion → agent-foundation` y publicación.
4. **2026-07-06 (ronda 1 de iteración)** — Análisis de IAs externas, auditados contra el código
   antes de aplicar:
   - **Hono RPC fuera**: doble fuente de verdad frente a los schemas de `shared`, coste de
     inferencia sobre `tsc`, contrato no greppable → contrato = schemas + rutas builders en
     `packages/shared` + cliente fetch delgado con validación runtime (`01` §Cliente API).
   - **Bun → pnpm**: el híbrido quedó reducido a instalador con reglas de contención; pnpm da
     estrictez sin phantom deps y store con hard links (worktrees). Umbral de reversión
     documentado (`01` §Runtime).
   - **drift-check deny → ask**: sin ownership verificable del path, el deny bloqueaba trabajo
     ajeno y entrenaba el bypass.
   - **`format: 1`** en spec/plan/tasks: costura plugin↔snapshot para degradar con gracia.
   - **Telemetría pasiva** de lecturas de docs (`.git/agent-foundation-doc-reads.log`) para
     podar la suite en v2 con datos.
   - **Congelamiento en features** hasta que una feature real atraviese el ciclo completo.

## Cómo trabaja el dueño (Claudio)

- Conversación y artefactos de negocio en **español**; código, commits y logs en inglés
  (`04` §Idioma). Perfil senior.
- Doctrina: boring tech + type safety, enforcement determinista sobre guía blanda, greppability;
  le molesta la ceremonia arquitectónica. Busca el equilibrio automatizar-lo-necesario vs.
  mantenible — la **simplificación por sustracción** es el patrón ganador hasta ahora.
- Método: analizar y acordar ANTES de construir. Trae análisis de otras IAs para auditarlos:
  el patrón esperado es **verificar contra el código real, matizar y aplicar con criterio
  propio** — nunca rubber-stamp, y decir honestamente cuándo el análisis se equivoca.
- Commits por lote lógico al cierre de cada ronda (Conventional Commits, inglés); pregunta
  antes de commitear si él no lo pidió.

## Pendientes (en orden — el 1 descongela el resto)

1. **Validación real:** primera feature de un proyecto real (ProjectIA o el próximo greenfield)
   por `/new-spec → /activate-spec → implementación → /close-spec`, midiendo C1-C6.
   Esto ocurre en OTRO repo, no aquí.
2. Scaffold del monorepo automatizado — tras 1-2 ejecuciones manuales del checklist.
3. Harness de roles (GERENTE/DEVs) como agentes del plugin (semilla: `agents/revisor.md`).
4. Migración del contenido a inglés (v2) + poda de docs guiada por la telemetría.

## Notas operativas post-rename

- La carpeta local se llamaba `~/Projects/ProjectAI`; el nombre canónico nuevo es
  **`agent-foundation`** (kebab-case, igual que el repo GitHub — un `git clone` fresco produce
  el mismo nombre).
- La memoria de proyecto de Claude Code va atada a la ruta: si está vacía, reconstrúyela (paso 2
  de arriba). El historial de sesiones anteriores no es recuperable — este documento es el
  reemplazo.
- `.git/info/exclude` (exclusión local de RESUMEN-IMPLEMENTACION.md) sobrevive al rename porque
  vive dentro de `.git/`.
