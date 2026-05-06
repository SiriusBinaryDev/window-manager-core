# Project Context

## Project

- Name: `window-manager-core`
- Description: Headless frontend library for workspace-based window management in web apps.
- Repository type: TypeScript monorepo with library packages and a demo app.

## Tech Stack

- Language: TypeScript
- Frameworks:
  - Core: framework-agnostic
  - React adapter: React 19
  - Demo app: Vite + React
- Database: None
- Runtime:
  - Tooling/build: Node.js
  - Demo runtime: Browser
- Tooling:
  - Package manager: `pnpm` workspace
  - Build: `tsup` for packages, `vite` for playground
  - Testing: `vitest`
  - Linting/formatting: `eslint`, `prettier`

## Main Entry Points

- Root scripts: `package.json`
- Core public API: `packages/core/src/index.ts`
- React public API: `packages/react/src/index.tsx`
- Playground app entry: `apps/playground/src/main.tsx`

## Important Directories

- `packages/core/src`: headless domain types, commands, reducer, selectors, math, serialization, manager facade
- `packages/core/tests`: core behavior tests
- `packages/react/src`: provider and hooks over the core manager
- `apps/playground/src`: demo UI using the workspace packages
- `docs`: architecture, state model, roadmap
- `ai`: AI continuity layer

## High-Level Architecture

- `@window-manager/core`
  - Pure state machine around `WindowManagerState`
  - Public surface is commands + reducer + selectors + `createWindowManager()`
  - Geometry helpers live in `math.ts`
  - Persistence uses a versioned serialization envelope and sanitizes hydrated state before accepting it
- `@window-manager/react`
  - Thin adapter around the core manager
  - Uses context + `useSyncExternalStore`
  - Exposes hooks for manager, active workspace, active monitor, top modal, workspace list, taskbar, visible windows, single window lookup
- `apps/playground`
  - Real integration sample
  - Creates a manager instance, hydrates from `localStorage`, subscribes for persistence
  - Handles pointer drag/resize in UI and delegates state changes to the core API

## Key Domain Concepts

- `WindowManagerState`: versioned root state with `windows`, `desktops`, and `activeDesktopId`; the desktop field names are retained for serialized compatibility
- `Workspace` / `DesktopWorkspace`: isolated workspace with `monitors`, `activeMonitorId`, `orderedWindowIds`, and `activeWindowId`
- `MonitorState`: monitor size, bounds, and optional snap settings
- `WindowEntity`: window record with compatibility field `desktopId`, `monitorId`, optional `ownerWindowId`, `rect`, `restoreRect`, state flags, and capability flags
- `orderedWindowIds`: explicit z-order model scoped per workspace
- Taskbar items: derived from windows that are not closed in the active or requested workspace
- Visible windows: derived from windows that are not closed and not minimized in the active or requested workspace, optionally filtered to a monitor

## Important Dependencies

- Runtime dependencies:
  - `react`
  - `react-dom`
- Workspace dependency edge:
  - `@window-manager/react` depends on `@window-manager/core`
  - `apps/playground` depends on both workspace packages
- Dev dependencies:
  - `typescript`
  - `tsup`
  - `vite`
  - `vitest`
  - `eslint`
  - `@typescript-eslint/*`
  - `prettier`

## Constraints / Assumptions

- Core must stay headless: no DOM or React dependencies in `packages/core`
- Workspace isolation is the primary ownership model
- Multi-monitor support is per-workspace, not global at the root state
- Modal ownership is owner-scoped inside a workspace and monitor
- Snapping is currently limited to opt-in snapping against monitor edges within each workspace
- Closing a window marks it `closed`; it is not removed from state
- State version is currently `4`
- Human-facing docs and package READMEs are English and should stay workspace-first
- Internal serialized state currently keeps desktop field names for compatibility

## What An AI Must Understand Before Editing

- Business rules belong in `packages/core`; React should stay thin
- Changing window behavior usually means touching reducer, selectors, serialization, and core tests together
- `orderedWindowIds` and `activeWindowId` jointly define focus and stacking behavior inside each workspace
- `activeMonitorId` follows the active window when focus changes across monitors in the same workspace
- The topmost visible modal in a workspace blocks focus to background windows in that workspace
- Persistence format matters because the playground hydrates saved state on startup
- Cross-workspace `focusWindow()` and `restoreWindow()` intentionally switch the active workspace to make the target visible
- Completed feature work should be committed in separate, focused commits
- Important implementation decisions should be surfaced to the user for approval instead of being made implicitly
