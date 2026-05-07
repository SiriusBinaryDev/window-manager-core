# window-manager-core

Headless TypeScript packages for building desktop-style window interfaces in web apps.

The core package has no DOM or React dependency. It stores window state, applies focus and z-order rules, keeps windows inside monitor bounds, supports workspaces, monitors, modals, snapping, taskbar selectors, and versioned persistence. The React package is a thin provider and hook layer over the core manager.

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
```

## Workspaces And Monitors

```ts
wm.createWorkspace('work');
wm.switchWorkspace('work');

wm.createMonitor('right', {
  size: { width: 1280, height: 720 },
  bounds: { minX: 1280, minY: 0, maxX: 2560, maxY: 720 },
  snap: { threshold: 24 },
});

wm.switchMonitor('right');
wm.createWindow({ id: 'notes', title: 'Notes' });
```

A workspace owns its monitor layout, active monitor, z-order, and active window. The older `createDesktop`, `switchDesktop`, and desktop selector names still work as compatibility aliases.

## Modals

```ts
wm.createWindow({ id: 'editor', title: 'Editor' });

wm.createWindow({
  id: 'confirm-close',
  title: 'Confirm close',
  ownerWindowId: 'editor',
});
```

A modal inherits the workspace and monitor of its owner. While a visible modal exists, the core prevents background windows in that workspace from taking focus. Closing an owner also closes its modal descendants.

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

function WorkspaceView() {
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
      <WorkspaceView />
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
- `createWorkspace(id, workspace?)`
- `switchWorkspace(id)`
- `createDesktop(id, desktop?)`
- `switchDesktop(id)`
- `createMonitor(id, monitor?, workspaceId?)`
- `switchMonitor(id, workspaceId?)`
- `focusWindow(id)`
- `focusNextWindow()`
- `focusPreviousWindow()`
- `moveWindow(id, deltaX, deltaY)`
- `resizeWindow(id, edge, deltaX, deltaY)`
- `maximizeWindow(id)`
- `minimizeWindow(id)`
- `restoreWindow(id)`
- `closeWindow(id)`
- `setMonitor(payload, workspaceId?, monitorId?)`
- `setDesktop(payload, workspaceId?, monitorId?)`
- `serialize()`
- `hydrate(serialized)`
- `selectors`

The desktop-named methods are compatibility aliases. The state fields are still named `desktops`, `desktopId`, and `activeDesktopId` for serialized-state compatibility.

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

Preferred workspace names:

- `getWorkspaceById(state, id)`
- `getActiveWorkspace(state)`
- `getWorkspaces(state)`
- `getMonitorById(state, id, workspaceId?)`
- `getActiveMonitor(state, workspaceId?)`
- `getActiveWindow(state, workspaceId?)`
- `getTopModalWindow(state, workspaceId?)`
- `getVisibleWindows(state, workspaceId?, monitorId?)`
- `getTaskbarItems(state, workspaceId?, monitorId?)`

Compatibility desktop names:

- `getDesktopById(state, id)`
- `getActiveDesktop(state)`
- `getDesktops(state)`

## React Hooks

Preferred workspace names:

- `useWindowManager()`
- `useWindow(id)`
- `useWorkspace()`
- `useWorkspaces()`
- `useActiveWorkspaceId()`
- `useMonitor()`
- `useActiveMonitorId()`
- `useTopModalWindow()`
- `useTaskbar()`
- `useVisibleWindows()`

Compatibility desktop names:

- `useDesktop()`
- `useDesktops()`
- `useActiveDesktopId()`

## Local Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @window-manager/playground dev
```

The playground demonstrates window creation, fixed capability flags, drag, edge and corner resize, minimize, maximize, restore, close, focus traversal, workspaces, monitors, monitor snapping, monitor resizing, modals, taskbar behavior, selectors, and `localStorage` persistence.

## License

MIT
