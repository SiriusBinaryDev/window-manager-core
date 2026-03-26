# Architecture

## Principios

1. Headless y agnóstico de UI: `core` no depende de DOM ni React.
2. API pública basada en comandos + reducer puro.
3. Estado serializable versionado.
4. Selectors para centralizar lectura derivada.

## Capas

- **Core (`packages/core`)**
  - `types.ts`: contratos de dominio.
  - `commands.ts`: factory de comandos.
  - `reducer.ts`: reglas de negocio puras.
  - `selectors.ts`: consultas derivadas.
  - `math.ts`: utilidades geométricas.
  - `serialization.ts`: persistencia/hidratación.
  - `createWindowManager.ts`: API imperativa amigable.

- **React (`packages/react`)**
  - Provider con instancia de `WindowManager`.
  - Hooks `useWindowManager`, `useWindow`, `useDesktop`, `useTaskbar`, `useVisibleWindows`.
  - `useSyncExternalStore` para evitar rerenders innecesarios.

- **Playground (`apps/playground`)**
  - Integración completa para crear, mover, redimensionar y controlar ventanas.
  - Persistencia en `localStorage` vía serialización del manager.

## Decisiones por simplicidad

- Se usa un único escritorio con bounds rectangulares.
- `taskbar` es derivado de ventanas no cerradas.
- Cerrar ventana no elimina entidad, la marca como `closed` para depuración y auditoría.
- `orderedWindowIds` modela z-order explícito.
