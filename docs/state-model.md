# State Model

## Root State

```ts
interface WindowManagerState {
  version: number;
  windows: Record<WindowId, WindowEntity>;
  desktops: Record<DesktopId, DesktopWorkspace>;
  activeDesktopId: DesktopId;
}
```

The root state stores all windows and all desktop workspaces. `activeDesktopId` decides which workspace is currently visible by default.

## Desktop Workspace

```ts
interface DesktopWorkspace {
  id: DesktopId;
  monitors: Record<MonitorId, MonitorState>;
  activeMonitorId: MonitorId;
  orderedWindowIds: WindowId[];
  activeWindowId: WindowId | null;
}
```

Each desktop has its own monitor layout, active monitor, z-order, and active window. This keeps desktop switching isolated and predictable.

## Monitor

```ts
interface MonitorState {
  size: {
    width: number;
    height: number;
  };
  bounds: Bounds;
  snap?: {
    threshold: number;
  };
}
```

`bounds` is the source of truth for geometry. `size` is kept as convenient metadata for consumers. Snapping is optional and applies to the monitor that owns the window.

## Window

```ts
interface WindowEntity {
  id: WindowId;
  desktopId: DesktopId;
  monitorId: MonitorId;
  ownerWindowId?: WindowId;
  title?: string;
  state: {
    minimized: boolean;
    maximized: boolean;
    closed: boolean;
  };
  rect: Rect;
  restoreRect: Rect;
  flags: {
    resizable: boolean;
    movable: boolean;
    closable: boolean;
    minimizable: boolean;
    maximizable: boolean;
  };
}
```

`rect` is the current geometry. `restoreRect` is the geometry used when restoring from maximized or minimized state.

## Key Rules

- Every window belongs to exactly one desktop.
- Every window belongs to exactly one monitor inside that desktop.
- A modal declares `ownerWindowId` and is normalized onto the owner desktop and monitor.
- Only one window can be active per desktop.
- A focusable window is not closed and not minimized.
- `focusWindow(id)` ignores non-focusable windows.
- `focusWindow(id)` switches the active desktop when the target lives in another desktop.
- `focusWindow(id)` updates `activeMonitorId` to the window monitor.
- If a visible modal exists, only the topmost modal can receive focus in that desktop.
- `focusNextWindow()` and `focusPreviousWindow()` cycle focusable windows in the active desktop.
- Minimizing or closing the active window promotes the highest visible window in `orderedWindowIds`.
- Maximizing fills the assigned monitor when `flags.maximizable` is `true`.
- Moving is blocked for maximized windows and windows with `flags.movable: false`.
- Resizing is blocked for maximized windows and windows with `flags.resizable: false`.
- Closing a window marks it `closed`; it does not remove the entity from state.
- Closing an owner also closes modal descendants.
- `setMonitor(payload, desktopId?, monitorId?)` updates one monitor and refits windows assigned to it.
- `setDesktop(payload, desktopId?, monitorId?)` is a compatibility alias for `setMonitor(...)`.
- Hydration migrates old payloads and sanitizes invalid references.

## Version History

- Version `1`: single desktop shape.
- Version `2`: multi-desktop shape.
- Version `3`: multi-monitor shape.
- Version `4`: modal-aware shape.
