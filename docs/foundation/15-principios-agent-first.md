---
doc: principios-agent-first
version: 1.7
fecha: 2026-07-22
estado: vigente
tipo: capa-durable
capa: principios
---

# 15 — Principios de Ingeniería Agent-First (contrato de packs)

La capa intermedia del corte método / principios / pack ([00-INDICE.md](00-INDICE.md) §Tres capas). Regla de altura que ordena toda la suite: **los criterios de elección son parte del modelo de desarrollo; las elecciones concretas son contexto del proyecto.** El método ([09](09-agentes.md), [11](11-sistema-specs.md)–[14](14-roadmap-parking.md), plantillas, maquinaria del plugin) no depende de ningún stack; el pack de referencia ts-monorepo ([01](01-stack.md)–[08](08-devops.md), [10](10-checklist-dia-cero.md)) es UNA instancia de estos principios. Este documento es el contrato para autorar o evaluar un pack — propio o de un cliente cuyo stack difiere del default.

## Los principios

### P1 — Feedback binario y barato

El agente se auto-corrige solo si el entorno responde "pasa o no pasa" rápido. Todo pack debe proveer un feedback loop ejecutable de veredicto binario (en el pack de referencia: `pnpm check && pnpm test`), con presupuesto de velocidad (integración de un módulo <30s; suite local <2-3 min). Una regla crítica sin sensor es un deseo, no una regla.

### P2 — El contexto es el recurso escaso

Los agentes escalan verticalmente, no horizontalmente: la unidad de trabajo debe caber en la smart zone (<~100k tokens). Consecuencias para cualquier pack: módulos autocontenidos, colocation sobre capas globales, documentos modulares cargados bajo demanda (progressive disclosure), tasks en vertical slices con una fase ≈ una sesión.

### P3 — Local reasoning / greppability

El agente razona con grep y lectura local: cero magia, cero indirection innecesaria, cero pasos de generación intermedios que se puedan olvidar, cero inferencia profunda de tipos que no se pueda leer. Convenciones de nombres que declaran responsabilidad sin abrir el archivo (sufijos por rol). Si entender una pieza exige seguir una cadena de archivos, el pack eligió mal.

### P4 — Boring technology como función de selección

No es "usa tecnología vieja": es un filtro de elección — máxima representación en training data, estabilidad de API, tooling con veredicto binario, ecosistema dominante sobre benchmarks. Las elecciones caducan (por eso cada una lleva umbral de revisión, formato de [01-stack.md](01-stack.md)); el filtro no.

### P5 — Enforcement determinista > guía

Lo que debe cumplirse siempre va en sensores (hooks deny/ask, lint, tipos, CI, branch protection); lo que orienta va en docs. Guardrails como trust infrastructure: deny para lo prohibido, ask para lo que requiere criterio humano en el momento. Los guards de **método** (secretos, protección de main, archivo de specs, drift) aplican en todo proyecto; los guards de **stack** los declara el pack.

### P6 — Testing como feedback loop del agente

La filosofía es del método; las herramientas, del pack. Invariantes: integration-first en el boundary del módulo (el agente refactoriza por dentro sin romper la suite), solo se doblan los bordes externos del sistema (jamás módulos internos), tests deterministas o se borran, Test-Last para features (contra código real) y Test-First para bugs, y trazabilidad AC→test verificada mecánicamente ([12-guia-specs.md](12-guia-specs.md) §3).

### P7 — Arquitectura dimensionada al agente

Módulos profundos (interfaz mínima explícita, complejidad oculta), las capas viven dentro del módulo, dependencias en un solo sentido, pocos límites pero duros (enforcement, no sugerencia). La ceremonia (puertos/adaptadores para todo, DI frameworks, capas globales por tipo técnico) multiplica el contexto sin retorno: se introduce abstracción cuando llega la segunda implementación, no antes.

### P8 — Conocimiento con ciclo de vida

Tres niveles: efímero (specs — se archivan con extracción de órganos), vivo (architecture.md + domain.md, presupuesto <500 líneas), durable (ADRs inmutables). Snapshot deliberado de decisiones por proyecto; maquinaria centralizada que evoluciona por plugin. Es el corazón del método ([11-sistema-specs.md](11-sistema-specs.md)) y ningún pack lo altera.

## Qué DEBE definir un pack (checklist de conformidad)

| # | Pieza | Formato de referencia |
|---|---|---|
| 1 | Elecciones cerradas de stack con justificación agent-first y **umbral de revisión** por componente | [01-stack.md](01-stack.md) |
| 2 | Arquitectura de referencia + **anti-patrones con nombre** | [02-arquitectura.md](02-arquitectura.md) |
| 3 | Layout de repo predecible + convenciones de nombres greppables | [03-estructura-repo.md](03-estructura-repo.md) |
| 4 | Convenciones de código con enforcement (lint/tipos como sensores) | [04-convenciones-codigo.md](04-convenciones-codigo.md) |
| 5 | Estrategia de datos y de testing instrumentadas (P6 aplicado a herramientas concretas) | [05](05-datos.md), [06](06-testing.md) |
| 6 | Baseline de seguridad y despliegue | [07](07-seguridad-config.md), [08](08-devops.md) |
| 7 | Checklist día cero ejecutable | [10-checklist-dia-cero.md](10-checklist-dia-cero.md) |
| 8 | Skills de scaffolding propios (equivalentes de `/new-module`, `/new-feature`) | `skills/` del plugin |
| 9 | Guards de stack propios + su declaración en el adapter | `scripts/guards/` + `pack.json` |
| 10 | **El adapter `pack.json`** (abajo) | `docs/foundation/pack.json` |
| 11 | Tabla de carga de contexto por tipo de tarea | [00-INDICE.md](00-INDICE.md) |

## El adapter: `docs/foundation/pack.json`

La costura ejecutable entre método y pack. La maquinaria del método lee SOLO este archivo — nunca supone stack; sin el archivo rigen los defaults del pack de referencia (comportamiento idéntico, `scripts/lib/pack.mjs`). Viaja con el snapshot de la suite (`/init-project` lo copia con `docs/foundation/`).

| Campo | Quién lo consume | Semántica |
|---|---|---|
| `feedbackLoop` | stop.mjs (mensaje), skills | Comando canónico de cierre de task |
| `loopCommandRegexes` | post-tool-use.mjs, stop.mjs | Qué comandos cuentan como cada parte del loop; verify-done exige TODAS las partes |
| `sourceFileRegex` | stop.mjs | Qué archivos modificados disparan verify-done |
| `testFileRegex` · `codeRoots` | check-acs.mjs | Dónde y en qué archivos se buscan los `AC-NN` |
| `stackGuards` | pre-tool-use.mjs | Qué guards de stack activa el pack (los de método no se pueden apagar) |

Merge superficial: un campo presente reemplaza el default completo (incluido el objeto `loopCommandRegexes`).

## Relación método ↔ pack (reglas de frontera)

1. **El método nunca nombra elecciones del pack.** Si un doc/skill de método necesita un comando o patrón concreto, lo lee del adapter o lo enuncia como "el feedback loop del pack".
2. **El pack cita principios, no los redefine.** Cada doc de pack puede justificar sus elecciones contra P1–P8; los principios solo se editan aquí.
3. **La elección de pack se registra en el ADR-000** del proyecto (junto a perfil de despliegue y tenancy, [10-checklist-dia-cero.md](10-checklist-dia-cero.md)). Cambiar de pack en un proyecto vivo = ADR + migración consciente.
4. **La sección Stack del CLAUDE.md del proyecto la provee el pack** ([plantillas/plantilla-claude.md](plantillas/plantilla-claude.md)).
5. Autorar un pack nuevo = cumplir la checklist de conformidad completa; un pack parcial (solo stack sin sensores ni scaffolding) no es un pack, es una lista de preferencias.
