---
doc: devops
version: 1.1
fecha: 2026-07-06
estado: vigente
tipo: capa-durable
---

# 08 — DevOps, Despliegue y Observabilidad

Pipeline y operación estándar. Objetivo: deploy aburrido, reproducible y con el mínimo de piezas — coherente con monolito modular y equipos de 1-3 personas.

## Entornos

| Entorno | Propósito | Datos |
|---|---|---|
| local | Desarrollo (docker-compose: Postgres + servicios) | Seeds sintéticos |
| staging | Validación pre-release y demos a cliente | Sintéticos o anonimizados |
| production | Cliente | Reales, acceso restringido |

- Paridad: misma imagen Docker en staging y production; solo cambian env vars/secrets.
- Staging es obligatorio en proyectos de cliente; los demos NUNCA contra production.

## Build y contenedor

- **Docker multi-stage:** stage 1 con Bun (`oven/bun`) para `bun install --frozen-lockfile` + build; stage final `node:<LTS>-slim` que solo copia `dist/` + `node_modules` de producción. Usuario non-root, `NODE_ENV=production`.
- El frontend se sirve como estáticos (S3+CloudFront / OCI Object Storage+CDN) o desde el propio contenedor vía Hono `serveStatic` en proyectos pequeños — decisión por proyecto, default: estáticos en CDN.
- Imagen etiquetada con SHA de commit; `latest` no existe en producción.
- Healthcheck: endpoint `GET /health` (liveness: proceso vivo) y `GET /ready` (readiness: DB alcanzable) desde el día uno.
- Graceful shutdown: manejar `SIGTERM` (cerrar server, drenar pool de DB) en `main.ts`.

## CI/CD (GitHub Actions como default)

Pipeline en cada PR (todo bloqueante):

```
install (frozen) → check (biome + tsc) → test (unit+integración con Postgres service/Testcontainers) → build
```

En merge a `main`:

```
pipeline PR completo → build imagen → push registry → deploy a staging → migraciones → e2e smoke (Playwright vs staging) → [aprobación manual] → deploy production → migraciones
```

**Reglas:**
- Las migraciones las ejecuta el pipeline como paso previo al deploy de la app (job dedicado), nunca la app al arrancar ni un humano/agente a mano.
- Deploy a production con aprobación manual (environment protection) mientras el equipo sea pequeño; automatizar solo con suite E2E madura.
- Rollback = redeploy de la imagen anterior (por eso las migraciones son expand-and-contract: la imagen N-1 debe funcionar con el schema N).
- El agente puede editar workflows en PR, pero no tiene credenciales de deploy (separación harness: rol DEVOPS).

## Infraestructura (AWS / OCI)

**Default AWS (proyecto tipo):** ECS Fargate (1-2 tasks) + ALB, RDS PostgreSQL (single-AZ para MVP, multi-AZ al pasar a crítico), S3+CloudFront para frontend, Secrets Manager, ECR.

**Default OCI (cuando el cliente es OCI o manda costo):** Container Instances u OKE mínimo, OCI Database with PostgreSQL, Object Storage + CDN, Vault, OCIR. OCI suele ganar en costo de egress y cómputo para clientes sensibles a precio — criterio comercial válido.

**Reglas:**
- IaC desde el inicio con **Terraform/OpenTofu** en `infra/` del propio repo (monorepo). Alcance pragmático: red mínima, servicio, DB, secrets. ClickOps solo para explorar; lo que queda, se codifica.
- Un solo módulo IaC reutilizable entre proyectos (vive en el vault/plantilla, se copia y ajusta): el objetivo es que levantar el proyecto N+1 sea <1 día de infra.
- Dominios + TLS gestionados (ACM / OCI Certificates); HTTP redirige a HTTPS siempre.

## Observabilidad

- **Logs:** pino JSON a stdout → CloudWatch / OCI Logging. Campos estándar en todo log: `level`, `time`, `module`, `requestId`, `userId` (si hay sesión). Middleware de request logging con duración y status.
- **`requestId` end-to-end:** generado en el edge/middleware, propagado en headers y logs; es la herramienta número uno de debugging distribuido barato.
- **Errores:** Sentry (backend + frontend) con release = SHA. Alertas: error rate y nuevos issues a canal del proyecto.
- **Métricas/APM:** OTel + backend del proveedor solo cuando el SLA del cliente lo pida (ADR); para MVPs, logs estructurados + Sentry + métricas del ALB/RDS bastan.
- **Alertas mínimas de infra:** CPU/memoria del servicio, conexiones y storage de RDS, 5xx rate del ALB. Pocas y accionables; una alerta que se ignora dos veces se elimina o se arregla.

## Operación con agentes (integración con el harness)

- El agente SÍ puede: leer logs de staging (vía CLI/MCP acotado), proponer cambios de IaC en PR, diagnosticar con `docker compose` local.
- El agente NO puede (deny rules): credenciales de production, ejecutar migraciones fuera de local, tocar secret managers, `terraform apply`.
- Runbook por proyecto (`docs/runbook.md`, 1 página): cómo deployar, rollback, restore de backup, contactos. Es también contexto cargable para el agente en incidentes.

## Checklist go-live (resumen)

- [ ] Backups automáticos verificados con un restore real
- [ ] Alertas mínimas conectadas a canal visible
- [ ] Secrets rotados y fuera de todo historial
- [ ] `robots.txt`/indexación correcta según el caso
- [ ] Runbook escrito y probado por alguien que no lo escribió
- [ ] Carga básica probada (k6/autocannon contra staging) con margen 3-5x el tráfico esperado
