# window-manager-core

Headless TypeScript packages for building desktop-style window interfaces in web apps.

The core package has no DOM or React dependency. It stores window state, applies focus and z-order rules, keeps windows inside monitor bounds, supports desktops, monitors, modals, snapping, taskbar selectors, and versioned persistence. The React package is a thin provider and hook layer over the core manager.

## Packages

- `@window-manager/core`: state model, commands, reducer, selectors, geometry, serialization, and the imperative manager.
- `@window-manager/react`: React provider and hooks for reading and controlling a core manager.
- `@window-manager/playground`: private Vite demo app used to validate the package behavior.

## Install

Core only:

```bash
pnpm add @window-manager/core
```

Core plus React hooks:

```bash
pnpm add @window-manager/core @window-manager/react
```

## Core Usage

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
wm.maximizeWindow('terminal');
wm.restoreWindow('terminal');

console.log(wm.getState().windows.terminal.rect);
```

## Desktops And Monitors

```ts
wm.createDesktop('work');
wm.switchDesktop('work');

wm.createMonitor('right', {
  size: { width: 1280, height: 720 },
  bounds: { minX: 1280, minY: 0, maxX: 2560, maxY: 720 },
  snap: { threshold: 24 },
});

wm.switchMonitor('right');
wm.createWindow({ id: 'notes', title: 'Notes' });
```

Each desktop owns its monitor layout, active monitor, z-order, and active window. This keeps workspaces isolated and makes it easy to persist or switch a whole desktop as one unit. A more OS-like model could put desktops inside monitors, but that is a different state shape and would be a breaking architecture change.

## Modals

```ts
wm.createWindow({ id: 'editor', title: 'Editor' });

wm.createWindow({
  id: 'confirm-close',
  title: 'Confirm close',
  ownerWindowId: 'editor',
});
```

A modal inherits the desktop and monitor of its owner. While a visible modal exists, the core prevents background windows in that desktop from taking focus. Closing an owner also closes its modal descendants.

## Persistence

```ts
const saved = wm.serialize();

const restored = createWindowManager();
restored.hydrate(saved);
```

Serialized state is versioned. `hydrate()` returns `null` when the payload cannot be read or sanitized.

## React Usage

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

## Manager API

`createWindowManager()` returns:

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

`setDesktop(...)` is kept as a compatibility alias for `setMonitor(...)`.

## Resize Edges

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

## React Hooks

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

## Local Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @window-manager/playground dev
```

The playground demonstrates window creation, fixed capability flags, drag, edge and corner resize, minimize, maximize, restore, close, focus traversal, desktops, monitors, monitor snapping, monitor resizing, modals, taskbar behavior, selectors, and `localStorage` persistence.
