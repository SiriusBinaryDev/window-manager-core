# window-manager-core

Headless TypeScript packages for building workspace-based window interfaces in web apps.

Build draggable, resizable, minimizable, maximizable and modal windows with predictable state, z-order, focus, workspace, monitor, taskbar and persistence logic.

## The Problem

Windowed interfaces are more than draggable boxes.

Real applications need to manage:

- window lifecycle and state
- focus and z-order
- workspaces and monitor bounds
- snapping, maximize, minimize and restore behavior
- modal ownership rules
- taskbar and visible-window selectors
- persistence and migration of saved layouts

`window-manager-core` models those concerns without owning your UI.

## Why window-manager-core

- Headless core with no DOM or React dependency
- Predictable reducer-based state model
- Workspace-owned monitor layouts
- Built-in focus, z-order, snapping and modal behavior
- Versioned serialization and hydration
- React provider and hooks when you want React integration
- Compatibility aliases for older desktop naming

## Install

Core only:

```bash
npm install @window-manager/core
```

```bash
pnpm add @window-manager/core
```

Core plus React hooks:

```bash
npm install @window-manager/core @window-manager/react
```

```bash
pnpm add @window-manager/core @window-manager/react
```

## Quick Example

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

## React Example

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

Each component can consume the same manager instance through context and hooks.

## Demo

The private playground app demonstrates:

- window creation and capability flags
- drag, edge resize and corner resize
- minimize, maximize, restore and close
- focus traversal
- workspaces and workspace switching
- monitors, active monitor switching and monitor resizing
- monitor snapping
- owner-scoped modals
- taskbar and selector output
- `localStorage` persistence

Run it locally:

```bash
pnpm install
pnpm dev
```

## Get Started

### 1. Create A Manager

```ts
import { createWindowManager } from '@window-manager/core';

const wm = createWindowManager();
```

### 2. Create A Workspace And Monitor

```ts
wm.createWorkspace('work');
wm.switchWorkspace('work');

wm.createMonitor('right', {
  size: { width: 1280, height: 720 },
  bounds: { minX: 1280, minY: 0, maxX: 2560, maxY: 720 },
  snap: { threshold: 24 },
});

wm.switchMonitor('right');
```

A workspace owns its monitor layout, active monitor, z-order and active window.

### 3. Create Windows

```ts
wm.createWindow({
  id: 'notes',
  title: 'Notes',
  rect: { x: 1320, y: 40, width: 480, height: 360 },
});

wm.createWindow({
  id: 'inspector',
  title: 'Inspector',
  minimizable: false,
  maximizable: false,
});
```

### 4. Add A Modal

```ts
wm.createWindow({ id: 'editor', title: 'Editor' });

wm.createWindow({
  id: 'confirm-close',
  title: 'Confirm close',
  ownerWindowId: 'editor',
});
```

A modal inherits the workspace and monitor of its owner. While a visible modal exists, background windows in that workspace cannot take focus. Closing an owner also closes its modal descendants.

### 5. Persist Layout State

```ts
const saved = wm.serialize();

const restored = createWindowManager();
restored.hydrate(saved);
```

Serialized state is versioned. `hydrate()` returns `null` when the payload cannot be read or sanitized.

## Core Concepts

1. **Headless state**
   The core package contains no DOM or React code.

2. **Explicit commands**
   Window behavior is modeled through reducer commands and manager methods.

3. **Workspace ownership**
   Windows, monitors, focus and z-order are scoped to a workspace.

4. **Monitor containment**
   Create, move, resize, maximize, restore and hydration paths keep windows inside monitor bounds.

5. **Compatibility naming**
   New code should prefer workspace names. Desktop-named methods, hooks and selectors remain available as aliases for compatibility.

## Packages

- [`@window-manager/core`](./packages/core): state model, commands, reducer, selectors, geometry, serialization and imperative manager.
- [`@window-manager/react`](./packages/react): React provider and hooks for reading and controlling a core manager.
- `@window-manager/playground`: private Vite app used to validate package behavior.

## Architecture

```text
@window-manager/core
        |
@window-manager/react
        |
your UI components

Browser storage
        |
core serialization
```

The React package does not reimplement window rules. It subscribes to the core manager and exposes focused hooks for UI components.

## Feature Comparison

| Feature                 | window-manager-core | UI-only draggable components |
| ----------------------- | ------------------- | ---------------------------- |
| Headless state model    | Yes                 | Usually no                   |
| Framework-agnostic core | Yes                 | Usually no                   |
| Workspace support       | Yes                 | Usually no                   |
| Multi-monitor support   | Yes                 | Usually no                   |
| Modal ownership rules   | Yes                 | Usually no                   |
| Taskbar selectors       | Yes                 | Usually no                   |
| Versioned persistence   | Yes                 | Usually no                   |

## Use Cases

- web desktops
- admin consoles
- data dashboards
- creative tools
- IDE-like interfaces
- internal operational apps

## API Reference

`createWindowManager()` exposes:

- state: `getState`, `dispatch`, `subscribe`
- lifecycle: `createWindow`, `focusWindow`, `closeWindow`
- movement: `moveWindow`, `resizeWindow`
- state changes: `maximizeWindow`, `minimizeWindow`, `restoreWindow`
- focus traversal: `focusNextWindow`, `focusPreviousWindow`
- topology: `createWorkspace`, `switchWorkspace`, `createMonitor`, `switchMonitor`
- persistence: `serialize`, `hydrate`
- derived reads: `selectors`

Compatibility aliases include `createDesktop`, `switchDesktop` and `setDesktop`.

## Selectors And Hooks

Common core selectors:

- `getActiveWorkspace(state)`
- `getWorkspaces(state)`
- `getActiveMonitor(state, workspaceId?)`
- `getActiveWindow(state, workspaceId?)`
- `getTopModalWindow(state, workspaceId?)`
- `getVisibleWindows(state, workspaceId?, monitorId?)`
- `getTaskbarItems(state, workspaceId?, monitorId?)`

Common React hooks:

- `useWindowManager()`
- `useWindow(id)`
- `useWorkspace()`
- `useWorkspaces()`
- `useMonitor()`
- `useActiveWorkspaceId()`
- `useActiveMonitorId()`
- `useTopModalWindow()`
- `useVisibleWindows()`
- `useTaskbar()`

Compatibility aliases include `useDesktop`, `useDesktops` and `useActiveDesktopId`.

## Docs

- [`docs/architecture.md`](./docs/architecture.md)
- [`docs/state-model.md`](./docs/state-model.md)
- [`docs/examples.md`](./docs/examples.md)
- [`docs/roadmap.md`](./docs/roadmap.md)
- [`docs/releasing.md`](./docs/releasing.md)
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)

## Development

This repository uses pnpm workspaces and requires Node.js 20 or newer.

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run the playground:

```bash
pnpm dev
```

## Contributing

Contributions are welcome. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for setup, workflow expectations and pull request checks.

Report security issues privately through the repository security page.

## License

Apache-2.0
