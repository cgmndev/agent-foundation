# agent-foundation — Fundación de Ingeniería Agent-First

Meta-repo con la **fundación** reutilizable para proyectos de software desarrollados con
agentes (Claude Code). Es dos cosas a la vez:

1. **La suite de decisiones** — stack, arquitectura, convenciones y sistema de especificaciones.
2. **El harness ejecutable** — un plugin de Claude Code (`agent-foundation`) con skills, hooks de
   enforcement, agente revisor y scripts. La raíz de este repo ES el plugin.

No es una aplicación. El mapa completo de dónde está cada cosa: [CLAUDE.md](CLAUDE.md).

## Mapa rápido

- [`docs/foundation/`](docs/foundation/00-INDICE.md) — la suite (00–14). Empezar por el índice.
- [`docs/foundation/plantillas/`](docs/foundation/plantillas/) — plantillas: spec, plan, tasks, ADR, docs vivos, CLAUDE.md.
- [`skills/`](skills/) · [`agents/`](agents/) · [`hooks/`](hooks/hooks.json) · [`scripts/`](scripts/) — el harness (cada pieza se autodocumenta).
- [`.claude-plugin/`](.claude-plugin/) — manifiesto del plugin y marketplace.

## Usarlo en un proyecto nuevo

```
/plugin marketplace add cgmndev/agent-foundation   (o la ruta local del clon)
/plugin install agent-foundation@agent-foundation
/init-project                               (en el repo nuevo)
```

Maquinaria centralizada (se actualiza vía plugin) · decisiones snapshoteadas por proyecto (deliberado).

## Estado

- Suite v1.5 (2026-07-16, reconciliada con la línea del vault: cosecha ProjectAI + dual-mode) · Harness v0.4.1 · batería de pruebas en verde (47/47).
- **Congelado en features** hasta la validación real (primera feature de un proyecto real por el ciclo completo, checkpoint C1-C6). Solo entran fixes de fricción real.

## Pendiente

1. **Validación real (descongela el resto):** primera feature por `/new-spec → /activate-spec → implementación → /close-spec` en un proyecto real, midiendo C1-C6.
2. Automatizar el scaffold del monorepo — tras 1-2 ejecuciones manuales del checklist.
3. Harness de roles (GERENTE/DEVs) como agentes del plugin — `agents/revisor.md` es la semilla.
4. Migración del contenido a inglés (v2), con poda de docs guiada por la telemetría de lecturas.
