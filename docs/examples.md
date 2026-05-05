# Examples

## Goal

This document shows concrete usage paths for the current exported APIs.
All examples are based on implemented behavior in `@window-manager/core` and `@window-manager/react`.

## 1. Imperative Core Usage

Use `createWindowManager()` when you want a small headless state container without adding another store.

```ts
import { createWindowManager } from '@window-manager/core';

const wm = createWindowManager();

wm.createMonitor('right', {
  size: { width: 1440, height: 900 },
  bounds: { minX: 1440, minY: 0, maxX: 2880, maxY: 900 },
  snap: { threshold: 24 },
});

wm.createWindow({
  id: 'explorer',
  title: 'Explorer',
  rect: { x: 40, y: 40, width: 640, height: 420 },
});

wm.switchMonitor('right');
wm.createWindow({
  id: 'terminal',
  title: 'Terminal',
  rect: { x: 1500, y: 80, width: 560, height: 320 },
  flags: { minimizable: false, maximizable: false },
});

wm.createDesktop('docs');
wm.createMonitor(
  'vertical',
  {
    size: { width: 900, height: 1400 },
    bounds: { minX: 0, minY: 0, maxX: 900, maxY: 1400 },
  },
  'docs',
);
wm.createWindow({
  id: 'notes',
  desktopId: 'docs',
  monitorId: 'vertical',
  title: 'Notes',
});

wm.focusWindow('terminal');
wm.createWindow({
  id: 'confirm-exit',
  ownerWindowId: 'terminal',
  title: 'Confirm exit',
});
wm.focusNextWindow();
wm.moveWindow('terminal', 20, 16);

console.log(wm.getState().activeDesktopId);
console.log(wm.selectors.getActiveDesktop(wm.getState())?.activeMonitorId);
console.log(wm.selectors.getActiveMonitor(wm.getState()));
console.log(wm.selectors.getVisibleWindows(wm.getState()));
```

Use this path when:

- your app already has its own UI layer
- you want direct command methods instead of a reducer integration
- you want to serialize and restore state with `serialize()` / `hydrate()`
- you want optional monitor-edge snapping during move and resize
- you want isolated multi-desktop workspaces with per-desktop monitor layouts
- you want owner-scoped modal behavior enforced in the core

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
  commands.createMonitor('right', {
    size: { width: 1280, height: 720 },
    bounds: { minX: 1280, minY: 0, maxX: 2560, maxY: 720 },
  }),
);

state = windowManagerReducer(
  state,
  commands.createWindow({
    id: 'notes',
    title: 'Notes',
    monitorId: 'right',
    rect: { x: 1320, y: 60, width: 480, height: 300 },
  }),
);

state = windowManagerReducer(
  state,
  commands.createWindow({
    id: 'confirm-save',
    ownerWindowId: 'notes',
    title: 'Confirm save',
  }),
);

state = windowManagerReducer(state, commands.minimizeWindow('notes'));
state = windowManagerReducer(state, commands.restoreWindow('notes'));
state = windowManagerReducer(state, commands.focusNextWindow());

const taskbar = selectors.getTaskbarItems(state);
const active = selectors.getActiveWindow(state);
const activeMonitor = selectors.getActiveMonitor(state);
const topModal = selectors.getTopModalWindow(state);

console.log(taskbar.map((item) => item.id));
console.log(active?.id);
console.log(activeMonitor?.bounds);
console.log(topModal?.id);
```

## 3. Persisted React Integration

Use `WindowManagerProvider` and the exported hooks when React owns the desktop UI.

```tsx
import { createWindowManager } from '@window-manager/core';
import {
  WindowManagerProvider,
  useActiveDesktopId,
  useActiveMonitorId,
  useDesktops,
  useTopModalWindow,
  useTaskbar,
  useVisibleWindows,
  useWindowManager,
} from '@window-manager/react';
import { useMemo } from 'react';

const STORAGE_KEY = 'window-manager-example';

function Desktop() {
  const wm = useWindowManager();
  const activeDesktopId = useActiveDesktopId();
  const activeMonitorId = useActiveMonitorId();
  const desktops = useDesktops();
  const topModal = useTopModalWindow();
  const windows = useVisibleWindows();
  const taskbar = useTaskbar();

  return (
    <>
      <div>Active desktop: {activeDesktopId}</div>
      <div>Active monitor: {activeMonitorId}</div>
      <div>Top modal: {topModal?.id ?? 'none'}</div>
      <div>{desktops.map((desktop) => desktop.id).join(', ')}</div>
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
      <button
        onClick={() => {
          const active = wm.selectors.getActiveWindow(wm.getState());
          if (!active) {
            return;
          }

          wm.createWindow({
            id: crypto.randomUUID(),
            ownerWindowId: active.id,
            title: 'New modal',
          });
        }}
      >
        New modal
      </button>
      <button
        onClick={() =>
          wm.createMonitor(`monitor-${crypto.randomUUID().slice(0, 4)}`, {
            size: { width: 1280, height: 720 },
            bounds: { minX: 1280, minY: 0, maxX: 2560, maxY: 720 },
          })
        }
      >
        New monitor
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

## 4. Reading Derived State

- Core selectors:
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
- React hooks:
  - `useWindow(id)`
  - `useTopModalWindow()`
  - `useMonitor()`
  - `useDesktop()`
  - `useDesktops()`
  - `useActiveDesktopId()`
  - `useActiveMonitorId()`
  - `useTaskbar()`
  - `useVisibleWindows()`

## 5. Current Limits

These examples intentionally stay within currently implemented features:

- multiple isolated desktops
- multiple monitors per desktop
- owner-scoped modal windows
- monitor-edge snapping only when `monitor.snap.threshold` is configured
- keyboard navigation currently covers focus traversal only
- there is no backdrop-dismiss behavior in the core
