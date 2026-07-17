---
doc: testing
version: 1.5
fecha: 2026-07-16
estado: vigente
tipo: capa-durable
---

# 06 — Estrategia de Testing

El testing tiene aquí doble función: red de seguridad del producto y **feedback loop mecánico del agente**. Un agente con suite rápida y determinista se auto-corrige; sin ella, alucina éxito.

## Decisión central

**Integration-first en el test boundary del módulo.** La unidad de testing por defecto es el módulo completo (service + repo contra Postgres real efímero), no la función aislada con mocks. Pirámide práctica:

| Nivel | Herramienta | Qué cubre | Proporción orientativa |
|---|---|---|---|
| Integración de módulo | Vitest + Testcontainers (Postgres) | Service+repo por el `index.ts` del módulo; el grueso del valor | ~60-70% |
| Unit puro | Vitest | Lógica pura con casos ricos (cálculos, parsing, reglas) — backend y `utils.ts` del frontend; nunca componentes | ~20-30% |
| E2E money paths | Playwright | 3-8 flujos críticos de negocio por la UI real | ~5-10% |
| Contrato | Vitest + schemas Zod de `shared` | Respuestas de la API cumplen el schema | incluido en integración |

**Justificación.** Los módulos profundos tienen un solo boundary estable: testearlo cubre la implementación interna sin acoplarse a ella (el agente puede refactorizar por dentro sin romper 40 tests de mocks). Los mocks pesados son el anti-patrón número uno del testing con agentes: el agente genera tests que verifican el mock, no el comportamiento — "tests que confirman su propio malentendido".

## Reglas duras

1. **Postgres real en integración, siempre.** Testcontainers levanta un Postgres efímero con migraciones aplicadas. Prohibido mockear el repo o usar SQLite "porque es más rápido" (divergencia de dialecto = bugs invisibles). Patrón de rendimiento: **un contenedor por corrida** (globalSetup de Vitest), migraciones aplicadas una vez; el aislamiento por test lo dan transacciones con rollback o truncate — un contenedor por archivo rompe el presupuesto de <30s.
2. **Sin mocks de módulos internos.** Solo se dobla el borde externo del sistema: APIs de terceros (con MSW o fakes locales), clock (`vi.useFakeTimers` o clock inyectado), random.
3. **Tests deterministas o no existen.** Un test flaky se arregla o se borra el mismo día; el feedback loop del agente no tolera ruido binario.
4. **Aislamiento por test:** cada test crea sus datos (factories/builders por entidad en el propio módulo) y corre en transacción con rollback, o contra schema limpio. Nunca dependencias de orden.
5. **Cobertura:** no se persigue porcentaje global. Regla cualitativa: todo comportamiento público de módulo tiene test; todo bugfix agrega el test que lo habría atrapado (regla del harness: PR de fix sin test se rechaza).
6. **Naming:** `describe` = unidad bajo test; `it` = comportamiento en lenguaje de negocio (`it('rechaza órdenes con stock insuficiente')`). Los tests son documentación ejecutable que el agente lee para entender el módulo.
7. **Frontend: cero tests de componentes UI.** Prohibido React Testing Library, `render()`, `fireEvent`/`userEvent` y montar componentes en Vitest/jsdom. Vitest en frontend es solo para lógica pura (`features/*/utils.ts`); el comportamiento real se valida con Playwright. La confianza viene del tipado end-to-end + validación Zod isomórfica + E2E — testear renders frena la iteración sin atrapar bugs reales.

## El loop del agente (workflow obligatorio)

1. Al tomar una task: correr `pnpm test -- <modulo>` para línea base verde.
2. **Features nuevas: Test-Last (integration-focused).** Implementar el slice hasta que compile y cumpla el contrato; recién entonces escribir los tests de integración *leyendo el código real* — escribir tests antes de que exista la API es el modo de fallo clásico del agente (alucina APIs y luego las "confirma"). Los criterios de aceptación (AC-NN) del spec se mapean 1:1 a tests con el ID en el nombre al cerrar la task (convención en [12-guia-specs.md](12-guia-specs.md) §3).
   **Bugs y regresiones: Test-First estricto.** La API ya existe, no hay riesgo de alucinación: primero el test de integración que reproduce el error (debe fallar), luego la corrección hasta que pase.
3. Cierre de task: `pnpm check && pnpm test` completos. Una task no está "done" con tests rojos o tipos rotos — sin excepciones, y el hook del harness lo verifica.
4. **Review de tests en contexto fresco:** los tests generados por el agente los revisa un humano (o una sesión de review separada) contra el spec, nunca la misma sesión que los escribió. Foco: ¿el test verifica el requisito o la implementación?

## E2E money paths (Playwright)

- Solo money paths: login, flujo principal de valor, creación del recurso central y —si existe— el ciclo asíncrono completo (disparar job → polling → estado final). No es cobertura de UI exhaustiva.
- APIs externas costosas (LLM, storage) se interceptan a nivel de red dentro del test; el resto del sistema es real.
- Corre contra la app levantada con seeds ([05-datos.md](05-datos.md)) en CI antes de deploy.
- Selectores por rol/testid estables (`data-testid`), nunca por texto de estilo o clases CSS.

## Qué NO hacer

| Anti-patrón | Daño |
|---|---|
| Mockear el repo en tests de service | Testea el wiring, no el comportamiento; se rompe en cada refactor |
| Snapshot testing masivo de componentes | Ruido; el agente los regenera sin mirar ("snapshot updated" ≠ correcto) |
| Tests de componentes UI (RTL, render + fireEvent) | Verifican el render, no el negocio; el agente los produce en volumen y dan falsa confianza |
| Tests de implementación (espiar llamadas internas) | Congela la implementación; bloquea el refactor del agente |
| Perseguir 100% coverage | Genera tests triviales que inflan la suite y el contexto |
| Suites lentas (>2-3 min local) | El agente deja de correrlas; el loop muere. Presupuesto: integración de un módulo <30s |
