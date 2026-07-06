---
type: adr
id: NNNN                 # secuencial, cuatro dígitos: 0001, 0002...
title: <decisión en una frase>
status: accepted         # proposed | accepted | superseded
date: AAAA-MM-DD
supersedes: null         # id de ADR anterior si lo reemplaza
superseded_by: null
origin: null             # spec de origen si nació de un /close-spec, ej. specs/archive/2026-07/2026-07-feature-x
tags: []
---

# ADR NNNN — <Título: la decisión en una frase>

<!--
REGLAS:
- Los ADRs son INMUTABLES una vez accepted. Si la decisión cambia,
  se escribe un ADR nuevo con supersedes: apuntando a este, y aquí
  solo se actualiza superseded_by + status.
- Máximo 1 página. Un ADR largo suele esconder dos decisiones.
- Capturar el contexto DEL MOMENTO: qué sabíamos, qué restricciones
  había. Es lo que hace valioso el ADR años después.
-->

## Contexto

<!-- 1-2 párrafos: la situación y las fuerzas en juego cuando se tomó
la decisión. Qué problema obligaba a decidir. -->

## Decisión

<!-- 1 párrafo, en presente afirmativo: "Usamos X para Y". -->

## Alternativas consideradas

<!-- Lista breve: alternativa → por qué se descartó. Suficiente para
que un futuro tú (o un agente) no re-proponga lo ya descartado sin
nueva información. -->

- **Alternativa A**: descartada porque...
- **Alternativa B**: descartada porque...

## Consecuencias

<!-- Las positivas Y las negativas asumidas. Qué se vuelve más fácil,
qué se vuelve más difícil, qué deuda se acepta conscientemente. -->

**Positivas:**
- ...

**Negativas / deuda asumida:**
- ...

## Señales de revisión

<!-- Opcional pero recomendado: qué condiciones futuras deberían
disparar reconsiderar esta decisión (ej. "si el volumen supera X",
"si la librería Y deja de mantenerse"). -->
