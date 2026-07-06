# agent-foundation — Fundación de Ingeniería Agent-First

Meta-repo con la **fundación** reutilizable para proyectos de software desarrollados con
agentes (Claude Code). Es dos cosas a la vez:

1. **La suite de decisiones** — stack, arquitectura, convenciones y sistema de especificaciones.
2. **El harness ejecutable** — un plugin de Claude Code (`agent-foundation`) con skills, hooks de
   enforcement, agente revisor y scripts. La raíz de este repo ES el plugin.

No es una aplicación. El mapa completo de dónde está cada cosa: [CLAUDE.md](CLAUDE.md).

## Mapa rápido

- [`docs/foundation/`](docs/foundation/00-INDICE.md) — la suite (00–12). Empezar por el índice.
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

- Suite unificada v1.1 (2026-07-06) · Harness v0.1.0 (40/40 pruebas en verde).

## Pendiente

1. Automatizar el scaffold del monorepo (Fase 1 del checklist) como skill o template repo.
2. Integrar el harness de roles (GERENTE/DEVs) como agentes del plugin — `agents/revisor.md` es la semilla.
3. Migración completa del contenido de la suite a inglés (v2; los identificadores y rutas ya lo están).
