# window-manager-core

`window-manager-core` es una librería frontend headless para modelar sistemas de ventanas estilo desktop en apps web modernas.

## ¿Para qué sirve?

Permite gestionar ventanas con identidad, foco, z-order, minimizar/maximizar/restaurar/cerrar, drag/resize, límites de escritorio, taskbar, capacidades por ventana y persistencia de estado serializable, sin acoplar la lógica a un framework de UI.

## Ejemplo básico

```ts
import { createWindowManager } from '@window-manager/core';

const wm = createWindowManager();

wm.createWindow({ id: '1', title: 'Explorer' });
wm.focusWindow('1');
```

## API publica

### `@window-manager/core`

#### `createWindowManager(initialState?)`

Crea una instancia imperativa del manager. Expone:

- `getState()`: devuelve el estado actual
- `dispatch(command)`: aplica un comando tipado
- `subscribe(listener)`: escucha cambios de estado
- `createWindow(payload)`
- `createDesktop(id, desktop?)`
- `switchDesktop(id)`
- `focusWindow(id)`
- `focusNextWindow()`
- `focusPreviousWindow()`
- `moveWindow(id, deltaX, deltaY)`
- `resizeWindow(id, edge, deltaX, deltaY)`
- `maximizeWindow(id)`
- `minimizeWindow(id)`
- `restoreWindow(id)`
- `closeWindow(id)`
- `setDesktop(payload, desktopId?)`
- `serialize()`: serializa el estado actual
- `hydrate(serialized)`: hidrata estado serializado y devuelve `WindowManagerState | null`
- `selectors`: reexport de selectors para leer estado derivado

#### Reducer y estado base

- `createInitialState()`: crea el estado inicial
- `windowManagerReducer(state, command)`: reducer puro para integrar el core en otro store

#### `commands`

Factories de comandos para:

- `createWindow(payload)`
- `createDesktop(id, desktop?)`
- `switchDesktop(id)`
- `focusWindow(id)`
- `focusNextWindow()`
- `focusPreviousWindow()`
- `moveWindow(id, deltaX, deltaY)`
- `resizeWindow(id, edge, deltaX, deltaY)`
- `maximizeWindow(id)`
- `minimizeWindow(id)`
- `restoreWindow(id)`
- `closeWindow(id)`
- `setDesktop(payload, desktopId?)`
- `hydrateState(payload)`

#### `selectors`

Lecturas derivadas disponibles:

- `getWindowById(state, id)`
- `getDesktopById(state, id)`
- `getActiveDesktop(state)`
- `getDesktops(state)`
- `getActiveWindow(state)`
- `getVisibleWindows(state)`
- `getTaskbarItems(state)`

#### Politica de foco

El comportamiento de foco actual queda definido asi:

- solo las ventanas visibles pueden recibir foco
- una ventana visible es una ventana no cerrada y no minimizada
- `focusWindow(id)` ignora ventanas minimizadas o cerradas
- `focusWindow(id)` cambia al desktop de la ventana cuando el objetivo vive en otro workspace
- `focusNextWindow()` y `focusPreviousWindow()` ciclan solo entre ventanas visibles
- minimizar o cerrar la ventana activa promueve la ventana visible mas alta en z-order
- `restoreWindow(id)` trae la ventana al frente, la convierte en activa y cambia al desktop objetivo si hace falta

#### Persistencia

- `serializeState(state)`: genera un `SerializationEnvelope`
- `hydrateState(raw)`: parsea y sanea el estado hidratado; devuelve `null` si la estructura es invalida

#### Tipos exportados

Tipos principales reexportados desde `types.ts`:

- `WindowManager`
- `WindowManagerState`
- `WindowEntity`
- `CreateWindowPayload`
- `DesktopState`
- `Rect`
- `Bounds`
- `WindowFlags`
  - `resizable`
  - `movable`
  - `closable`
  - `minimizable`
  - `maximizable`
- `WindowStateFlags`
- `ResizeEdge`
- `WindowManagerCommand`
- `SerializationEnvelope`
- `WindowId`
- `WINDOW_MANAGER_STATE_VERSION`

### `@window-manager/react`

#### `WindowManagerProvider`

Provider que acepta `manager?: WindowManager`. Si no recibe uno, crea una instancia con `createWindowManager()`.

#### Hooks

- `useWindowManager()`: acceso a la instancia `WindowManager`
- `useWindow(id)`: devuelve `WindowEntity | null`
- `useDesktop()`: devuelve el `DesktopState` del desktop activo
- `useDesktops()`: devuelve la lista de workspaces disponibles
- `useActiveDesktopId()`: devuelve el id del desktop activo
- `useTaskbar()`: devuelve las ventanas no cerradas
- `useVisibleWindows()`: devuelve las ventanas no minimizadas ni cerradas

Las capacidades por ventana se configuran desde `createWindow({ flags })` y hoy permiten activar o desactivar:

- resize
- move
- close
- minimize
- maximize

## Ejemplo React

```tsx
import { createWindowManager } from '@window-manager/core';
import { WindowManagerProvider, useVisibleWindows, useWindowManager } from '@window-manager/react';

const manager = createWindowManager();

function Desktop() {
  const wm = useWindowManager();
  const windows = useVisibleWindows();

  return (
    <>
      <button onClick={() => wm.createWindow({ id: crypto.randomUUID() })}>
        New window
      </button>
      <pre>{JSON.stringify(windows, null, 2)}</pre>
    </>
  );
}

export function App() {
  return (
    <WindowManagerProvider manager={manager}>
      <Desktop />
    </WindowManagerProvider>
  );
}
```

Mas ejemplos en [`docs/examples.md`](./docs/examples.md).

## Arquitectura

- `packages/core`: lógica pura (comandos, reducer, selectors, matemáticas y serialización).
- `packages/react`: provider y hooks React que consumen el core sin duplicar reglas.
- `apps/playground`: demo real usando la librería publicada en el monorepo.
- `docs`: arquitectura, modelo de estado y roadmap.
- `ai`: inbox de tareas para agentes IA.

## Ejecutar playground

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
