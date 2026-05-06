# window-manager-core

Libreria headless para crear interfaces con ventanas tipo desktop en apps web.

El core no depende de React ni del DOM. Guarda estado, aplica reglas de foco,
z-order, movimiento, resize, desktops, monitores, modales y persistencia. La
capa React solo expone provider y hooks.

## Paquetes

- `@window-manager/core`: estado, comandos, reducer, selectors y persistencia.
- `@window-manager/react`: provider y hooks para React.

## Instalacion

```bash
pnpm add @window-manager/core
```

Para React:

```bash
pnpm add @window-manager/core @window-manager/react
```

## Uso basico con core

```ts
import { createWindowManager } from '@window-manager/core';

const wm = createWindowManager();

wm.createWindow({
  id: 'terminal',
  title: 'Terminal',
  rect: { x: 40, y: 40, width: 640, height: 360 },
});

wm.moveWindow('terminal', 20, 10);
wm.resizeWindow('terminal', 'bottom-right', 80, 40);

console.log(wm.getState().windows.terminal.rect);
```

## Desktops y monitores

```ts
wm.createDesktop('work');
wm.switchDesktop('work');

wm.createMonitor('right', {
  size: { width: 1280, height: 720 },
  bounds: { minX: 1280, minY: 0, maxX: 2560, maxY: 720 },
});

wm.switchMonitor('right');
wm.createWindow({ id: 'notes', title: 'Notes' });
```

Cada desktop tiene sus propios monitores, orden de ventanas y ventana activa.
Las ventanas se mantienen dentro de los bounds del monitor asignado.

## Modales

```ts
wm.createWindow({ id: 'editor', title: 'Editor' });

wm.createWindow({
  id: 'confirm-close',
  title: 'Confirm close',
  ownerWindowId: 'editor',
});
```

Una ventana modal hereda el desktop y monitor de su owner. Mientras hay un
modal visible, el core bloquea el foco hacia ventanas de fondo en ese desktop.
Cerrar un owner tambien cierra sus modales descendientes.

## Persistencia

```ts
const saved = wm.serialize();

const next = createWindowManager();
next.hydrate(saved);
```

El estado serializado es versionado. `hydrate()` devuelve `null` si el payload
no se puede leer o no tiene forma valida.

## Uso con React

```tsx
import { createWindowManager } from '@window-manager/core';
import {
  WindowManagerProvider,
  useTaskbar,
  useVisibleWindows,
  useWindowManager,
} from '@window-manager/react';

const manager = createWindowManager();

function Desktop() {
  const wm = useWindowManager();
  const windows = useVisibleWindows();
  const taskbar = useTaskbar();

  return (
    <>
      <button onClick={() => wm.createWindow({ id: crypto.randomUUID() })}>
        New window
      </button>
      <pre>{JSON.stringify(windows, null, 2)}</pre>
      <pre>{JSON.stringify(taskbar, null, 2)}</pre>
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

## API principal

`createWindowManager()` expone:

- `getState()`, `dispatch(command)`, `subscribe(listener)`
- `createWindow(payload)`
- `createDesktop(id, desktop?)`, `switchDesktop(id)`
- `createMonitor(id, monitor?, desktopId?)`, `switchMonitor(id, desktopId?)`
- `focusWindow(id)`, `focusNextWindow()`, `focusPreviousWindow()`
- `moveWindow(id, deltaX, deltaY)`
- `resizeWindow(id, edge, deltaX, deltaY)`
- `maximizeWindow(id)`, `minimizeWindow(id)`, `restoreWindow(id)`, `closeWindow(id)`
- `setMonitor(payload, desktopId?, monitorId?)`
- `serialize()`, `hydrate(serialized)`
- `selectors`

`resizeWindow` acepta estos edges:

```ts
type ResizeEdge =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';
```

## Selectors

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

## Desarrollo local

```bash
pnpm install
pnpm test
pnpm build
pnpm --filter @window-manager/playground dev
```

El playground muestra creacion de ventanas, drag, resize por bordes y esquinas,
desktops, monitores, modales, taskbar y persistencia en `localStorage`.
