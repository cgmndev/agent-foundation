---
doc: indice
version: 1.5
fecha: 2026-07-16
estado: vigente
tipo: capa-durable
---

# Fundación de Ingeniería — Fuente de Verdad Pre-Proyecto

Suite de decisiones y convenciones de ingeniería para iniciar cualquier proyecto nuevo de software con desarrollo asistido por agentes (Claude Code). Es la **capa durable** del modelo de dos niveles: los specs (spec.md / plan.md / tasks.md) son efímeros y por feature; estos documentos son estables y por organización/proyecto. La suite incluye el sistema de especificaciones ([11](11-sistema-specs.md)–[12](12-guia-specs.md)), el onboarding humano ([13](13-onboarding.md)), el roadmap-parking ([14](14-roadmap-parking.md)) y las plantillas de todos los artefactos ([plantillas/](plantillas/)).

**Esta suite NO cubre:** el harness de roles (GERENTE, JUNIOR_DEV, SENIOR_DEV, DEVOPS), que tiene documentación separada. Aquí solo se referencian sus puntos de integración.

## Mapa de documentos

| Doc | Contenido | Cuándo consultarlo |
|---|---|---|
| [01-stack.md](01-stack.md) | Stack tecnológico completo con veredictos y umbrales de revisión | Día cero y ante cualquier duda de "qué librería uso para X" |
| [02-arquitectura.md](02-arquitectura.md) | El punto óptimo: monolito modular + vertical slices + módulos profundos + convenciones REST | Al diseñar un módulo nuevo o cuestionar una abstracción |
| [03-estructura-repo.md](03-estructura-repo.md) | Layout de monorepo, convenciones de nombres, colocation | Al crear el repo y al añadir carpetas/paquetes |
| [04-convenciones-codigo.md](04-convenciones-codigo.md) | Idioma, TypeScript, Zod v4 anti-errores, lint/format, manejo de errores, git | Referencia permanente durante implementación |
| [05-datos.md](05-datos.md) | PostgreSQL + Drizzle: schema, migraciones, queries, transacciones, pg-boss | Al tocar cualquier cosa de la capa de datos |
| [06-testing.md](06-testing.md) | Estrategia de testing como feedback loop del agente (Test-Last/Test-First) | Al escribir tests o definir el test boundary de un módulo |
| [07-seguridad-config.md](07-seguridad-config.md) | Env vars, secrets, auth, CSRF, validación de entrada | Setup inicial y features con superficie de seguridad |
| [08-devops.md](08-devops.md) | Docker, CI/CD, perfiles de despliegue (VPS+Coolify / AWS-OCI), observabilidad | Setup de pipeline y despliegue |
| [09-agentes.md](09-agentes.md) | Integración con Claude Code: CLAUDE.md, hooks, skills, carga de contexto | Al configurar el agente en un proyecto nuevo |
| [10-checklist-dia-cero.md](10-checklist-dia-cero.md) | Checklist ejecutable para arrancar un proyecto | El primer día, en orden |
| [11-sistema-specs.md](11-sistema-specs.md) | Sistema de especificaciones: decisiones y porqués (snapshot, capa durable, umbrales, modos) | Ante dudas de si/cómo especificar un trabajo |
| [12-guia-specs.md](12-guia-specs.md) | Guía operativa de specs: estructura, hashing, trazabilidad AC→test, skills, hooks | Al crear, cambiar o cerrar cualquier spec |
| [13-onboarding.md](13-onboarding.md) | Tutorial de humano a humano: setup, ciclo completo de una feature, guardias y errores típicos | Primer día de un dev nuevo (el agente no lo carga) |
| [14-roadmap-parking.md](14-roadmap-parking.md) | Plantilla del roadmap-parking de evoluciones por proyecto | Día cero, y cada vez que una idea quede fuera de alcance |
| [plantillas/](plantillas/) | Plantillas canónicas: spec, plan, tasks, ADR, architecture, domain, CLAUDE.md | Al instanciar cualquier artefacto |

## Cómo usar esta suite

1. **Al iniciar un proyecto:** instalar el harness (plugin `agent-foundation`: skills + hooks + esta suite) y ejecutar `/init-project`, que copia la suite completa (incluye `plantillas/`) a `docs/foundation/` e instancia CLAUDE.md, docs vivos y `specs/`. Después: [10-checklist-dia-cero.md](10-checklist-dia-cero.md). Ajustar solo lo que el proyecto exija de forma justificada; toda desviación se registra como ADR ([plantillas/plantilla-adr.md](plantillas/plantilla-adr.md)). La maquinaria (skills/hooks) NO se copia: viaja y se actualiza vía plugin; esta copia de docs es un snapshot deliberado.
2. **Copia maestra y precedencia:** la copia maestra de esta suite vive en **ESTE repo** (`agent-foundation`) — regla de oro del ecosistema: repo (ejecutable) > set conceptual del vault > material de presentación. El vault de Obsidian guarda la doctrina (decisiones fundacionales, manuales de modo), el negocio y copias informativas; **toda edición de la suite se hace aquí y se propaga hacia el vault, nunca al revés**. (Regla corregida en v1.5: la inversa —"gana el vault"— causó la divergencia silenciosa de julio-2026.)
3. **Para el agente:** NUNCA cargar la suite completa en contexto. El CLAUDE.md del proyecto referencia estos documentos y el agente carga solo el relevante para la tarea (progressive disclosure). Ver [09-agentes.md](09-agentes.md).

### Carga de contexto por tipo de tarea (regla para el agente)

| Tipo de tarea | Docs a cargar |
|---|---|
| Feature nueva full-stack | 02 + 03 + fragmento relevante de 04 |
| Cambio de schema / query | 05 |
| Escribir o arreglar tests | 06 |
| Setup / pipeline / deploy | 08 |
| Duda de librería o versión | 01 |
| Auth, permisos, secrets | 07 |
| Jobs en background / reactividad | 01 (pg-boss, polling) + 02 |
| Crear / cambiar / cerrar una spec | 12 (+ 11 si hay duda de criterio) |

## Principios rectores (resumen ejecutivo)

1. **Boring technology + type safety end-to-end.** Los agentes rinden mejor sobre ecosistemas estables, bien representados en training data, con veredicto binario del tooling ("either it runs or it doesn't").
2. **El harness importa más que el stack.** Antes de cambiar una librería, invertir en CLAUDE.md, hooks, skills y disciplina de contexto.
3. **Context bloat es riesgo de primera clase.** Documentos modulares, módulos profundos, vertical slices que quepan en la smart zone (<~100k tokens).
4. **Enforcement determinista, guía suave.** Lo que debe cumplirse siempre va en hooks/permissions/lint/types; lo que orienta va en CLAUDE.md y estos docs.
5. **Local reasoning / greppability.** El agente depende de `grep` y razonamiento local: cero magia, cero indirection innecesaria, convenciones explícitas.

## Fuentes

Esta suite sintetiza tres investigaciones (05-jul-2026): (a) panorama de stacks agent-native y tooling agéntico (Ronacher, Pocock, Böckeler, Willison, Karpathy, Huntley); (b) validación con practitioners de trinchera en foros especializados (HN, Reddit, X), incluyendo el análisis de arquitectura vertical slice vs hexagonal y el veredicto Bun vs Node; (c) especificaciones de software y prácticas SDD (base de [11](11-sistema-specs.md)–[12](12-guia-specs.md)). Los documentos fuente viven en el vault como Layer 1 (fuentes inmutables).

**Radar de fuentes** (consultar al revisar la suite): trinchera — Dex Horthy (12-factor agents), Boris Tane, Jesse Vincent, Joshua McDonald, Marc Love, Daniel Vaughan, blogs de PostHog e incident.io; modelos mentales — Pocock, Willison, Böckeler. Contrastar siempre divulgación contra trinchera antes de adoptar maquinaria nueva.

## Historial

- **1.5 (2026-07-16) — Reconciliación de líneas divergentes.** La suite del repo (1.x por doc, 07-06) y la copia del vault (v1.3 suite-wide, 07-14, "cosecha de ProjectAI") habían evolucionado en paralelo. Esta versión las fusiona con criterio "decisión más nueva gana; contenido único se preserva": del vault entran el Perfil B (VPS+Coolify) como default con doble perfil de despliegue, modo SPA como default de TanStack Start (con tripwire; resuelve el conflicto con el SSR-default del repo — los proyectos SSR van por ADR), pnpm sin corepack, short-polling exclusivo, pg-boss como componente de primera clase (`baseJobPayloadSchema` + `correlationId` + idempotencia), contratos como route builders con rutas registradas desde el contrato y presupuesto congelado del wrapper, capa UI (Shadcn+Tailwind v4+RHF), Test-Last/Test-First con prohibición de RTL, `errorComponent` obligatorio, escalera de estado, Squash and Merge, CLAUDE.md jerárquicos, `correlationId` (reemplaza `requestId`) y el doc 14 (roadmap-parking). Del repo se preservan: convenciones REST del boundary (02), secciones Idioma y Zod v4 anti-errores (04), patrón globalSetup de Testcontainers (06), CSRF (07), Build/ESM/tsx+tsup y umbrales de Bun y TanStack Form (01), checklist plugin-aware (10) y los docs 11-13. Se corrige la regla de copia maestra (ahora: el repo manda) y se unifica el versionado a nivel de suite (los números por-doc previos quedan supersedidos). El sistema de specs (11-12) incorpora los modos de operación (dual-mode D17) y los refinamientos de grilling.
- **Líneas previas (resumen):** vault 1.1–1.3 (2026-07-14): Bun eliminado, TanStack Start SPA, contratos sin RPC, cosecha ProjectAI, optimización post-review y freeze. Repo 1.0–1.2 (2026-07-05/06): versión inicial, ronda 1 de iteración (simplificación de stack, harness endurecido), suite unificada con specs 11-12 y onboarding 13.

## Ciclo de vida de esta suite

**FREEZE ACTIVO:** la suite queda congelada hasta completar la validación end-to-end con un proyecto real (checkpoint C1–C6, [11-sistema-specs.md](11-sistema-specs.md)). Durante el freeze no se agregan features; los hallazgos se registran como ADR del proyecto o notas de retro y alimentan la versión siguiente. (La reconciliación v1.5 es mantenimiento de decisiones ya tomadas, no feature nueva.) Al cerrar la validación, la telemetría de docs decide la poda: lo que el agente demostró no leer se elimina o se fusiona — menos texto normativo es una mejora, no una pérdida.

- **Revisión programada:** al cerrar el proyecto de validación (fin del freeze); luego trimestral o por retro de proyecto.
- **Versionado:** SemVer a nivel de suite en el frontmatter de cada doc. Cambios de decisión = minor; cambios de principio = major.
- **Umbrales de revisión anticipada:** listados por componente en [01-stack.md](01-stack.md).
