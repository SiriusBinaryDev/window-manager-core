# Current Task

## Title

- English docs and complete styled playground

## Status

- Completed locally

## Objective

- Convert human-facing docs to complete English documentation.
- Improve playground styling and expose all implemented features through the UI.
- Make the playground maximize button restore the original size when pressed again.
- Address the monitor/desktop ownership question without making an unapproved breaking state-model migration.

## Context

- The core feature set is complete and verified.
- The current state model is desktop-owned monitors:
  - each desktop workspace owns `monitors`, `activeMonitorId`, z-order, and active window
  - this keeps desktop switching isolated and persistence simpler
- A global monitor-owned desktop model is valid but would be a breaking architecture migration.

## Relevant Files

- `README.md`
- `docs/architecture.md`
- `docs/state-model.md`
- `docs/roadmap.md`
- `packages/core/README.md`
- `packages/react/README.md`
- `apps/playground/src/App.tsx`
- `apps/playground/src/styles.css`
- `apps/playground/src/App.test.tsx`
- `.changeset/bright-tables-shave.md`
- `.gitignore`

## Constraints

- Keep core state model unchanged unless the user explicitly approves a breaking migration.
- Keep playground behavior delegated to the public manager API.
- Keep docs and package READMEs in English.

## Definition Of Done

- Human-facing docs are in English.
- README explains install, core usage, React usage, manager API, selectors, hooks, and playground.
- Architecture docs explain why desktops currently own monitors.
- Playground is styled and exposes lifecycle, capabilities, focus traversal, desktops, monitors, monitor snapping, monitor resizing, modals, taskbar, persistence, selectors/state readouts, drag, and resize.
- Maximize toggles restore in the playground UI.
- Tests cover the new fixed-window, snap-toggle, and maximize-toggle behavior.
- Verification passes.

## Notes

- Playground dev server was started at `http://localhost:5175/`; Vite selected 5175 because 5173 and 5174 were already in use.
- Latest verification passed with:
  - `pnpm.cmd -r lint`
  - `pnpm.cmd typecheck`
  - `pnpm.cmd -r test`
  - `pnpm.cmd build`
  - `.\\node_modules\\.bin\\tsc.cmd --noEmit -p apps\\playground\\tsconfig.json`
  - `.\\node_modules\\.bin\\vitest.cmd run apps\\playground\\src\\App.test.tsx`
