# Architecture

## Principles

1. The core package is headless: no DOM, no React, and no browser-only APIs.
2. Business rules live in the reducer and geometry helpers.
3. State is serializable, versioned, and inspectable.
4. Commands provide a stable reducer integration surface.
5. `createWindowManager()` provides a small imperative facade for apps that do not want to wire the reducer manually.
6. Selectors centralize derived reads.

## Packages

### `@window-manager/core`

- `types.ts`: public domain contracts.
- `commands.ts`: typed command factories.
- `reducer.ts`: window lifecycle, focus, workspace, monitor, modal, and persistence rules.
- `selectors.ts`: derived reads such as visible windows, taskbar items, active workspace, and active monitor.
- `math.ts`: movement, resize, snapping, minimum size, and monitor bounds helpers.
- `serialization.ts`: serialization, hydration, migrations, and state sanitization.
- `createWindowManager.ts`: imperative API with subscriptions and persistence helpers.

### `@window-manager/react`

- Provides `WindowManagerProvider`.
- Exposes hooks backed by `useSyncExternalStore`.
- Does not duplicate core rules.

### `@window-manager/playground`

- Private Vite + React demo.
- Uses the workspace packages through their public imports.
- Demonstrates every implemented feature in a browser.

## Naming

The public concept is now **workspace**. A workspace is the virtual environment that owns windows, z-order, active window, monitor layout, and active monitor.

The serialized state and older APIs still use **desktop** names for compatibility:

- `desktops`
- `activeDesktopId`
- `window.desktopId`
- `createDesktop`
- `switchDesktop`
- `getDesktops`
- `useDesktops`

New code should prefer the workspace aliases:

- `createWorkspace`
- `switchWorkspace`
- `getWorkspaces`
- `useWorkspaces`

## State Ownership

The root state contains:

- `windows`
- `desktops`
- `activeDesktopId`

Each workspace contains:

- `monitors`
- `activeMonitorId`
- `orderedWindowIds`
- `activeWindowId`

Each window belongs to exactly one workspace and one monitor.

## Why Workspaces Own Monitors

The current model treats a workspace as an isolated environment. That environment owns its monitor layout, active monitor, window order, and active window. This makes switching workspaces simple because one state branch contains everything needed to render that workspace.

An operating-system-style model often treats monitors as global hardware and workspaces as views shown on top of those monitors. That model is valid, but it has different tradeoffs:

- global monitor changes would fan out to every workspace
- each monitor could need a separate active workspace
- focus traversal would need to decide whether it is per-monitor, per-workspace, or global
- persistence migrations would be more complex

For this library, workspace-owned monitors keep the core smaller and keep workspace isolation explicit. If global hardware monitors become a required feature, the next step should be a planned state-model migration rather than a naming cleanup.

## Focus And Z-Order

- `orderedWindowIds` is the z-order for one workspace.
- The last id in `orderedWindowIds` is the topmost window.
- Only non-closed and non-minimized windows can receive focus.
- `focusWindow(id)` brings the window to front.
- Focusing or restoring a window in another workspace switches to that workspace.
- Focusing or restoring a window on another monitor updates `activeMonitorId`.
- `focusNextWindow()` and `focusPreviousWindow()` cycle visible windows in the active workspace.

## Modals

- A modal is a normal window with `ownerWindowId`.
- The modal inherits the owner's workspace and monitor.
- Only the topmost visible modal in a workspace can receive focus while it exists.
- Closing an owner closes its modal descendants.

## Geometry

- `moveWindow()` moves a window by deltas.
- `resizeWindow()` resizes from one of eight edges or corners.
- Minimum size is enforced by the core.
- Runtime create, move, resize, restore, hydrate, and monitor updates fit windows inside monitor bounds.
- Optional snapping is configured per monitor with `monitor.snap.threshold`.

## Persistence

- `serialize()` produces a versioned JSON envelope.
- `hydrate()` parses, migrates, and sanitizes persisted state.
- Current state version is `4`.
- Versions `1`, `2`, and `3` migrate into the current model.
