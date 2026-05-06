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
- `reducer.ts`: window lifecycle, focus, desktop, monitor, modal, and persistence rules.
- `selectors.ts`: derived reads such as visible windows, taskbar items, active desktop, and active monitor.
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

## State Ownership

The root state contains:

- `windows`
- `desktops`
- `activeDesktopId`

Each desktop workspace contains:

- `monitors`
- `activeMonitorId`
- `orderedWindowIds`
- `activeWindowId`

Each window belongs to exactly one desktop and one monitor.

## Why Desktops Own Monitors

The current model treats a desktop as an isolated workspace. That workspace owns its monitor layout, active monitor, window order, and active window. This makes switching desktops simple because one state branch contains everything needed to render that workspace.

An operating-system-style model often treats monitors as global hardware and desktops as workspaces shown on top of those monitors. That model is valid, but it has a different set of tradeoffs:

- global monitor changes would fan out to every desktop
- each monitor could need a separate active desktop
- focus traversal would need to decide whether it is per-monitor, per-desktop, or global
- persistence migrations would be more complex

For this library, desktop-owned monitors keep the core smaller and keep multi-desktop isolation explicit. If global hardware monitors become a required feature, the next step should be a planned state-model migration rather than a small refactor.

## Focus And Z-Order

- `orderedWindowIds` is the z-order for one desktop.
- The last id in `orderedWindowIds` is the topmost window.
- Only non-closed and non-minimized windows can receive focus.
- `focusWindow(id)` brings the window to front.
- Focusing or restoring a window on another desktop switches to that desktop.
- Focusing or restoring a window on another monitor updates `activeMonitorId`.
- `focusNextWindow()` and `focusPreviousWindow()` cycle visible windows in the active desktop.

## Modals

- A modal is a normal window with `ownerWindowId`.
- The modal inherits the owner's desktop and monitor.
- Only the topmost visible modal in a desktop can receive focus while it exists.
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
