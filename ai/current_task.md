# Current Task

## Title

- Add MIT license and run final checks

## Status

- Completed locally

## Objective

- Resolve the license blocker before publishing.
- Verify that publishable packages include license metadata and license text.
- Run final local checks before the npm token/publish step.

## Context

- MIT was selected as the project license.
- The root repo has `LICENSE`.
- Each publishable package has its own `LICENSE` so `npm pack` includes the license text in package tarballs.

## Relevant Files

- `LICENSE`
- `package.json`
- `packages/core/LICENSE`
- `packages/core/package.json`
- `packages/react/LICENSE`
- `packages/react/package.json`
- `README.md`
- `docs/releasing.md`
- `docs/roadmap.md`

## Constraints

- Keep publishable package metadata explicit.
- Keep package tarballs self-contained with README, LICENSE, package metadata, and built `dist`.
- Do not attempt real publishing until `NPM_TOKEN` and npm scope access are confirmed.

## Definition Of Done

- Root and package-level MIT license files exist.
- Root and publishable package manifests include `"license": "MIT"`.
- README includes a license section.
- Release docs no longer list license selection as an unresolved prerequisite.
- Final checks pass.

## Notes

- Latest verification passed with:
  - `pnpm.cmd -r lint`
  - `pnpm.cmd typecheck`
  - `pnpm.cmd -r test`
  - `pnpm.cmd build`
  - `npm.cmd pack --dry-run` in `packages/core`
  - `npm.cmd pack --dry-run` in `packages/react`
  - `pnpm.cmd changeset -- status`
