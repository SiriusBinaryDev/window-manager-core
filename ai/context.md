# Project Context

## Project

- Name: `window-manager-core`
- Description: Headless frontend library for desktop-style window management in web apps.
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
  - Exposes hooks for manager, active desktop, desktop list, taskbar, visible windows, single window lookup
- `apps/playground`
  - Real integration sample
  - Creates a manager instance, hydrates from `localStorage`, subscribes for persistence
  - Handles pointer drag/resize in UI and delegates state changes to the core API

## Key Domain Concepts

- `WindowManagerState`: versioned root state with `windows`, `desktops`, and `activeDesktopId`
- `DesktopWorkspace`: isolated workspace with `desktop`, `orderedWindowIds`, and `activeWindowId`
- `WindowEntity`: window record with `desktopId`, `rect`, `restoreRect`, state flags, and capability flags
- `DesktopState`: desktop size plus rectangular bounds, with optional snap settings
- `orderedWindowIds`: explicit z-order model scoped per desktop workspace
- Taskbar items: derived from windows that are not closed in the active or requested desktop
- Visible windows: derived from windows that are not closed and not minimized in the active or requested desktop

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
- Desktop model is now isolated multi-desktop workspaces over rectangular desktop bounds
- Desktop snapping is currently limited to opt-in snapping against desktop edges within each workspace
- Closing a window marks it `closed`; it is not removed from state
- State version is currently `2`
- Existing human-facing docs are in Spanish

## What An AI Must Understand Before Editing

- Business rules belong in `packages/core`; React should stay thin
- Changing window behavior usually means touching reducer, selectors, math helpers, and core tests together
- `orderedWindowIds` and `activeWindowId` jointly define focus and stacking behavior inside each desktop workspace
- Persistence format matters because the playground hydrates saved state on startup
- Cross-desktop `focusWindow()` and `restoreWindow()` intentionally switch the active desktop to make the target visible
- Completed feature work should be committed in separate, focused commits
- Important implementation decisions should be surfaced to the user for approval instead of being made implicitly
