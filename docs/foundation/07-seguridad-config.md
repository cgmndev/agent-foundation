---
doc: seguridad-config
version: 1.7
fecha: 2026-07-22
estado: vigente
tipo: capa-durable
capa: pack
---

# 07 — Seguridad y Configuración

Baseline de seguridad para software de clientes. No es un tratado OWASP: son las reglas que se aplican SIEMPRE, con enforcement donde sea posible.

## Configuración y variables de entorno

- **Config validada al arranque con Zod.** Un único `core/config.ts` que parsea `process.env` con schema; si falta o es inválida una variable, el proceso no arranca (fail fast con mensaje claro). Prohibido `process.env.X` suelto por el código.

```ts
// core/config.ts (patrón)
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  // … todas las variables, sin excepción
});
export const config = EnvSchema.parse(process.env);
```

- `.env.example` siempre actualizado con TODAS las variables documentadas (el agente lo mantiene como parte de "done" de cualquier task que agregue config).
- `.env*` en `.gitignore`; hook del harness bloquea commits que incluyan `.env` o strings con pinta de secreto (deteción de patrones: `AKIA…`, `-----BEGIN`, etc.).

## Secrets

- Local: `.env` fuera de git. Producción: secret manager del proveedor (AWS Secrets Manager / OCI Vault), inyectados como env vars al contenedor. Nunca secretos en imagen Docker, código, logs ni specs.
- Rotación: al menos al cambiar de manos un proyecto (handoff a cliente) y ante cualquier sospecha.
- El agente NUNCA recibe secretos de producción en contexto; los deploys los hace el pipeline (rol DEVOPS del harness).

## Autenticación y autorización

- Auth con better-auth ([01-stack.md](01-stack.md)): sesiones server-side en Postgres, cookies `httpOnly` + `secure` + `sameSite=lax`. Sin JWT en localStorage.
- **CSRF:** las sesiones por cookie exigen defensa activa: verificación de `Origin` en toda mutación (allowlist `trustedOrigins` de better-auth + el CORS estricto de abajo); `sameSite=lax` es la base, no la defensa completa. Webhooks entrantes nunca usan sesión: verifican firma (HMAC del proveedor).
- **Autorización en el servidor, por módulo:** cada route de módulo declara su requisito (middleware `requireAuth` / `requireRole('…')`). Default: TODO endpoint requiere auth; los públicos se marcan explícitamente (`public: true` es visible y greppable, no al revés).
- Roles/permisos del dominio viven en `packages/shared` (el frontend los usa solo para UX; el enforcement es del backend).
- Password hashing y flows (reset, verificación) los provee la librería; no implementar criptografía propia jamás.

## Validación de entrada y salida

- Ya cubierto como regla de stack: **Zod en todo boundary** (HTTP, jobs, webhooks, archivos). Nada entra al service sin parsear.
- Salida: los responses también cumplen schema de `shared` (test de contrato); previene fugas de columnas internas (p. ej. hashes) por spread descuidado — error típico de agente. Regla: nunca `return user`, siempre proyección explícita o `UserResponseSchema.parse(user)`.

## Reglas de aplicación web (baseline)

- **SQL injection:** cubierto por Drizzle/parámetros; SQL crudo siempre con placeholders (`sql` template). String interpolation en queries = defecto bloqueante.
- **XSS:** React escapa por defecto; `dangerouslySetInnerHTML` prohibido salvo ADR con sanitización (DOMPurify).
- **CORS:** allowlist explícita de orígenes por entorno en config; nunca `*` con credentials.
- **Rate limiting:** en endpoints de auth y públicos desde el día uno, y **obligatorio en todo endpoint que encole jobs o dispare llamadas a un LLM** — nunca exponer generación de costo sin límite. Key: `userId` con fallback a IP. Store in-memory es válido en el Perfil B de despliegue (proceso único por instancia); con múltiples instancias, store sobre Postgres.
- **Headers:** `secureHeaders()` de Hono activado en `app.ts`.
- **Uploads:** validar tipo/tamaño server-side, almacenar en object storage (S3/OCI), nunca en el filesystem del contenedor; servir con URLs firmadas.
- **Logs sin PII sensible ni secretos:** redactar (pino `redact`) `password`, `token`, `authorization`, y campos sensibles del dominio.

## Dependencias y supply chain

- `pnpm audit` en CI como job informativo semanal; críticas bloquean release.
- Renovate/Dependabot con PRs agrupadas mensuales ([04-convenciones-codigo.md](04-convenciones-codigo.md)).
- Lockfile commiteado; instalación en CI con `--frozen-lockfile`.

## Datos personales (proyectos con usuarios reales)

- Minimización: no capturar datos que el dominio no exige.
- Borrado: diseñar el "delete de usuario" desde el schema (qué se cascadea, qué se anonimiza) — es carísimo retrofitear.
- Entornos de dev/test con datos sintéticos (seeds); prohibido copiar producción a local sin anonimizar.

## Enforcement (qué es hook/regla, no consejo)

| Regla | Mecanismo |
|---|---|
| Commit con secreto/patrón sensible | Hook PreToolUse + gitleaks en CI |
| `process.env` fuera de `core/config.ts` | Regla Biome (restricted globals) |
| Endpoint sin declaración de auth | Convención + test de contrato que recorre rutas |
| `dangerouslySetInnerHTML` | Regla lint error |
| Deploy/migración a prod por el agente | Permissions deny (solo pipeline/rol DEVOPS) |
