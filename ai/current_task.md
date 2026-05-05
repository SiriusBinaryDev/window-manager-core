# Current Task

## Title

- Release validation for the first publishable feature set

## Status

- Ready to start

## Objective

- Validate the completed core feature set and release workflow before the first public publish

## Context

- The fixed publish-gate feature list is complete:
  - multi-desktop support
  - multi-monitor support
  - modal windows
- The important/core feature set is now done, so work can move to release validation
- Modal support is implemented:
  - modal windows use `ownerWindowId`
  - a modal inherits the desktop and monitor of its owner
  - only the topmost visible modal in a desktop can receive focus or participate in traversal
  - closing an owner window also closes its modal descendants
  - persisted state version is now `4`
  - version `1`, `2`, and `3` payloads migrate into the current state shape
- The playground regression where minimize, maximize, and close buttons did not work was fixed by isolating those controls from the drag surface and covering them with tests

## Relevant Files

- `.github/workflows/release.yml`
- `docs/releasing.md`
- `README.md`
- `package.json`
- `packages/core/package.json`
- `packages/react/package.json`
- `.changeset/`

## Constraints

- Do not re-open unrelated feature work during release validation
- Keep release changes scoped to packaging, workflow, documentation, and verification
- Ask the user before making any publish-policy or versioning workflow change that is not already implied by the current Changesets setup

## Definition Of Done

- release docs match the implemented API
- package metadata and build outputs are coherent
- release workflow assumptions are explicit
- remaining publish blockers are documented clearly if external access is still required

## Notes

- Latest verification passed with direct package typechecks, `pnpm -r test`, and `pnpm build:packages`
