# Current Task

## Title

- Improve accessibility in the playground and future examples

## Status

- Not started

## Objective

- Improve keyboard and screen-reader affordances in the demo and docs without moving business logic out of the headless core

## Context

- Hydration hardening, workspace repair, serializer alignment, API docs, usage examples, release scaffolding, desktop snapping, and focus traversal are complete
- README now documents the exported public APIs for `@window-manager/core` and `@window-manager/react`
- `docs/examples.md` now documents multiple concrete usage paths without adding another app
- The next quality gap in `ai/tasks.md` is accessibility in the playground/examples
- This next task is inferred from `ai/tasks.md`

## Relevant Files

- `apps/playground/src/main.tsx`
- `apps/playground/src/styles.css`
- `README.md`
- `docs/examples.md`
- `ai/tasks.md`

## Constraints

- Keep business rules in `packages/core`; accessibility affordances belong in adapters/examples
- Prefer additive semantics such as labels, roles, and focus hints over visual-only changes
- Preserve the current playground interactions while making them more accessible

## Definition Of Done

- Playground UI exposes clearer semantics and controls for keyboard/screen-reader users
- Example/docs text reflects the accessible interaction model where relevant
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
- Targeted core verification succeeded with:
  - `.\\node_modules\\.bin\\vitest.cmd run packages\\core\\tests\\core.test.ts --pool vmThreads --maxWorkers 1`
- Direct package-level typechecks now pass for `core`, `react`, and `playground`
