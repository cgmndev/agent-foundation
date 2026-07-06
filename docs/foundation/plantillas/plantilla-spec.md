---
type: spec
format: 1                # versión del formato del artefacto; los skills la verifican (12-guia §2)
feature: <slug-kebab-case>
status: draft            # draft | active | implemented | superseded
version: 1.0
created: AAAA-MM-DD
updated: AAAA-MM-DD
author: <nombre>
stakeholders: []         # ej. [cliente-x, equipo-backend]
source_hash: null        # SHA-256 del contenido (sin frontmatter) al pasar a active
supersedes: null         # ruta a spec anterior si esta la reemplaza
superseded_by: null      # se completa solo si esta spec es invalidada
---

# Spec — <Nombre de la feature en lenguaje de negocio>

<!--
REGLAS DE ESTA PLANTILLA:
- Máximo 3 páginas. Si no cabe, la feature es demasiado grande: partirla.
- SOLO el QUÉ y el POR QUÉ. Prohibido: nombres de archivos, librerías,
  endpoints, esquemas de BD, decisiones técnicas. Todo eso va en plan.md.
- Lenguaje de negocio: el cliente no técnico debe poder leerla completa.
- No puede pasar a status: active con preguntas abiertas sin resolver.
-->

## 1. Contexto y problema (POR QUÉ)

<!-- 2-4 párrafos. Qué problema de negocio o de usuario existe hoy, a quién
afecta, qué coste tiene no resolverlo. Sin proponer solución todavía. -->

## 2. Objetivo (QUÉ)

<!-- 1 párrafo. Qué será verdad cuando esto esté hecho, en términos
observables por el usuario/negocio. Medible si es posible. -->

## 3. Alcance

### Incluye
<!-- Lista corta de capacidades que esta feature entrega. -->

### No incluye (explícito)
<!-- Tan importante como lo anterior. Lo que alguien podría asumir que
entra y NO entra. Protege contra scope creep y ancla al agente. -->

## 4. Acceptance Criteria

<!-- IDs estables AC-NN. Nunca se renumeran ni reutilizan. Si se elimina
uno en una versión posterior: tacharlo (~~AC-04~~ [eliminado v1.1]), no
borrarlo. Cada AC debe ser verificable. Formato Given/When/Then opcional
cuando aporte claridad. -->

| ID | Criterio | Verificación |
|----|----------|--------------|
| AC-01 | <comportamiento observable y verificable> | test |
| AC-02 | ... | test |
| AC-03 | ... | manual (justificar) |

## 5. Restricciones y supuestos

<!-- Restricciones de negocio (plazos, normativa, presupuesto de servicios
externos) y supuestos que, de romperse, invalidan la spec. -->

## 6. Preguntas abiertas

<!-- DEBE quedar vacía antes de pasar a active. Mientras haya preguntas,
status: draft. -->

## Changelog

<!-- Solo se usa si la spec cambia estando active (protocolo mid-feature). -->
- 1.0 (AAAA-MM-DD): versión inicial aprobada.
