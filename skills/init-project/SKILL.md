---
name: init-project
description: Instanciar la fundación en un proyecto nuevo - copia docs/foundation, crea CLAUDE.md, docs vivos (architecture/domain), specs/, decisions/ y .claude/settings.json. Usar en un repo nuevo o vacío con el plugin agent-foundation instalado.
argument-hint: [nombre-del-proyecto]
---

# /init-project — día cero, parte mecánica

Ejecuta la parte automatizable de `docs/foundation/10-checklist-dia-cero.md` (Fase 0 y arranque de la Fase 2). NO scaffoldea el monorepo (eso es Fase 1, guiada por el checklist con el usuario).

## Pasos

1. **Seguridad:** confirma que el cwd es la raíz del proyecto destino y que NO existe ya `docs/foundation/` (si existe: proyecto ya inicializado — aborta y ofrece comparar versiones de la suite en su lugar).
2. **Entrevista mínima:** nombre del proyecto, cliente, una frase de qué es y para quién, y cloud (AWS/OCI) si ya se sabe.
3. **Copia la suite** (snapshot: las decisiones del proyecto quedan congeladas a esta versión, por diseño):
   ```bash
   mkdir -p docs && cp -R "${CLAUDE_PLUGIN_ROOT:-.}/docs/foundation" docs/
   ```
4. **Estructura:** `mkdir -p specs/active specs/archive docs/decisions` (+ `.gitkeep` en las vacías).
5. **Instancia desde `docs/foundation/plantillas/`:**
   - `CLAUDE.md` ← `plantilla-claude.md`: elimina el bloque de instrucciones de la plantilla, rellena los `<>` con lo entrevistado.
   - `docs/architecture.md` ← `plantilla-architecture.md`: `updated:` hoy; secciones con lo decidido HASTA HOY, sin especular.
   - `docs/domain.md` ← `plantilla-domain.md`: entrevista 5–15 términos del glosario inicial con el usuario (es el documento más rentable del proyecto para el agente — no lo dejes vacío).
6. **Config del harness:** copia `"${CLAUDE_PLUGIN_ROOT:-.}/templates/settings.json"` a `.claude/settings.json` (si ya existe, mergea los `deny` sin duplicar).
7. **`.gitignore`** baseline si falta: `node_modules/`, `.env`, `.env.*`, `!.env.example`, `dist/`, `coverage/`, `.DS_Store`.
8. **Git:** si no hay repo, pregunta si inicializar (`git init -b main` + commit inicial `chore: bootstrap agent-foundation` — solo tras confirmación).
9. **Reporte y siguientes pasos:** qué se creó, y el puntero a Fase 1 del checklist (scaffold del monorepo) + primer spec con `/new-spec` (walking skeleton).
