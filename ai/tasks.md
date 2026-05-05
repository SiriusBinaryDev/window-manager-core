# Backlog

## Publish-Gate Features

- Multi-desktop support
- Multi-monitor support
- Modal windows

## Now

- Validate the release workflow with real CI secrets when publishing is intended
  - local workflow hardening and operator docs are complete
  - external publish validation is deferred for now

## Next

- Add advanced selectors or adapter optimizations if render pressure appears
- Improve performance for larger numbers of windows if new measured hotspots appear

## Later

- Advanced focus policies
- Undo / redo
- Animations
- Docking
- Plugin system

## Open Questions

- Should invalid persisted state be rejected outright or sanitized into a safe state?
- Should `close` continue to retain closed windows in state long term?
- Should examples live under a new app or remain part of the playground workflow?
- Should the project enforce full monitor containment for windows by default, or allow partial overflow?
- Is `orderedWindowIds` sufficient long term for z-order, or should stacking use a different model if complexity grows?
- If persistence versioning evolves again, what migration strategy should be used for older saved state?
- Which modal behaviors belong in the core versus UI adapters as interaction features expand?
