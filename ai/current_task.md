# Current Task

## Title

- Formalize focus policy behavior

## Status

- Completed

## Objective

- Turn the existing focus behavior into an explicit product contract so focus traversal, activation, minimize/close promotion, and restore semantics are documented and regression-tested

## Context

- Release validation remains deferred
- The current implementation already had a de facto focus model, but it was only partially documented and lightly tested
- The goal of this pass was to make that behavior explicit rather than invent a new policy

## Relevant Files

- `packages/core/src/reducer.ts`
- `packages/core/tests/core.test.ts`
- `README.md`
- `docs/state-model.md`

## Constraints

- Preserve the current focus behavior chosen by the user
- Keep the logic in `packages/core`
- Prefer clarifying and locking behavior over adding new surface area

## Definition Of Done

- the current focus policy is documented as canonical behavior
- core tests cover the key focus transitions and skip rules
- shared focusability checks are explicit in the reducer
- AI continuity files reflect the completed task

## Notes

- Completed in this session:
  - extracted a shared focusability rule in the reducer for visible, focusable windows
  - added tests for traversal skipping minimized/closed windows
  - added tests for direct focus rejection on minimized windows
  - added tests for active-window promotion on minimize/close
  - added tests for restore bringing a window to front and making it active
  - documented the canonical focus policy in README and `docs/state-model.md`
- Verification completed with:
  - `.\\node_modules\\.bin\\vitest.cmd run packages\\core\\tests\\core.test.ts --pool vmThreads --maxWorkers 1`
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p packages\\core\\tsconfig.json`
  - `pnpm.cmd -r test`
- Next suggested local feature task from `ai/tasks.md`:
  - expand React/playground interaction coverage beyond persistence and provider-hook wiring
