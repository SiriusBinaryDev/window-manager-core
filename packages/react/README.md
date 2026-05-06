# @window-manager/react

Provider y hooks React para `@window-manager/core`.

## Instalacion

```bash
pnpm add @window-manager/core @window-manager/react
```

## Uso basico

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

Ver el README del repositorio para ejemplos completos.
