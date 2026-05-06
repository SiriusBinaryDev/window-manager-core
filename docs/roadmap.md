# Roadmap

## Complete

- Window lifecycle: create, focus, move, resize, maximize, minimize, restore, and close.
- Z-order per desktop.
- Monitor bounds enforcement.
- Optional monitor-edge snapping.
- Versioned persistence with sanitized hydration.
- Multi-desktop workspaces.
- Multi-monitor layouts per desktop.
- Owner-scoped modal windows.
- React provider and hooks.
- Playground with window creation, fixed capability flags, drag, edge/corner resize, focus traversal, desktops, monitors, monitor snapping, monitor resizing, modals, taskbar, and persistence.
- Changesets configuration.
- CI and release workflows.

## Current Publishing Work

- Choose and document the project license.
- Configure `NPM_TOKEN` in GitHub Actions secrets.
- Confirm npm publish access for the `@window-manager` scope.
- Run the release workflow against real repository secrets.

## Next

- Add more selectors if real consumers need them.
- Optimize the React adapter if render pressure is measured.
- Improve performance for very large numbers of windows if benchmarks show a bottleneck.
- Decide whether invalid persisted state should be rejected more strictly or sanitized.
- Decide whether closed windows should remain in state long term.
- Decide whether future examples should stay in the playground or move to a dedicated examples app.

## Later

- Advanced focus policies.
- Undo and redo.
- Animations.
- Docking.
- Plugin system.
