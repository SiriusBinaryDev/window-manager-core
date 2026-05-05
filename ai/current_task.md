# Current Task

## Title

- Expose edge and corner resizing in the playground

## Status

- Ready to start

## Objective

- Update the playground UI so windows can be resized by dragging edges and corners, reusing the resize-edge support that already exists in the core

## Context

- The fixed publish-gate feature list is complete:
  - multi-desktop support
  - multi-monitor support
  - modal windows
- The important/core feature set is now done
- The core already supports all resize edges through `ResizeEdge` and `manager.resizeWindow(id, edge, deltaX, deltaY)`
- The current limitation is only in the playground:
  - it renders a single bottom-right resize handle
  - it always calls `resizeWindow(..., 'bottom-right', ...)`
- The user explicitly asked to make edge resizing the next task

## Relevant Files

- `apps/playground/src/App.tsx`
- `apps/playground/src/styles.css`
- `apps/playground/src/App.test.tsx`
- `packages/core/src/types.ts`
- `packages/core/src/math.ts`
- `README.md`
- `docs/examples.md`

## Constraints

- Keep the change scoped to the playground unless a real core gap is discovered
- Preserve the current core resize semantics
- Do not refactor unrelated playground behavior
- If the UI needs a significant interaction-model choice, ask the user before choosing a surprising behavior

## Definition Of Done

- the playground exposes draggable resize handles for edges and corners
- each handle maps to the correct `ResizeEdge`
- existing maximize, minimize, close, drag, and modal flows still work
- tests cover at least one non-bottom-right resize path
- docs and AI continuity files stay consistent if the public demo behavior changes materially

## Notes

- Latest verification passed with direct package typechecks, `pnpm -r test`, and `pnpm build:packages`
