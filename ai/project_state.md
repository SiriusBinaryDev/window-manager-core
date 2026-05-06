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
  - create, move, resize, maximize, restore, and monitor updates now fit windows inside the assigned monitor bounds
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
  - fixed capability window creation
  - modal window creation from the active window
  - desktop creation and switching
  - monitor creation and switching within the active desktop
  - monitor snapping toggle
  - monitor bounds resizing
  - modal backdrop rendering
  - pointer drag
  - edge and corner pointer resize handles
  - focus traversal
  - minimize, maximize/restore toggle, close
  - selector/state readouts
  - localStorage persistence
- Human-facing docs and package READMEs are in English and reflect the multi-monitor API
- Architecture docs document the desktop-owned monitor model and the tradeoff versus global monitor ownership
- Publishable packages include package-level README files for npm package pages
- Publishable package metadata includes descriptions, keywords, repository, homepage, bugs, public publish config, and `sideEffects: false`
- Test coverage includes:
  - core lifecycle, focus, snapping, serialization, migration, monitor-aware behavior, and runtime containment for oversized/invalid rects
  - React adapter provider/hook wiring and live subscription rerenders
  - playground persistence plus desktop and monitor UI interactions

## In Progress

- Release workflow hardening is complete locally, but full publish validation is still blocked on a license decision, repository secrets, and npm publish access

## Not Implemented

- Advanced focus policies beyond the current modal rules

## Known Issues / Risks

- UI-side automated coverage is still basic compared with the core coverage
- Hydration policy still favors sanitizing many invalid details instead of rejecting every imperfect payload
- Some recursive `pnpm` commands can fail inside the Windows sandbox with shell/process startup errors, but rerunning with approval outside the sandbox passes
- Release publishing still depends on external setup:
  - a license must be chosen and documented before public publishing
  - `NPM_TOKEN` must exist in GitHub Actions secrets
  - publish access must exist for the package scope
  - the `@window-manager/core` and `@window-manager/react` package names returned 404 from the public npm registry on 2026-05-06

## Current Development Focus

- The important/core feature set is complete
- Full repository audit and local publish preparation are complete
- English documentation and styled playground completion are complete
- Revisit release validation when a license is chosen and repository secrets/npm publish access are available

## Notes For Next Session

- Start in `packages/core` for any behavior change; update React and playground only after the core API is settled
- For release workflow validation, confirm the external prerequisites before running publish-oriented commands
- Commit each completed feature in its own separate commit
- Ask the user before making an important implementation decision when more than one reasonable direction exists
- Latest verification passed with:
  - `pnpm.cmd -r lint`
  - `pnpm.cmd typecheck`
  - `pnpm.cmd -r test`
  - `pnpm.cmd build`
  - `.\\node_modules\\.bin\\vitest.cmd run apps\\playground\\src\\App.test.tsx`
  - `npm.cmd pack --dry-run` in `packages/core`
  - `npm.cmd pack --dry-run` in `packages/react`
  - `pnpm.cmd changeset -- status`
- Direct package typechecks also passed with:
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p packages\\core\\tsconfig.json`
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p packages\\react\\tsconfig.json`
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p apps\\playground\\tsconfig.json`
