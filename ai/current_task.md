# Current Task

## Title

- Expand React/playground interaction coverage beyond persistence and provider-hook wiring

## Status

- Completed

## Objective

- Add DOM-backed tests that exercise real React adapter subscriptions and real playground interactions instead of only server-rendered hook snapshots and persistence bootstrap logic

## Context

- Release validation remains deferred
- Previous non-core coverage only proved provider wiring and persistence bootstrap behavior
- This pass needed to cover actual rerender/subscription behavior and user-driven playground interactions

## Relevant Files

- `packages/react/src/index.tsx`
- `packages/react/tests/index.test.tsx`
- `packages/react/tests/subscription.test.tsx`
- `apps/playground/src/App.tsx`
- `apps/playground/src/App.test.tsx`
- `apps/playground/src/main.tsx`
- `package.json`

## Constraints

- Keep the added test tooling minimal
- Prefer testing real interactions over duplicating core reducer assertions in UI tests
- Keep behavior rules in the core and use adapter/playground tests for integration wiring

## Definition Of Done

- React adapter tests cover live subscription-driven rerenders
- Playground tests cover at least one real UI creation flow and one real restore/focus flow
- The chosen test setup fits the current workspace without introducing a heavyweight UI testing stack
- AI continuity files reflect the result

## Notes

- Completed in this session:
  - added `jsdom` as the minimal DOM test environment dependency
  - extracted the playground UI into `apps/playground/src/App.tsx` so it can be rendered in tests without bootstrapping side effects
  - added a React adapter subscription test that proves hook consumers rerender from manager updates
  - added playground interaction tests for toolbar-driven window creation and taskbar-driven restore
  - fixed a real adapter bug in `packages/react/src/index.tsx` by subscribing `useSyncExternalStore` to the manager state object instead of unstable derived selector outputs
- Verification completed with:
  - `.\\node_modules\\.bin\\vitest.cmd run packages\\react\\tests\\subscription.test.tsx apps\\playground\\src\\App.test.tsx --pool vmThreads --maxWorkers 1`
  - `pnpm.cmd -r test`
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p packages\\react\\tsconfig.json`
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p apps\\playground\\tsconfig.json`
- Next suggested local task from `ai/tasks.md`:
  - add advanced selectors or adapter optimizations if render pressure appears
