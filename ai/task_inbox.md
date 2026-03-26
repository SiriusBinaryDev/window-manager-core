# AI Task Inbox

## 1) Contexto

Monorepo de librería headless para ventanas tipo desktop con `core`, adapter React y playground.

## 2) Estado actual

- Core funcional con comandos, reducer, selectors, serialización y utilidades matemáticas.
- Adapter React con provider + hooks.
- Playground con acciones principales y persistencia en localStorage.
- Suite inicial de tests en Vitest para reglas críticas.

## 3) Principios

- Headless primero: toda regla vive en `packages/core`.
- API clara, comandos explícitos, estado serializable.
- Simplicidad sobre sobreingeniería.
- Extensibilidad incremental con compatibilidad hacia atrás.

## 4) Backlog por prioridad

### P0

#### Tarea: API docs
- **Objetivo:** documentar API pública estable.
- **Propuesta técnica:** generar docs de `@window-manager/core` y `@window-manager/react` con ejemplos de comandos + hooks.
- **Archivos afectados:** `README.md`, `docs/*`, posible `docs/api/*`.
- **Criterios de aceptación:** cada export público con firma, comportamiento y ejemplos mínimos.

#### Tarea: examples
- **Objetivo:** aumentar adopción con casos reales.
- **Propuesta técnica:** crear ejemplos de CRUD de ventanas, restauración y persistencia.
- **Archivos afectados:** `apps/examples/*` (nuevo), `README.md`.
- **Criterios de aceptación:** al menos 3 ejemplos ejecutables.

#### Tarea: npm publishing
- **Objetivo:** publicar paquetes con pipeline reproducible.
- **Propuesta técnica:** configurar `changesets` y workflow de publish.
- **Archivos afectados:** `.github/workflows/*`, `.changeset/*`, `package.json`.
- **Criterios de aceptación:** release dry-run exitoso en CI.

#### Tarea: semantic versioning
- **Objetivo:** garantizar versionado consistente.
- **Propuesta técnica:** convención semver + changelog automatizado.
- **Archivos afectados:** `CONTRIBUTING.md`, `.changeset/*`, workflows.
- **Criterios de aceptación:** releases generan changelog con breaking/feature/fix.

### P1

#### Tarea: snapping system
- **Objetivo:** permitir snap por bordes y zonas.
- **Propuesta técnica:** agregar módulo de estrategias de snap pluggable en reducer.
- **Archivos afectados:** `packages/core/src/reducer.ts`, `packages/core/src/math.ts`, tests.
- **Criterios de aceptación:** snap configurable, testeado y opcional.

#### Tarea: keyboard navigation
- **Objetivo:** controlar ventanas sin mouse.
- **Propuesta técnica:** comandos de focus traversal, move/resize por teclado en adapter.
- **Archivos afectados:** `packages/core/src/commands.ts`, `packages/react/*`, playground.
- **Criterios de aceptación:** navegación ciclica entre ventanas y atajos básicos.

#### Tarea: accessibility
- **Objetivo:** mejorar accesibilidad en adapters UI.
- **Propuesta técnica:** roles ARIA y manejo de foco accesible en ejemplos React.
- **Archivos afectados:** `apps/playground/*`, docs.
- **Criterios de aceptación:** navegación por teclado y landmarks documentados.

#### Tarea: performance optimization
- **Objetivo:** escalar a muchas ventanas.
- **Propuesta técnica:** selectors memoizados opcionales y batching en adapter.
- **Archivos afectados:** `packages/core/src/selectors.ts`, `packages/react/src/index.tsx`.
- **Criterios de aceptación:** benchmark con mejora medible en rerenders.

### P2

#### Tarea: multi-desktop
- **Objetivo:** soportar escritorios virtuales.
- **Propuesta técnica:** introducir `desktopId` por ventana + estado de desktop activo.
- **Archivos afectados:** `packages/core/src/types.ts`, reducer, selectors, tests.
- **Criterios de aceptación:** alternar escritorio preservando estado por escritorio.

#### Tarea: multi-monitor
- **Objetivo:** soportar múltiples bounds y áreas de trabajo.
- **Propuesta técnica:** colección de monitores y reglas de clipping por monitor activo.
- **Archivos afectados:** `packages/core/src/types.ts`, `math.ts`, reducer.
- **Criterios de aceptación:** mover ventanas entre monitores sin perder restauración.

#### Tarea: animations
- **Objetivo:** transiciones suaves sin romper headless.
- **Propuesta técnica:** eventos de transición en adapter/UI layer y no en core.
- **Archivos afectados:** `packages/react/*`, `apps/playground/*`, docs.
- **Criterios de aceptación:** animaciones opcionales desacopladas de la lógica.

#### Tarea: advanced focus policies
- **Objetivo:** soportar distintas políticas de foco.
- **Propuesta técnica:** estrategia configurable (`click-to-focus`, `sloppy-focus`, etc.).
- **Archivos afectados:** `packages/core/src/reducer.ts`, `types.ts`, tests.
- **Criterios de aceptación:** políticas intercambiables sin romper API base.

### P3

#### Tarea: modal windows
- **Objetivo:** ventanas modales con restricción de interacción.
- **Propuesta técnica:** stack modal y bloqueo de foco para no-modales.
- **Archivos afectados:** core reducer/selectors, adapter React.
- **Criterios de aceptación:** modales bloquean interacción de fondo.

#### Tarea: undo/redo
- **Objetivo:** historial de estado reversible.
- **Propuesta técnica:** wrapper de reducer con timeline.
- **Archivos afectados:** `packages/core/src/history.ts` (nuevo), docs/tests.
- **Criterios de aceptación:** undo/redo de comandos mutables clave.
