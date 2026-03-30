# Current Task

## Title

- Add at least basic tests for the React adapter and/or the playground integration

## Status

- Not started

## Objective

- Add non-core verification so regressions in the React adapter or playground can be caught without relying only on manual testing

## Context

- Hydration hardening, workspace repair, serializer alignment, API docs, usage examples, release scaffolding, desktop snapping, focus traversal, and accessibility improvements are complete
- README now documents the exported public APIs for `@window-manager/core` and `@window-manager/react`
- `docs/examples.md` now documents multiple concrete usage paths without adding another app
- The next quality gap in `ai/tasks.md` is non-core test coverage
- This next task is inferred from `ai/tasks.md`

## Relevant Files

- `packages/react/src/index.tsx`
- `apps/playground/src/main.tsx`
- `packages/core/tests/core.test.ts`
- `package.json`
- `ai/tasks.md`

## Constraints

- Prefer the smallest test scaffold that fits the repo
- Keep business rules tested primarily in `packages/core`; adapter tests should cover wiring and integration
- Avoid introducing a heavyweight test framework unless the current toolchain cannot cover the target area

## Definition Of Done

- There is at least one concrete automated test path beyond the existing core reducer/math coverage
- The chosen test location and approach fit the current workspace and tooling
- The change is reflected in the AI continuity files

## Notes

- Previous inferred task completed:
  - hydrated state sanitization now validates structure, repairs ordering, and clamps rects
  - playground persistence now stores `instance.serialize()` output instead of rebuilding the JSON envelope
  - README now documents the current exported APIs of `@window-manager/core` and `@window-manager/react`
  - `docs/examples.md` now documents multiple implementation-backed usage paths
  - Changesets now manages versioning and release scaffolding for the workspace packages
  - desktop-edge snapping is implemented in the core and covered by tests
  - keyboard focus traversal is implemented in the core and exposed in the playground
  - playground accessibility was improved with labels, roles, and visible focus cues
- Targeted core verification succeeded with:
  - `.\\node_modules\\.bin\\vitest.cmd run packages\\core\\tests\\core.test.ts --pool vmThreads --maxWorkers 1`
- Direct package-level typechecks now pass for `core`, `react`, and `playground`
