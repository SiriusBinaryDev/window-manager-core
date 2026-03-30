# Current Task

## Title

- Add keyboard navigation / focus traversal commands in `packages/core` and expose them through React/playground

## Status

- Not started

## Objective

- Add keyboard-driven focus movement and related commands while keeping the behavior rooted in the headless core

## Context

- Hydration hardening, workspace repair, serializer alignment, API docs, usage examples, release scaffolding, and desktop snapping are complete
- README now documents the exported public APIs for `@window-manager/core` and `@window-manager/react`
- `docs/examples.md` now documents multiple concrete usage paths without adding another app
- The next near-term feature gap called out by both `docs/roadmap.md` and `ai/tasks.md` is keyboard navigation / focus traversal
- This next task is inferred from `ai/tasks.md`

## Relevant Files

- `packages/core/src/commands.ts`
- `packages/core/src/reducer.ts`
- `packages/core/src/selectors.ts`
- `packages/core/src/types.ts`
- `packages/react/src/index.tsx`
- `apps/playground/src/main.tsx`
- `packages/core/tests/core.test.ts`
- `docs/roadmap.md`
- `ai/tasks.md`

## Constraints

- Keep navigation behavior inside `packages/core`
- Do not require React-specific behavior to define traversal rules
- Avoid inventing shortcut bindings until the core command surface exists

## Definition Of Done

- Keyboard navigation/focus traversal is implemented and covered by core tests
- Public behavior is documented or discoverable without relying on the playground alone
- The change is reflected in the AI continuity files

## Notes

- Previous inferred task completed:
  - hydrated state sanitization now validates structure, repairs ordering, and clamps rects
  - playground persistence now stores `instance.serialize()` output instead of rebuilding the JSON envelope
  - README now documents the current exported APIs of `@window-manager/core` and `@window-manager/react`
  - `docs/examples.md` now documents multiple implementation-backed usage paths
  - Changesets now manages versioning and release scaffolding for the workspace packages
  - desktop-edge snapping is implemented in the core and covered by tests
- Targeted core verification succeeded with:
  - `.\\node_modules\\.bin\\vitest.cmd run packages\\core\\tests\\core.test.ts --pool vmThreads --maxWorkers 1`
- Direct package-level typechecks now pass for `core`, `react`, and `playground`
