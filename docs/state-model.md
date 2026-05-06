# State Model

## Compatibility Note

The public concept is **workspace**. The serialized state still uses `desktop` field names for compatibility with existing persisted state and APIs. Treat `desktopId` as the stored workspace id.

## Root State

```ts
interface WindowManagerState {
  version: number;
  windows: Record<WindowId, WindowEntity>;
  desktops: Record<WorkspaceId, Workspace>;
  activeDesktopId: WorkspaceId;
}
```

The root state stores all windows and all workspaces. `activeDesktopId` is the stored id of the active workspace.

## Workspace

```ts
interface Workspace {
  id: WorkspaceId;
  monitors: Record<MonitorId, MonitorState>;
  activeMonitorId: MonitorId;
  orderedWindowIds: WindowId[];
  activeWindowId: WindowId | null;
}
```

Each workspace has its own monitor layout, active monitor, z-order, and active window. This keeps workspace switching isolated and predictable.

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
  desktopId: WorkspaceId;
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

- Every window belongs to exactly one workspace.
- Every window belongs to exactly one monitor inside that workspace.
- A modal declares `ownerWindowId` and is normalized onto the owner workspace and monitor.
- Only one window can be active per workspace.
- A focusable window is not closed and not minimized.
- `focusWindow(id)` ignores non-focusable windows.
- `focusWindow(id)` switches the active workspace when the target lives elsewhere.
- `focusWindow(id)` updates `activeMonitorId` to the window monitor.
- If a visible modal exists, only the topmost modal can receive focus in that workspace.
- `focusNextWindow()` and `focusPreviousWindow()` cycle focusable windows in the active workspace.
- Minimizing or closing the active window promotes the highest visible window in `orderedWindowIds`.
- Maximizing fills the assigned monitor when `flags.maximizable` is `true`.
- Moving is blocked for maximized windows and windows with `flags.movable: false`.
- Resizing is blocked for maximized windows and windows with `flags.resizable: false`.
- Closing a window marks it `closed`; it does not remove the entity from state.
- Closing an owner also closes modal descendants.
- `setMonitor(payload, workspaceId?, monitorId?)` updates one monitor and refits windows assigned to it.
- `setDesktop(payload, workspaceId?, monitorId?)` is a compatibility alias for `setMonitor(...)`.
- Hydration migrates old payloads and sanitizes invalid references.

## Version History

- Version `1`: single workspace shape, stored as a legacy desktop.
- Version `2`: multi-workspace shape.
- Version `3`: multi-monitor shape.
- Version `4`: modal-aware shape.
