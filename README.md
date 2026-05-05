# window-manager-core

`window-manager-core` es una libreria frontend headless para modelar sistemas de ventanas estilo desktop en apps web.

## Para que sirve

Permite gestionar ventanas con identidad, foco, z-order, minimizar, maximizar, restaurar, cerrar, drag, resize, multiples desktops, multiples monitores por desktop, modales por owner, taskbar y persistencia serializable, sin acoplar la logica a un framework de UI.

## Ejemplo basico

```ts
import { createWindowManager } from '@window-manager/core';

const wm = createWindowManager();

wm.createMonitor('right', {
  size: { width: 1280, height: 720 },
  bounds: { minX: 1280, minY: 0, maxX: 2560, maxY: 720 },
});

wm.switchMonitor('right');
wm.createWindow({ id: 'terminal', title: 'Terminal' });
wm.createWindow({ id: 'confirm-exit', title: 'Confirm exit', ownerWindowId: 'terminal' });
```

## API publica

### `@window-manager/core`

#### `createWindowManager(initialState?)`

Expone:

- `getState()`
- `dispatch(command)`
- `subscribe(listener)`
- `createWindow(payload)`
- `createDesktop(id, desktop?)`
- `switchDesktop(id)`
- `createMonitor(id, monitor?, desktopId?)`
- `switchMonitor(id, desktopId?)`
- `focusWindow(id)`
- `focusNextWindow()`
- `focusPreviousWindow()`
- `moveWindow(id, deltaX, deltaY)`
- `resizeWindow(id, edge, deltaX, deltaY)`
- `maximizeWindow(id)`
- `minimizeWindow(id)`
- `restoreWindow(id)`
- `closeWindow(id)`
- `setMonitor(payload, desktopId?, monitorId?)`
- `setDesktop(payload, desktopId?, monitorId?)`
- `serialize()`
- `hydrate(serialized)`
- `selectors`

`setDesktop(...)` se mantiene por compatibilidad y hoy actua sobre el monitor activo o sobre el monitor indicado.

#### Reducer y comandos

- `createInitialState()`
- `windowManagerReducer(state, command)`
- `commands.createWindow(payload)`
- `commands.createDesktop(id, desktop?)`
- `commands.switchDesktop(id)`
- `commands.createMonitor(id, monitor?, desktopId?)`
- `commands.switchMonitor(id, desktopId?)`
- `commands.setMonitor(payload, desktopId?, monitorId?)`
- `commands.setDesktop(payload, desktopId?, monitorId?)`

#### Selectors

- `getWindowById(state, id)`
- `getDesktopById(state, id)`
- `getActiveDesktop(state)`
- `getDesktops(state)`
- `getMonitorById(state, id, desktopId?)`
- `getActiveMonitor(state, desktopId?)`
- `getActiveWindow(state, desktopId?)`
- `getTopModalWindow(state, desktopId?)`
- `getVisibleWindows(state, desktopId?, monitorId?)`
- `getTaskbarItems(state, desktopId?, monitorId?)`

#### Politica de foco

- solo las ventanas visibles pueden recibir foco
- una ventana visible es una ventana no cerrada y no minimizada
- `focusWindow(id)` ignora ventanas minimizadas o cerradas
- `focusWindow(id)` cambia al desktop de la ventana cuando hace falta
- `focusWindow(id)` tambien mueve `activeMonitorId` al monitor de la ventana
- si hay un modal visible en el desktop, solo el modal superior puede recibir foco
- un modal usa `ownerWindowId` y vive en el mismo desktop y monitor que su owner
- cerrar una ventana owner tambien cierra sus descendientes modales
- `focusNextWindow()` y `focusPreviousWindow()` ciclan entre ventanas visibles del desktop activo
- minimizar o cerrar la ventana activa promueve la ventana visible mas alta en z-order y mueve el monitor activo si corresponde
- `restoreWindow(id)` trae la ventana al frente, la activa y sigue su desktop y monitor

#### Persistencia

- `serializeState(state)` genera un envelope versionado
- `hydrateState(raw)` sanea e hidrata el estado
- el estado actual usa version `4`
- los payloads version `1`, `2` y `3` migran hacia el modelo actual

### `@window-manager/react`

#### `WindowManagerProvider`

Provider que acepta `manager?: WindowManager`.

#### Hooks

- `useWindowManager()`
- `useWindow(id)`
- `useTopModalWindow()`
- `useMonitor()`
- `useDesktop()`
- `useDesktops()`
- `useActiveDesktopId()`
- `useActiveMonitorId()`
- `useTaskbar()`
- `useVisibleWindows()`

`useDesktop()` se mantiene como alias compatible del monitor activo.

## Arquitectura

- `packages/core`: comandos, reducer, selectors, matematicas y serializacion
- `packages/react`: provider y hooks sobre el core
- `apps/playground`: demo real con persistencia y flujo multi-monitor
- `docs`: arquitectura, modelo de estado y ejemplos

## Playground

```bash
pnpm install
pnpm dev
```

## Scripts

```bash
pnpm test
pnpm build
pnpm lint
pnpm typecheck
```
