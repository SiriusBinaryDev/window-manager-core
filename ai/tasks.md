# Backlog

## Publish-Gate Features

- Multi-workspace support
- Multi-monitor support
- Modal windows

## Now

- Validate the release workflow with real CI secrets when publishing is intended
  - local workflow hardening, docs, package metadata, package READMEs, pack dry-runs, lint, typecheck, tests, and build are complete
  - external publish validation is deferred until license, secrets, and npm access are available
- Choose and add the project license before public publishing
- Configure `NPM_TOKEN` in GitHub Actions secrets
- Confirm npm publish access for the `@window-manager` scope

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
- Should a future major release migrate internal serialized `desktop` field names to `workspace` field names?
- Is `orderedWindowIds` sufficient long term for z-order, or should stacking use a different model if complexity grows?
- If persistence versioning evolves again, what migration strategy should be used for older saved state?
- Which modal behaviors belong in the core versus UI adapters as interaction features expand?
