---
doc: devops
version: 1.5
fecha: 2026-07-16
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
- Staging es obligatorio en proyectos de cliente; los demos NUNCA contra production. (En el Perfil B, staging = instancia "demo" propia en el mismo Coolify.)

## Dos perfiles de despliegue (decisión de kickoff)

**El Perfil B (VPS + Coolify) es el default de la práctica**, alineado con el modelo de negocio (instancias dedicadas por cliente, costo por instancia como driver, operación de 1-3 personas): un solo flujo operativo que se domina a fondo. El Perfil A es la excepción documentada y se activa solo con gatillo explícito: cliente ya en AWS/OCI, requisito de compliance, o SLA formal que exija servicios gestionados. La elección se registra como ADR-000 junto al modelo de tenancy (multi-tenant vs instancia dedicada single-tenant):

| | **Perfil A — Cloud gestionado** | **Perfil B — VPS + Coolify (single-tenant)** |
|---|---|---|
| Cuándo | SLA formal, escala variable, cliente ya en AWS/OCI, compliance | Instancias dedicadas por cliente, costo por instancia como driver, operación 1-3 personas |
| Cómputo | ECS Fargate / OCI Container Instances | VPS (Hetzner/DO/EC2) con Coolify (panel + engine) |
| Postgres | RDS / OCI Database gestionado | Contenedor en el compose, **sin `ports:` al host** |
| CD | Pipeline: staging → aprobación → prod | Webhook de Coolify: merge a `main` → build → rolling update |
| Migraciones | Job del pipeline, previo al deploy | Al arranque del contenedor, antes de que `/health` responda |
| Secrets | Secrets Manager / OCI Vault | Panel de Coolify (nunca en repo) |
| TLS / routing | ALB + ACM | Traefik/Caddy de Coolify (Let's Encrypt automático) |
| Backups | Snapshots del servicio gestionado | Contenedor `pg-backup` (pg_dump programado) → bucket externo |

### Reglas del Perfil B

- **Rolling update con gate de healthcheck:** el contenedor nuevo se levanta en paralelo; `/health` hace deep check (SELECT 1 a Postgres); solo con 200 el proxy redirige tráfico y el viejo recibe SIGTERM. Si falla, el nuevo se destruye y el viejo sigue sirviendo: rollback automático, deploy invisible.
- **Migraciones on-boot exigen backward-compatibility estricta:** durante el rolling update el contenedor viejo corre contra el schema ya migrado. Aquí expand-and-contract no es recomendación, es obligatorio (agregar columnas con DEFAULT es seguro; renombrar/eliminar es siempre dos deploys).
- **Backups fuera del VPS, sin excepción:** `pg-backup` sube dumps a un bucket S3-compatible externo (otra región u otro proveedor). Retención: 7 diarios / 4 semanales / 12 mensuales, con restore verificado. El bucket de backups jamás comparte punto de fallo físico con la app.
- **Postgres solo en red interna de Docker:** un compose con `ports:` en el servicio de base de datos se rechaza en review (regla también para el agente).
- Sentry con un DSN por instancia (aísla errores por cliente); los logs pino a stdout se consultan en Coolify buscando por `correlationId`.
- El mismo código y compose deben poder migrar una instancia del Perfil B al A si el cliente crece: la portabilidad es requisito de diseño, no accidente.

## Build y contenedor

- **Docker multi-stage:** una sola familia de imágenes `node:<LTS>-slim`. Stage de build: pnpm instalado explícitamente con versión pinneada (sin corepack) + `pnpm install --frozen-lockfile` (con cache del store montada) + build; stage final: solo `dist/` + dependencias de producción (`pnpm deploy --prod` o prune). Usuario non-root, `NODE_ENV=production`.
- El frontend en modo SPA (default) se sirve como estáticos (S3+CloudFront / OCI Object Storage+CDN) o desde el propio contenedor vía Hono `serveStatic` en proyectos pequeños — default: estáticos en CDN. Si un proyecto habilita SSR con TanStack Start (ADR), la web se despliega como segundo contenedor Node por el mismo pipeline.
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
- Migraciones según perfil: en A las ejecuta el pipeline como job previo al deploy; en B se ejecutan al arranque del contenedor antes de responder `/health`. En ambos: expand-and-contract, nunca a mano, nunca por el agente.
- Deploy a production con aprobación manual (environment protection) mientras el equipo sea pequeño; automatizar solo con suite E2E madura.
- Rollback = redeploy de la imagen anterior (por eso las migraciones son expand-and-contract: la imagen N-1 debe funcionar con el schema N).
- El agente puede editar workflows en PR, pero no tiene credenciales de deploy (separación harness: rol DEVOPS).

## Infraestructura — Perfil A (cloud gestionado, AWS / OCI)

**Default AWS (proyecto tipo):** ECS Fargate (1-2 tasks) + ALB, RDS PostgreSQL (single-AZ para MVP, multi-AZ al pasar a crítico), S3+CloudFront para frontend, Secrets Manager, ECR.

**Default OCI (cuando el cliente es OCI o manda costo):** Container Instances u OKE mínimo, OCI Database with PostgreSQL, Object Storage + CDN, Vault, OCIR. OCI suele ganar en costo de egress y cómputo para clientes sensibles a precio — criterio comercial válido.

**Reglas:**
- IaC desde el inicio con **Terraform/OpenTofu** en `infra/` del propio repo (monorepo). Alcance pragmático: red mínima, servicio, DB, secrets. ClickOps solo para explorar; lo que queda, se codifica.
- Un solo módulo IaC reutilizable entre proyectos (vive en el vault/plantilla, se copia y ajusta): el objetivo es que levantar el proyecto N+1 sea <1 día de infra.
- Dominios + TLS gestionados (ACM / OCI Certificates); HTTP redirige a HTTPS siempre.

## Observabilidad

- **Logs:** pino JSON a stdout → CloudWatch / OCI Logging (Perfil A) o logs de contenedor en Coolify (Perfil B). Campos estándar en todo log: `level`, `time`, `module`, `correlationId`, `userId` (si hay sesión). Middleware de request logging con duración y status.
- **`correlationId` end-to-end:** el middleware lo respeta si llega en `x-correlation-id` o genera uno nuevo; se propaga en el header de respuesta, en todos los logs (`logger.child`) y en todo payload de pg-boss (obligatorio vía `baseJobPayloadSchema`). Un solo ID traza request → job → llamada externa: la herramienta número uno de debugging barato.
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
