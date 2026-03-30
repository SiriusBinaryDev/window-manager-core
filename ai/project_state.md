# Project State

## Implemented

- AI continuity layer present in `ai/`
- Repository lockfile policy aligned with `pnpm`; `pnpm-lock.yaml` is no longer ignored
- `pnpm-lock.yaml` has been generated after a clean `pnpm install`
- Monorepo with three workspaces:
  - `@window-manager/core`
  - `@window-manager/react`
  - `@window-manager/playground`
- Release/versioning automation now uses Changesets:
  - `@changesets/cli` is installed at the workspace root
  - `.changeset/config.json` is configured for public scoped packages
  - `.github/workflows/release.yml` creates version PRs and publishes when `NPM_TOKEN` is available
  - a real pending changeset exists for the current package changes
- Core window lifecycle commands and reducer cases:
  - create
  - focus
  - move
  - resize
  - maximize
  - minimize
  - restore
  - close
  - set desktop
  - hydrate state
- Desktop snap primitives are implemented in the core:
  - optional desktop-edge snapping via `desktop.snap.threshold`
  - snapping applies to move and resize operations
- Keyboard focus traversal is implemented:
  - core commands and manager methods for next/previous window focus
  - playground buttons and shortcuts for traversal
- Desktop-bound clamping during create, move, resize, restore, and desktop updates
- Hydration sanitization now:
  - validates envelope structure
  - normalizes invalid stacking and active-window references
  - clamps hydrated rects into desktop bounds
  - sanitizes reducer-driven hydrate payloads
- Imperative `createWindowManager()` facade with subscription and persistence helpers
- Core selectors for:
  - single window lookup
  - active window
  - visible windows
  - taskbar items
- React adapter:
  - `WindowManagerProvider`
  - `useWindowManager`
  - `useWindow`
  - `useDesktop`
  - `useTaskbar`
  - `useVisibleWindows`
- Playground supports:
  - window creation
  - pointer drag
  - bottom-right resize
  - focus
  - minimize/maximize/close
  - localStorage persistence via `createWindowManager().serialize()` / `.hydrate()`
  - accessibility affordances such as roles, labels, focusable windows, and visible focus rings
- Source-level TypeScript resolution now works across the workspace through root `tsconfig` path mappings
- README now includes a concise public API reference for `@window-manager/core` and `@window-manager/react`
- `docs/examples.md` now documents multiple concrete usage paths for the current API
- Core test coverage exists for lifecycle, z-order, min-size enforcement, serialization, malformed hydration, closed-window restore, and maximize bounds

## In Progress

- No active product feature work inferred from the current worktree

## Not Implemented

- Performance work for large window counts
- Multi-desktop support
- Multi-monitor support
- Modal windows / advanced focus policies

## Known Issues / Risks

- Window capability flags currently cover only `resizable`, `movable`, and `closable`
- Tests are present only for `packages/core`; no React or playground tests were found
- Hydration policy is still an open design choice:
  - current behavior sanitizes many invalid payload details
  - fundamentally invalid structures are rejected with `null`
- `pnpm typecheck` from the root still fails in this Windows environment with a shell/process error from recursive `pnpm`, even though direct `tsc` runs for each package succeed
- Release publishing still depends on external setup:
  - `NPM_TOKEN` must exist in GitHub Actions secrets
  - public package access is currently inferred from the package scope and library intent

## Current Development Focus

- Inferred focus from repo docs and backlog artifacts:
  - improve test and verification coverage beyond direct package-level checks
  - validate the new release scaffolding in real CI/publishing credentials
  - expand non-core coverage beyond the current core-only tests

## Notes For Next Session

- Start in `packages/core` for any behavior change; update React/playground only after the core API is settled
- Hydration hardening was implemented in `packages/core/src/serialization.ts` and enforced in `packages/core/src/reducer.ts`
- Workspace setup was repaired by reinstalling with `pnpm`; root `package-lock.json` was removed and `pnpm-lock.yaml` was generated
- Root `tsconfig.base.json` now maps `@window-manager/core` and `@window-manager/react` to source entry points
- README public API documentation was added based on current exports only
- `docs/examples.md` adds imperative, reducer, and React persistence examples without creating a second app
- Desktop snapping is implemented in `packages/core` and documented in `docs/examples.md`
- Keyboard focus traversal is implemented in `packages/core` and exposed in the playground via buttons and `Alt+Shift+ArrowLeft/ArrowRight`
- Playground accessibility was improved with labels, roles, focusable windows, and visible focus styles
- Changesets now manages versioning:
  - root scripts: `pnpm changeset`, `pnpm version-packages`, `pnpm release`
  - release workflow: `.github/workflows/release.yml`
  - pending release entry: `.changeset/bright-tables-shave.md`
- Direct typechecks passed with:
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p packages\\core\\tsconfig.json`
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p packages\\react\\tsconfig.json`
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p apps\\playground\\tsconfig.json`
- The targeted core suite passed via:
  - `.\\node_modules\\.bin\\vitest.cmd run packages\\core\\tests\\core.test.ts --pool vmThreads --maxWorkers 1`
- Playground persistence was updated in `apps/playground/src/main.tsx` to reuse `instance.serialize()`
- `changeset status` passed after adding the pending release note
