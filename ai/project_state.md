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
  - CI and release installs now use `pnpm install --frozen-lockfile`
  - release runs now use workflow concurrency to avoid overlapping publish jobs on the same ref
  - a real pending changeset exists for the current package changes
- Release preflight now includes:
  - root script `pnpm build:packages` for the publishable packages only
  - expanded operator documentation in `docs/releasing.md`
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
- Window capabilities now cover:
  - `resizable`
  - `movable`
  - `closable`
  - `minimizable`
  - `maximizable`
- Desktop snap primitives are implemented in the core:
  - optional desktop-edge snapping via `desktop.snap.threshold`
  - snapping applies to move and resize operations
- Core reducer hot paths now avoid several no-op updates:
  - focusing the already active front window returns the same state
  - zero-delta moves and unchanged clamped resizes return the same state
  - single-window focus rotation returns the same state
  - `SET_DESKTOP` batches changed windows in one pass and skips unchanged desktop updates
- Keyboard focus traversal is implemented:
  - core commands and manager methods for next/previous window focus
  - playground buttons and shortcuts for traversal
  - focus policy is now explicit:
    - only visible windows can receive focus
    - traversal skips minimized and closed windows
    - minimizing or closing the active window promotes the topmost remaining visible window
    - restoring a window brings it to front and makes it active
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
  - adapter subscriptions now use stable manager-state snapshots before applying selectors, avoiding rerender loops for derived arrays
- Playground supports:
  - window creation
  - pointer drag
  - bottom-right resize
  - focus
  - minimize/maximize/close
  - disabled action controls when window capabilities disallow minimize/maximize/close
  - localStorage persistence via `createWindowManager().serialize()` / `.hydrate()`
  - accessibility affordances such as roles, labels, focusable windows, and visible focus rings
- Playground persistence bootstrap is isolated in `apps/playground/src/persistence.ts` and covered by tests
- Source-level TypeScript resolution now works across the workspace through root `tsconfig` path mappings
- Vitest workspace source resolution is configured through:
  - root `vitest.config.ts`
  - matching aliases in `apps/playground/vite.config.ts`
- README now includes a concise public API reference for `@window-manager/core` and `@window-manager/react`
- `docs/examples.md` now documents multiple concrete usage paths for the current API
- Test coverage now includes:
  - core lifecycle, z-order, min-size enforcement, serialization, malformed hydration, closed-window restore, and maximize bounds
  - React adapter provider/hook wiring, missing-provider failure, and live subscription rerenders
  - playground persistence hydration/write-back plus DOM interaction coverage for create and restore flows

## In Progress

- Release workflow hardening is complete locally, but full publish validation is still blocked on repository secrets and npm publish access

## Not Implemented

- Multi-desktop support
- Multi-monitor support
- Modal windows / advanced focus policies

## Known Issues / Risks

- UI-side automated coverage is still basic:
  - React tests currently validate server-rendered hook/provider wiring only
  - playground tests currently validate persistence bootstrap only, not pointer or keyboard interactions
- Hydration policy is still an open design choice:
  - current behavior sanitizes many invalid payload details
  - fundamentally invalid structures are rejected with `null`
- `pnpm typecheck` from the root still fails in this Windows environment with a shell/process error from recursive `pnpm`, even though direct `tsc` runs for each package succeed
- Release publishing still depends on external setup:
  - `NPM_TOKEN` must exist in GitHub Actions secrets
  - public package access is currently inferred from the package scope and library intent

## Current Development Focus

- Inferred focus from repo docs and backlog artifacts:
  - add more performance work only if further hotspots appear after measurement
  - add advanced selectors or adapter optimizations if render pressure appears
  - revisit release validation later when publishing is back in scope

## Notes For Next Session

- Start in `packages/core` for any behavior change; update React/playground only after the core API is settled
- Commit each completed feature in its own separate commit
- Ask the user before making an important implementation decision when more than one reasonable direction exists
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
  - release preflight script: `pnpm build:packages`
  - release workflow: `.github/workflows/release.yml`
  - pending release entry: `.changeset/bright-tables-shave.md`
- CI and release workflows now install with:
  - `pnpm install --frozen-lockfile`
- Release documentation now includes:
  - current publish-on-`main` behavior
  - repository secret prerequisites
  - a release readiness checklist in `docs/releasing.md`
- Direct typechecks passed with:
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p packages\\core\\tsconfig.json`
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p packages\\react\\tsconfig.json`
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p apps\\playground\\tsconfig.json`
- The targeted core suite passed via:
  - `.\\node_modules\\.bin\\vitest.cmd run packages\\core\\tests\\core.test.ts --pool vmThreads --maxWorkers 1`
- The workspace test command now passes with:
  - `pnpm.cmd -r test`
- The latest core performance pass was verified with:
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p packages\\core\\tsconfig.json`
  - `pnpm.cmd -r test`
- Publishable package builds now pass with:
  - `pnpm.cmd build:packages`
- Direct typechecks still pass for the touched non-core packages:
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p packages\\react\\tsconfig.json`
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p apps\\playground\\tsconfig.json`
- Playground persistence was updated in `apps/playground/src/main.tsx` to reuse `instance.serialize()`
- Playground persistence setup now lives in `apps/playground/src/persistence.ts`
- React adapter coverage now lives in `packages/react/tests/index.test.tsx`
- React adapter live subscription coverage now also lives in `packages/react/tests/subscription.test.tsx`
- Playground coverage now lives in `apps/playground/src/persistence.test.ts`
- Playground DOM interaction coverage now also lives in `apps/playground/src/App.test.tsx`
- The latest core performance pass optimized `packages/core/src/reducer.ts` to preserve state identity for common no-op operations and to batch desktop updates
- Window capabilities now include `minimizable` and `maximizable`, with core enforcement and matching disabled controls in the playground
- Focus policy is now documented and covered by core regression tests
- `changeset status` passed after adding the pending release note
