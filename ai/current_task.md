# Current Task

## Title

- Expand window flags so minimization and maximization capabilities can be configured

## Status

- Completed

## Objective

- Extend the per-window capability model so minimize and maximize behavior can be disabled just like move, resize, and close

## Context

- Release validation is intentionally deferred for now
- The existing capability model only covered `resizable`, `movable`, and `closable`
- The next most necessary feature task was closing that inconsistency in the core API and the playground UI

## Relevant Files

- `packages/core/src/types.ts`
- `packages/core/src/reducer.ts`
- `packages/core/src/serialization.ts`
- `packages/core/tests/core.test.ts`
- `apps/playground/src/main.tsx`
- `README.md`
- `docs/state-model.md`
- `docs/examples.md`

## Constraints

- Keep the feature centered in `packages/core`
- Preserve backward compatibility by defaulting the new capabilities to `true`
- Ensure the playground UI reflects disabled capabilities instead of exposing dead controls

## Definition Of Done

- `WindowFlags` includes `minimizable` and `maximizable`
- core commands respect the new flags
- hydration/serialization preserve and sanitize the new flags
- playground controls reflect disabled minimize/maximize/close behavior
- docs and AI continuity files reflect the new feature

## Notes

- Completed in this session:
  - added `minimizable` and `maximizable` to `WindowFlags`
  - blocked core minimize/maximize commands when the corresponding capability is disabled
  - sanitized hydrated state so disabled capabilities cannot leave windows minimized/maximized inconsistently
  - updated the playground to disable action buttons and ignore drag/resize starts when capabilities are disabled
  - updated README and docs to document the expanded capability model
- Verification completed with:
  - `pnpm.cmd -r test`
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p packages\\core\\tsconfig.json`
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p apps\\playground\\tsconfig.json`
- Next suggested local feature task from `ai/tasks.md`:
  - formalize focus policy behavior
