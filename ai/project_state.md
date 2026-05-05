# Project State

## Implemented

- AI continuity layer present in `ai/`
- Monorepo with three workspaces:
  - `@window-manager/core`
  - `@window-manager/react`
  - `@window-manager/playground`
- Release/versioning automation uses Changesets
- Core window lifecycle commands and reducer cases:
  - create
  - focus
  - move
  - resize
  - maximize
  - minimize
  - restore
  - close
  - hydrate state
- Desktop and monitor topology commands exist:
  - `createDesktop(id, desktop?)`
  - `switchDesktop(id)`
  - `createMonitor(id, monitor?, desktopId?)`
  - `switchMonitor(id, desktopId?)`
  - `setMonitor(payload, desktopId?, monitorId?)`
  - `setDesktop(payload, desktopId?, monitorId?)` as a compatibility alias
- Window capabilities cover:
  - `resizable`
  - `movable`
  - `closable`
  - `minimizable`
  - `maximizable`
- Desktop-edge snapping is implemented per monitor through `monitor.snap.threshold`
- Core reducer hot paths still avoid common no-op updates
- Keyboard focus traversal is implemented
- Multi-desktop support is implemented:
  - each window belongs to exactly one desktop through `window.desktopId`
  - state stores `desktops` plus `activeDesktopId`
  - each desktop keeps its own `orderedWindowIds` and `activeWindowId`
  - `focusWindow(id)` and `restoreWindow(id)` auto-switch desktops when needed
- Multi-monitor support is implemented:
  - each desktop workspace now owns `monitors` and `activeMonitorId`
  - each window belongs to exactly one monitor through `window.monitorId`
  - new windows default to the active monitor in the target desktop
  - `focusWindow(id)`, `restoreWindow(id)`, active-window promotion, and traversal move `activeMonitorId` to the focused window's monitor when needed
  - create, move, resize, maximize, restore, and monitor updates now clamp against the assigned monitor bounds
  - version `2` payloads migrate into a default monitor per desktop
  - version `1` payloads still migrate into the `default` desktop and `default` monitor
- Modal windows are implemented:
  - modal windows use `ownerWindowId`
  - a modal inherits the desktop and monitor of its owner
  - only the topmost visible modal in a desktop can receive focus or participate in traversal
  - closing an owner window also closes its modal descendants
  - persisted state version is now `4`
  - version `3` payloads migrate into the current modal-aware shape
- Hydration sanitization validates structure, normalizes references, and clamps hydrated rects into monitor bounds
- Imperative `createWindowManager()` facade with subscription and persistence helpers
- Core selectors for:
  - single window lookup
  - desktop lookup
  - active desktop lookup
  - desktop list lookup
  - monitor lookup
  - active monitor lookup
  - active window
  - visible windows
  - taskbar items
- React adapter:
  - `WindowManagerProvider`
  - `useWindowManager`
  - `useWindow`
  - `useMonitor`
  - `useDesktop` as compatibility alias for the active monitor
  - `useDesktops`
  - `useActiveDesktopId`
  - `useActiveMonitorId`
  - `useTopModalWindow`
  - `useTaskbar`
  - `useVisibleWindows`
- Playground supports:
  - window creation
  - modal window creation from the active window
  - desktop creation and switching
  - monitor creation and switching within the active desktop
  - modal backdrop rendering
  - pointer drag
  - bottom-right resize only
  - focus
  - minimize, maximize, close
  - localStorage persistence
- README and docs reflect the multi-monitor API
- Test coverage includes:
  - core lifecycle, focus, snapping, serialization, migration, and monitor-aware behavior
  - React adapter provider/hook wiring and live subscription rerenders
  - playground persistence plus desktop and monitor UI interactions

## In Progress

- Release workflow hardening is complete locally, but full publish validation is still blocked on repository secrets and npm publish access

## Not Implemented

- Advanced focus policies beyond the current modal rules

## Known Issues / Risks

- UI-side automated coverage is still basic compared with the core coverage
- Hydration policy still favors sanitizing many invalid details instead of rejecting every imperfect payload
- `pnpm typecheck` from the root still fails in this Windows environment with a recursive `pnpm` shell/process issue, even though direct package `tsc --noEmit` runs succeed
- Release publishing still depends on external setup:
  - `NPM_TOKEN` must exist in GitHub Actions secrets
  - publish access must exist for the package scope

## Current Development Focus

- The important/core feature set is complete
- Next requested UI task: expose edge and corner resizing in the playground using the existing core `ResizeEdge` support
- Revisit release validation after that scoped playground improvement

## Notes For Next Session

- Start in `packages/core` for any behavior change; update React and playground only after the core API is settled
- For the current next task, start in `apps/playground/src/App.tsx` because the core resize behavior is already implemented
- Commit each completed feature in its own separate commit
- Ask the user before making an important implementation decision when more than one reasonable direction exists
- Direct typechecks passed with:
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p packages\\core\\tsconfig.json`
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p packages\\react\\tsconfig.json`
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p apps\\playground\\tsconfig.json`
- Workspace tests passed with:
  - `pnpm.cmd -r test`
- Publishable package builds passed with:
  - `pnpm.cmd build:packages`
