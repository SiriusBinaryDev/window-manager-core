# Backlog

## Publish readiness

- Validate the release workflow in GitHub Actions with repository secrets.
- Add `NPM_TOKEN` with publish access for the `@window-manager` scope.
- Confirm npm access for:
  - `@window-manager/core`
  - `@window-manager/react`
- Choose and add a project license before public publishing.

## Current package surface

- `@window-manager/core`
  - Window lifecycle.
  - Focus and z-order.
  - Movement and edge/corner resize.
  - Desktop and monitor workspaces.
  - Modal ownership rules.
  - Selectors.
  - Versioned serialization and hydration.
- `@window-manager/react`
  - Provider and hooks over the core manager.
- `@window-manager/playground`
  - Private demo app for manual validation.

## Future work

- Advanced focus policies.
- More selectors if real consumers need them.
- React adapter optimizations if render pressure is measured.
- Performance work for large window counts.
- Undo / redo.
- Animations.
- Docking.
- Plugin system.

## Open decisions

- License for public publishing.
- Whether invalid persisted state should be rejected more strictly or sanitized.
- Whether closed windows should stay in state long term.
- Whether examples should remain in the playground or move to a separate app.
- Whether to expose a command for moving an existing window between monitors.
