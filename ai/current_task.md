# Current Task

## Title

- Full repository audit and publish preparation

## Status

- Completed locally

## Objective

- Analyze the full repository for core feature coverage, bugs, documentation gaps, pending tasks, and publish readiness.
- Fix local blockers where possible.
- Keep publishing blocked only on external credentials or explicit user decisions.

## Context

- The core feature set is complete:
  - lifecycle
  - focus and z-order
  - movement
  - edge/corner resize
  - multi-desktop
  - multi-monitor
  - modals
  - selectors
  - versioned persistence
- Repository audit found one core containment bug:
  - oversized or invalid created/resized windows could exceed monitor bounds at runtime
- Repository audit also found stale/mojibake human docs and package README gaps for npm publishing.

## Relevant Files

- `packages/core/src/math.ts`
- `packages/core/src/reducer.ts`
- `packages/core/src/serialization.ts`
- `packages/core/tests/core.test.ts`
- `README.md`
- `packages/core/README.md`
- `packages/react/README.md`
- `packages/core/package.json`
- `packages/react/package.json`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/releasing.md`
- `BACKLOG.md`
- `.changeset/bright-tables-shave.md`

## Constraints

- Keep business behavior in `packages/core`.
- Do not invent a license; that is a user/project decision before public publishing.
- Do not publish without npm credentials and explicit publish intent.

## Definition Of Done

- Core feature coverage is audited.
- Identified local bugs are fixed and tested.
- README is simplified for users.
- Publishable package READMEs are included in package tarballs.
- Package metadata is improved without making legal/license decisions.
- Verification passes locally.
- AI continuity files reflect the new state.

## Notes

- Implemented `fitRectToBounds()` and `fitResizedRectToBounds()` to keep created, moved, resized, restored, and monitor-reflowed windows inside monitor bounds.
- Added core tests for oversized creation, non-positive creation dimensions, right-edge resize overflow, and left-edge resize at monitor bounds.
- Fixed existing lint issues in `serialization.ts`.
- Root and package READMEs now describe usage plainly.
- Package metadata now includes description, keywords, homepage, bugs, repository, and `sideEffects: false`.
- `npm view @window-manager/core version` and `npm view @window-manager/react version` returned 404 on 2026-05-06, so the packages are not publicly visible or the current user lacks access to that scope.
- `npm pack --dry-run` for both publishable packages includes `README.md`, `dist/index.js`, `dist/index.d.ts`, and `package.json`.
- Remaining publish blockers:
  - choose and add project license
  - configure `NPM_TOKEN`
  - confirm npm account publish access for the `@window-manager` scope
