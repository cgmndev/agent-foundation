---
type: plan
format: 1                # versión del formato del artefacto; los skills la verifican (12-guia §2)
feature: <slug-kebab-case>
status: draft            # draft | active | stale
version: 1.0
created: AAAA-MM-DD
updated: AAAA-MM-DD
spec: ./spec.md
spec_hash: null          # copia del source_hash de la spec al generar este plan
---

# Plan — <Nombre de la feature>

<!--
REGLAS:
- SOLO el CÓMO. El QUÉ vive en spec.md y no se repite aquí.
- Se genera leyendo: spec.md + docs/architecture.md + ADRs relevantes.
- Si spec_hash ≠ source_hash actual de la spec → este plan está stale
  y no es base válida para implementar (drift-check lo señala).
- Este es el documento donde el review humano aporta más valor:
  revisar trade-offs con calma.
-->

## 1. Enfoque técnico

<!-- 2-4 párrafos: la estrategia general de implementación y por qué
este camino y no otro. -->

## 2. Decisiones y trade-offs

<!-- Tabla o lista. Cada decisión no trivial con las alternativas
consideradas y el porqué. Marcar con [ADR?] las que podrían merecer
un ADR al cerrar la feature. -->

| Decisión | Alternativas consideradas | Razón | ¿ADR? |
|---|---|---|---|
| ... | ... | ... | no |

## 3. Superficie de cambio

<!-- Módulos, rutas y archivos que se tocarán. Crítico para:
(a) paralelización — comparar superficies entre specs activas,
(b) review del diff final contra lo declarado. -->

- `apps/api/src/modules/<x>/` — <qué cambia>
- `apps/web/src/features/<y>/` — <qué cambia>
- `packages/shared`: <schemas de contrato nuevos o cambiados>
- Esquema BD (`packages/db`): <migraciones sí/no, tablas afectadas>

## 4. Impacto en la capa durable

<!-- Responder explícitamente, aunque sea "ninguno": -->
- ¿Cambia la arquitectura documentada en `docs/architecture.md`? 
- ¿Introduce/cambia conceptos de dominio para `docs/domain.md`?
- ¿Contradice algún ADR vigente? (si sí → parar y resolver antes)

## 5. Estrategia de testing (mapeo AC → tests)

<!-- Cada AC de la spec con su test planificado. Los tests se escriben
antes o junto a la task correspondiente, nunca al final. -->

| AC | Test planificado | Tipo | Ubicación |
|----|------------------|------|-----------|
| AC-01 | `describe("AC-01: ...")` | integration | `src/.../x.test.ts` |
| AC-02 | ... | unit | ... |

## 6. Riesgos y mitigaciones

<!-- Técnicos: rendimiento, migraciones, integraciones externas,
puntos sin vuelta atrás. Con mitigación o plan B para cada uno. -->

## 7. Orden de ejecución propuesto

<!-- Fases de alto nivel que tasks.md descompondrá. Señalar
dependencias duras y qué se puede paralelizar. -->
