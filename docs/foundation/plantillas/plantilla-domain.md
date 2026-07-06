---
type: living-doc
doc: domain
status: active
updated: AAAA-MM-DD      # bump en cada edición
line_budget: 500
---

# Dominio — <Proyecto / Cliente>

<!--
REGLAS:
- El SEGUNDO de los dos únicos documentos vivos del repo.
- Describe el negocio tal como el sistema lo entiende HOY.
- Fuente: se alimenta desde el ritual /close-spec y desde la
  destilación de notas de negocio (Obsidian → repo, unidireccional).
- Audiencia doble: agentes (para no inventar semántica de negocio) y
  perfil GERENTE del harness (su documento principal).
- Lenguaje de negocio; lo técnico va en architecture.md.
-->

## 1. El negocio en un párrafo

<!-- Qué hace el cliente/negocio y qué papel juega este sistema en él. -->

## 2. Glosario

<!-- El vocabulario del dominio con definición precisa. Es la sección
más importante: fija la semántica que agentes y código deben respetar.
Si un término del negocio tiene nombre distinto en el código, indicarlo. -->

| Término | Definición | En el código |
|---|---|---|
| <Término de negocio> | <definición precisa, sin ambigüedad> | `NombreEntidad` |
| ... | ... | ... |

## 3. Entidades principales y sus relaciones

<!-- Las 5-15 entidades centrales del dominio y cómo se relacionan,
en prosa o lista. No es el esquema de BD (eso es implementación):
es el modelo conceptual del negocio. -->

## 4. Reglas de negocio e invariantes

<!-- Numeradas con ID estable (RN-01, RN-02...) para poder
referenciarlas desde specs y tests. Las reglas que SIEMPRE deben
cumplirse, con su excepción si existe. -->

| ID | Regla | Excepciones |
|----|-------|-------------|
| RN-01 | ... | ... |

## 5. Procesos clave

<!-- Los 2-5 flujos de negocio centrales, paso a paso en lenguaje de
negocio (ej. ciclo de un pedido, alta de un cliente). -->

## 6. Fuera del dominio (explícito)

<!-- Qué aspectos del negocio del cliente este sistema NO modela,
para que nadie (humano o agente) asuma que debería. -->
