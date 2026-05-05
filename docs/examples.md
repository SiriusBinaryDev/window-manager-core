# Examples

## Goal

This document shows concrete usage paths for the current exported APIs.
All examples are based on implemented behavior in `@window-manager/core` and `@window-manager/react`.

## 1. Imperative Core Usage

Use `createWindowManager()` when you want a small headless state container without adding another store.

```ts
import { createWindowManager } from '@window-manager/core';

const wm = createWindowManager();

wm.setDesktop({
  size: { width: 1440, height: 900 },
  bounds: { minX: 0, minY: 0, maxX: 1440, maxY: 900 },
  snap: { threshold: 24 },
});

wm.createWindow({
  id: 'explorer',
  title: 'Explorer',
  rect: { x: 40, y: 40, width: 640, height: 420 },
});

wm.createWindow({
  id: 'terminal',
  title: 'Terminal',
  rect: { x: 180, y: 120, width: 560, height: 320 },
  flags: { minimizable: false, maximizable: false },
});

wm.focusWindow('terminal');
wm.focusNextWindow();
wm.moveWindow('terminal', 20, 16);

console.log(wm.getState().activeWindowId);
console.log(wm.selectors.getVisibleWindows(wm.getState()));
```

Use this path when:

- your app already has its own UI layer
- you want direct command methods instead of a reducer integration
- you want to serialize and restore state with `serialize()` / `hydrate()`
- you want optional desktop-edge snapping during move/resize
- you want keyboard-style focus traversal without coupling to React

## 2. Reducer + Commands Integration

Use `windowManagerReducer`, `createInitialState`, and `commands` when the window manager should live inside another state system.

```ts
import {
  commands,
  createInitialState,
  selectors,
  windowManagerReducer,
} from '@window-manager/core';

let state = createInitialState();

state = windowManagerReducer(
  state,
  commands.createWindow({
    id: 'notes',
    title: 'Notes',
    rect: { x: 60, y: 60, width: 480, height: 300 },
  }),
);

state = windowManagerReducer(state, commands.minimizeWindow('notes'));
state = windowManagerReducer(state, commands.restoreWindow('notes'));
state = windowManagerReducer(state, commands.focusNextWindow());

const taskbar = selectors.getTaskbarItems(state);
const active = selectors.getActiveWindow(state);

console.log(taskbar.map((item) => item.id));
console.log(active?.id);
```

Use this path when:

- you need pure state transitions
- you want time-travel/debug tooling outside this library
- you want to dispatch typed commands from another store or framework
- you want to trigger focus traversal with command factories

## 3. Persisted React Integration

Use `WindowManagerProvider` and the exported hooks when React owns the desktop UI.

```tsx
import { createWindowManager } from '@window-manager/core';
import {
  WindowManagerProvider,
  useTaskbar,
  useVisibleWindows,
  useWindowManager,
} from '@window-manager/react';
import { useMemo } from 'react';

const STORAGE_KEY = 'window-manager-example';

function Desktop() {
  const wm = useWindowManager();
  const windows = useVisibleWindows();
  const taskbar = useTaskbar();

  return (
    <>
      <button
        onClick={() =>
          wm.createWindow({
            id: crypto.randomUUID(),
            title: 'New window',
          })
        }
      >
        New window
      </button>
      <button onClick={() => wm.focusPreviousWindow()}>
        Previous window
      </button>
      <button onClick={() => wm.focusNextWindow()}>
        Next window
      </button>

      <pre>{JSON.stringify(windows, null, 2)}</pre>
      <pre>{JSON.stringify(taskbar, null, 2)}</pre>
    </>
  );
}

export function App() {
  const manager = useMemo(() => {
    const instance = createWindowManager();
    const serialized = localStorage.getItem(STORAGE_KEY);

    if (serialized) {
      instance.hydrate(serialized);
    }

    instance.subscribe(() => {
      localStorage.setItem(STORAGE_KEY, instance.serialize());
    });

    return instance;
  }, []);

  return (
    <WindowManagerProvider manager={manager}>
      <Desktop />
    </WindowManagerProvider>
  );
}
```

Use this path when:

- React renders the desktop/taskbar/window chrome
- you want the core rules to stay outside components
- you want persistence without rebuilding the serialization envelope manually
- you want to map UI buttons or shortcuts to core focus traversal
- you want to layer labels, roles, and focusable containers on top of the headless core

## 4. Reading Derived State

Selectors and React hooks expose slightly different usage styles over the same concepts.

- Core selectors:
  - `getWindowById(state, id)`
  - `getActiveWindow(state)`
  - `getVisibleWindows(state)`
  - `getTaskbarItems(state)`
- React hooks:
  - `useWindow(id)`
  - `useDesktop()`
  - `useTaskbar()`
  - `useVisibleWindows()`

## 5. Current Limits

These examples intentionally stay within currently implemented features:

- single desktop
- rectangular desktop bounds
- desktop-edge snapping only when `desktop.snap.threshold` is configured
- keyboard navigation currently covers focus traversal only
- no multi-monitor or multi-desktop support
