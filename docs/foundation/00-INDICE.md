---
doc: indice
version: 1.1
fecha: 2026-07-06
estado: vigente
tipo: capa-durable
---

# Fundación de Ingeniería — Fuente de Verdad Pre-Proyecto

Suite de decisiones y convenciones de ingeniería para iniciar cualquier proyecto nuevo de software con desarrollo asistido por agentes (Claude Code). Es la **capa durable** del modelo de dos niveles: los specs (spec.md / plan.md / tasks.md) son efímeros y por feature; estos documentos son estables y por organización/proyecto. La suite incluye el sistema de especificaciones ([11](11-sistema-specs.md)–[12](12-guia-specs.md)) y las plantillas de todos los artefactos ([plantillas/](plantillas/)).

**Esta suite NO cubre:** el harness de roles (GERENTE, JUNIOR_DEV, SENIOR_DEV, DEVOPS), que tiene documentación separada. Aquí solo se referencian sus puntos de integración.

## Mapa de documentos

| Doc | Contenido | Cuándo consultarlo |
|---|---|---|
| [01-stack.md](01-stack.md) | Stack tecnológico completo con veredictos y umbrales de revisión | Día cero y ante cualquier duda de "qué librería uso para X" |
| [02-arquitectura.md](02-arquitectura.md) | El punto óptimo: monolito modular + vertical slices + módulos profundos | Al diseñar un módulo nuevo o cuestionar una abstracción |
| [03-estructura-repo.md](03-estructura-repo.md) | Layout de monorepo, convenciones de nombres, colocation | Al crear el repo y al añadir carpetas/paquetes |
| [04-convenciones-codigo.md](04-convenciones-codigo.md) | TypeScript, lint/format, manejo de errores, imports, git | Referencia permanente durante implementación |
| [05-datos.md](05-datos.md) | PostgreSQL + Drizzle: schema, migraciones, queries, transacciones | Al tocar cualquier cosa de la capa de datos |
| [06-testing.md](06-testing.md) | Estrategia de testing como feedback loop del agente | Al escribir tests o definir el test boundary de un módulo |
| [07-seguridad-config.md](07-seguridad-config.md) | Env vars, secrets, auth, validación de entrada | Setup inicial y features con superficie de seguridad |
| [08-devops.md](08-devops.md) | Docker, CI/CD, deploy AWS/OCI, observabilidad | Setup de pipeline y despliegue |
| [09-agentes.md](09-agentes.md) | Integración con Claude Code: CLAUDE.md plantilla, carga de contexto | Al configurar el agente en un proyecto nuevo |
| [10-checklist-dia-cero.md](10-checklist-dia-cero.md) | Checklist ejecutable para arrancar un proyecto | El primer día, en orden |
| [11-sistema-specs.md](11-sistema-specs.md) | Sistema de especificaciones: decisiones y porqués (snapshot, capa durable, umbrales) | Ante dudas de si/cómo especificar un trabajo |
| [12-guia-specs.md](12-guia-specs.md) | Guía operativa de specs: estructura, hashing, trazabilidad AC→test, skills, hooks | Al crear, cambiar o cerrar cualquier spec |
| [plantillas/](plantillas/) | Plantillas canónicas: spec, plan, tasks, ADR, architecture, domain, CLAUDE.md | Al instanciar cualquier artefacto |

## Cómo usar esta suite

1. **Al iniciar un proyecto:** instalar el harness (plugin `agent-foundation`: skills + hooks + esta suite) y ejecutar `/init-project`, que copia la suite completa (incluye `plantillas/`) a `docs/foundation/` e instancia CLAUDE.md, docs vivos y `specs/`. Después: [10-checklist-dia-cero.md](10-checklist-dia-cero.md). Ajustar solo lo que el proyecto exija de forma justificada; toda desviación se registra como ADR ([plantillas/plantilla-adr.md](plantillas/plantilla-adr.md)). La maquinaria (skills/hooks) NO se copia: viaja y se actualiza vía plugin; esta copia de docs es un snapshot deliberado.
2. **En el vault de Obsidian:** la copia maestra vive en el vault (patrón LLM Wiki, Layer 2). Las copias en repos son snapshots; si divergen, gana el vault y se propaga hacia abajo.
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

## Ciclo de vida de esta suite

- **Revisión programada:** trimestral, o al cerrar cada proyecto (retro alimenta versión nueva).
- **Versionado:** SemVer en frontmatter. Cambios de decisión = minor; cambios de principio = major.
- **Umbrales de revisión anticipada:** listados por componente en [01-stack.md](01-stack.md).
