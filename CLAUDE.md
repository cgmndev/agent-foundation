# Fundación Agent-First (meta-repo)

Este repo ES dos cosas: la **suite de decisiones** (`docs/foundation/`) y el **harness ejecutable** — un plugin de Claude Code llamado `agent-foundation` (skills + hooks + agente revisor + scripts) cuya raíz es este mismo repo. No es una aplicación.

## Mapa — dónde está cada cosa

| Qué | Dónde | Su documentación |
|---|---|---|
| Decisiones y convenciones (00–12) | `docs/foundation/` | `00-INDICE.md` |
| Plantillas de artefactos (spec, plan, tasks, ADR, docs vivos, CLAUDE.md) | `docs/foundation/plantillas/` | `12-guia-specs.md` |
| Manifiesto del plugin + marketplace | `.claude-plugin/` | sí mismo |
| Skills (workflows: specs, scaffolding, review, init) | `skills/<nombre>/SKILL.md` | cada SKILL.md ES su doc |
| Hooks (wiring de eventos) | `hooks/hooks.json` → `scripts/hooks/` | cabecera de cada script |
| Guardias (una preocupación por archivo) | `scripts/guards/*.mjs` | cabecera-contrato de cada uno |
| CLIs compartidos (hashing, trazabilidad AC→test) | `scripts/spec-hash.mjs` · `scripts/check-acs.mjs` | cabecera (uso) |
| Batería de pruebas del harness | `scripts/test-harness.sh` | sí misma (40 aserciones) |
| Agente revisor (review en contexto fresco) | `agents/revisor.md` | sí mismo |
| Settings baseline para proyectos nuevos | `templates/settings.json` | `09-agentes.md` |
| Specs de ESTE repo (self-hosted) | `specs/active/` · `specs/archive/` | `12-guia-specs.md` |

Regla de documentación: **la implementación se autodocumenta** (frontmatter de skills, cabeceras-contrato de scripts); este archivo solo mapea. No crear manuales paralelos que dupliquen contenido.

## Usar el harness en un proyecto (transportabilidad)

1. `/plugin marketplace add cgmndev/agent-foundation` (o la ruta local del clon, para desarrollo)
2. `/plugin install agent-foundation@agent-foundation`
3. En el repo nuevo: `/init-project` — copia la suite a `docs/foundation/`, instancia CLAUDE.md, docs vivos, `specs/` y `.claude/settings.json`.

Qué se centraliza vs qué se copia: la **maquinaria** (skills/hooks/scripts/agente) vive AQUÍ y viaja por plugin — un fix se propaga con bump de versión + `/plugin update`. Las **decisiones y plantillas** se snapshotean a cada proyecto — un proyecto no cambia de contrato porque el plugin se actualizó.

## Desarrollar el harness

- Probar cambios en vivo: `claude --plugin-dir .` (si tu versión no lo soporta: marketplace local + reinstalar).
- Probar un guardia a mano: `echo '<payload-json>' | node scripts/hooks/pre-tool-use.mjs; echo $?` — hay payloads de ejemplo en la cabecera de cada guardia. Exit 2 = deny; JSON con `permissionDecision` = ask.
- Batería completa de pruebas: `bash scripts/test-harness.sh` (40 aserciones contra un fixture temporal; correrla tras cualquier cambio en scripts/).
- Scripts: Node puro ≥20, **cero dependencias** (portabilidad), código en inglés, mensajes al usuario en español (04-convenciones §Idioma).
- Todo cambio de comportamiento del harness = bump de `version` en `.claude-plugin/plugin.json` (SemVer). Si toca doctrina, actualizar también el doc de fundación correspondiente en el mismo cambio.

## Reglas de este repo

- `docs/foundation/` es la copia maestra que heredan todos los proyectos: se edita proponiendo diff al usuario, nunca de oficio.
- Cambios grandes del harness o de la suite → spec en `specs/active/` (este repo se gestiona con su propio sistema).
- Los hashes de specs los escribe SOLO `scripts/spec-hash.mjs` (vía skills). Los ADRs de este repo van en `docs/decisions/` cuando exista la primera desviación.
- Si un skill muestra `${CLAUDE_PLUGIN_ROOT}` sin expandir: es la raíz de la instalación del plugin; dentro de este repo equivale a `.`.
