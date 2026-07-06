---
type: living-doc
doc: architecture
status: active
updated: AAAA-MM-DD      # bump en cada edición; es el indicador de frescura
line_budget: 500         # tripwire: superarlo = documentar de más
---

# Arquitectura — <Proyecto>

<!--
REGLAS DE ESTE DOCUMENTO:
- Es UNO de los DOS únicos documentos vivos del repo (junto a domain.md).
- Describe el estado ACTUAL, nunca la historia (la historia vive en los
  ADRs) ni el futuro (el futuro vive en specs).
- < 500 líneas. Si crece más: o hay historia que mover a ADRs, o hay
  detalle que pertenece al propio código.
- Se edita solo vía propuesta de diff (regla 4 del CLAUDE.md) o en el
  ritual /close-spec.
- Audiencia: agentes y devs que llegan sin contexto. Optimizar para
  "leer esto y poder trabajar".
-->

## 1. Visión en un párrafo

<!-- Qué es el sistema, para quién, y la forma general de la solución. -->

## 2. Stack

<!-- Tabla corta: capa → tecnología → nota de uso. El PORQUÉ de cada
elección no va aquí: va en su ADR (enlazar). -->

| Capa | Tecnología | Nota | ADR |
|---|---|---|---|
| <capa> | <tecnología> | <nota de uso> | [NNNN](decisions/NNNN-slug.md) |
| ... | ... | ... | ... |

<!-- Solo las DESVIACIONES del stack default (docs/foundation/01-stack.md)
llevan ADR propio; el default se referencia, no se re-documenta. -->

## 3. Estructura de módulos

<!-- El mapa de src/: qué módulo hace qué, y las reglas de dependencia
entre capas (qué puede importar qué). Esta sección es la más valiosa
para un agente. -->

## 4. Patrones y convenciones

<!-- Los patrones que el código sigue de verdad: manejo de errores,
validación en boundaries (Zod), acceso a datos, naming. Solo patrones
vigentes; los abandonados se documentan en el ADR que los reemplazó. -->

## 5. Integraciones externas

<!-- Servicios de terceros: cuál, para qué, dónde vive su cliente/
wrapper en el código, y dónde están las credenciales (referencia,
nunca valores). -->

## 6. Límites conocidos

<!-- Restricciones conscientes del diseño actual: qué NO soporta el
sistema hoy y es intencional. Evita que agentes "arreglen" límites
que son decisiones. -->
