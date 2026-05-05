# Current Task

## Title

- Implement multi-monitor support

## Status

- Ready to start

## Objective

- Extend the workspace model so the manager can reason about more than one monitor while preserving the completed multi-desktop isolation rules

## Context

- Multi-desktop support is complete:
  - each window belongs to exactly one desktop through `window.desktopId`
  - each desktop maintains its own `orderedWindowIds` and `activeWindowId`
  - `createDesktop(id, config?)` and `switchDesktop(id)` now exist
  - `setDesktop(payload, desktopId?)` updates the active desktop by default or a specified desktop when requested
  - old single-desktop persisted state migrates forward into the `default` workspace
  - `focusWindow(id)` and `restoreWindow(id)` auto-switch to the target window's desktop
- The fixed feature-complete publish gate remains:
  - multi-desktop support
  - multi-monitor support
  - modal windows
- When that feature list is complete, tell the user explicitly that the important/core features are done and publishing can move to release validation

## Relevant Files

- `packages/core/src/types.ts`
- `packages/core/src/reducer.ts`
- `packages/core/src/commands.ts`
- `packages/core/src/createWindowManager.ts`
- `packages/core/src/selectors.ts`
- `packages/core/src/serialization.ts`
- `packages/core/tests/core.test.ts`
- `packages/react/src/index.tsx`
- `apps/playground/src/App.tsx`
- `README.md`
- `docs/state-model.md`
- `docs/examples.md`

## Constraints

- Keep the new monitor model compatible with the completed multi-desktop workspace isolation
- Preserve backward compatibility where practical
- Continue migrating persisted state instead of discarding it if the state shape evolves again
- Ask the user before choosing an important monitor-model or focus-behavior decision

## Definition Of Done

- monitor-aware state and commands exist in the core
- selectors and manager methods understand the active monitor model
- persistence and migration strategy stay coherent with the new shape
- the playground exposes a basic monitor-aware flow if the public API changes
- docs and AI continuity files reflect the new behavior

## Notes

- Multi-desktop support was completed and verified with direct package typechecks plus targeted core, React, and playground tests
