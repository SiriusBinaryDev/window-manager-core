# @window-manager/react

React provider and hooks for `@window-manager/core`.

## Install

```bash
npm install @window-manager/core @window-manager/react
```

```bash
pnpm add @window-manager/core @window-manager/react
```

## Basic Usage

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

## Hooks

- `useWindowManager()`
- `useWindow(id)`
- `useTopModalWindow()`
- `useMonitor()`
- `useWorkspace()`
- `useWorkspaces()`
- `useActiveWorkspaceId()`
- `useActiveMonitorId()`
- `useTaskbar()`
- `useVisibleWindows()`

`useDesktop()`, `useDesktops()`, and `useActiveDesktopId()` are still exported
as compatibility aliases.

See the repository README for complete examples.
