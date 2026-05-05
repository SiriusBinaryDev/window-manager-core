# Backlog

## Now

- Validate the release workflow with real CI secrets when publishing is intended
  - local workflow hardening and operator docs are complete
  - external publish validation is still pending on secrets and npm access

## Next

- Improve performance for larger numbers of windows

## Later

- Expand React/playground interaction coverage beyond persistence and provider-hook wiring
- Expand window flags if minimization/maximization capabilities need to be configurable
- Formalize focus policy behavior
- Add advanced selectors or adapter optimizations if render pressure appears
- Add semantic changelog/release notes workflow if publishing is enabled

## Icebox

- Multi-desktop
- Multi-monitor
- Advanced focus policies
- Modal windows
- Undo / redo
- Animations
- Docking
- Plugin system

## Open Questions

- Should invalid persisted state be rejected outright or sanitized into a safe state?
- Should `close` continue to retain closed windows in state long term?
- Are `minimizable` and `maximizable` flags needed, or is the current fixed behavior intentional?
- Should examples live under a new app or remain part of the playground workflow?
- Should the project enforce full desktop containment for windows by default, or allow partial overflow?
- Is `orderedWindowIds` sufficient long term for z-order, or should stacking use a different model if complexity grows?
- If persistence versioning evolves, what migration strategy should be used for older saved state?
- Which behaviors belong in the core versus UI adapters as interaction features expand?
