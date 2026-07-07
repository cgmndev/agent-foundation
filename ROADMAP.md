# Roadmap — agent-foundation

Trabajo abierto del repo, en orden. El punto 1 **descongela el resto** (ver la regla de
"congelado en features" en `CLAUDE.md`). Los *porqués* de cada decisión viven en
`docs/foundation/` y en `git log`; esto es solo la lista de qué falta.

## Pendientes

1. **Validación real** — primera feature de un proyecto real por el ciclo completo
   `/new-spec → /activate-spec → implementación → /close-spec`, midiendo el checkpoint C1-C6
   (`docs/foundation/11-sistema-specs.md`). Ocurre en OTRO repo, no aquí. Es lo que descongela
   el resto.
2. **Scaffold del monorepo automatizado** — tras 1-2 ejecuciones manuales del checklist día-cero.
3. **Harness de roles** (GERENTE / DEVs) como agentes del plugin (semilla: `agents/revisor.md`).
4. **Migración del contenido a inglés** (v2) + poda de docs guiada por la telemetría de lecturas
   (`.git/agent-foundation-doc-reads.log`).
5. **Integración SSR** (al scaffoldear el 1er proyecto SSR con TanStack Start) — validar en
   código la base URL isomórfica + el forward de la cookie de sesión (better-auth) en loaders
   server-side; evaluar una nota de deploy SSR en `08-devops`. La regla ya vive en `01-stack`
   §Frontend y en el checklist día-cero; falta la validación real. No usar server functions de
   Start para datos de dominio.
