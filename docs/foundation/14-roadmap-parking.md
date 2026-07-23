---
doc: roadmap-parking
version: 1.7
fecha: 2026-07-22
estado: vigente
tipo: capa-durable
capa: metodo
---

# 14 — Plantilla: Roadmap-Parking de Evoluciones

Cada proyecto crea `docs/roadmap.md` desde esta plantilla el día cero. Es el **estacionamiento de evoluciones futuras**: captura las buenas ideas que quedan fuera de alcance para que dejen de competir con el trabajo actual — y para que el agente tenga un lugar donde ponerlas que no sea el código.

## Reglas del parking

1. **Nada de lo listado se implementa** hasta que su trigger se cumpla y se apruebe formalmente (spec nuevo o ADR).
2. **Cero andamiaje anticipatorio.** La arquitectura no debe cerrarse puertas a estas evoluciones, pero tampoco preparar nada para ellas: cero imports, cero archivos, cero abstracciones "para cuando llegue". Andamiaje anticipatorio detectado en review es defecto.
3. **El agente registra aquí, no implementa.** Cuando durante una task surge una mejora fuera del alcance del spec activo, la salida correcta es una fila en este documento — no código, no un TODO, no una "pequeña preparación".
4. **Triggers medibles.** Cada entrada define el umbral observable que la activa. "Sería bueno tener X" no es un trigger; "p95 > 800ms con Postgres ya optimizado" sí lo es.
5. **Revisión periódica:** al cierre de cada spec (`/close-spec`) y en la retro de proyecto. Entradas con trigger cumplido → spec nuevo; entradas muertas → se eliminan (el parking no es un museo).

## Formato

```markdown
# Roadmap Evolutivo — <Proyecto>

**Propósito:** estacionamiento de evoluciones futuras.
**Nada de lo descrito aquí se implementa en el alcance actual.**

| # | Área | Trigger de activación (medible) | Candidata | Notas |
|---|---|---|---|---|
| 1 | <área> | <umbral observable> | <tecnología/patrón> | <riesgos, dependencias> |

**Orden sugerido de activación:** <si existe dependencia entre entradas>
```

## Ejemplos de entradas bien formadas

| # | Área | Trigger de activación | Candidata |
|---|---|---|---|
| 1 | Cache dedicada | p95 de lecturas calientes sobre objetivo con Postgres ya optimizado (índices + queries revisadas) | Redis |
| 2 | Tiempo real | Requisito confirmado de latencia sub-segundo (colaboración en vivo, chat operativo) | WebSockets vía ADR (excepción a short-polling) |
| 3 | Cola externa | Throughput sostenido que pg-boss no cubre, con métricas en mano | SQS / RabbitMQ |
| 4 | Observabilidad auto-hospedada | Capa gratuita de Sentry agotada o requisito de data residency del cliente | Grafana + Loki |
| 5 | SSR / SEO | Requisito real de contenido público indexable | Habilitar SSR de TanStack Start (ADR) |

Las entradas de ejemplo ilustran el formato; cada proyecto arranca con el parking vacío y lo puebla con lo que su dominio genere.

## Relación con el resto de la suite

Los **umbrales de revisión** de [01-stack.md](01-stack.md) y [02-arquitectura.md](02-arquitectura.md) son el parking de la capa durable (aplican a todos los proyectos); `docs/roadmap.md` es el parking del proyecto concreto. Si una entrada de proyecto se repite en 2-3 proyectos, es candidata a subir como umbral de la fundación (versionar la suite).
