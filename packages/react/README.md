# @window-manager/react

React provider and hooks for `@window-manager/core`.

## Install

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

## Hooks

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

See the repository README for complete examples.
