# Current Task

## Title

- Validate the release workflow with real CI secrets when publishing is intended

## Status

- In progress

## Objective

- Harden the existing CI and publish-on-`main` workflow so the repository is operationally ready for a real Changesets-driven release once `NPM_TOKEN` and repository publish permissions are available

## Context

- Non-core React/playground test coverage is complete
- The user chose to keep the current release behavior:
  - pushes to `main` should continue driving the release workflow
  - Changesets should continue opening/updating version PRs
  - merges of prepared version changes should continue publishing when `NPM_TOKEN` is present
- External publish validation is still blocked by secrets and repository-side npm access

## Relevant Files

- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `docs/releasing.md`
- `package.json`
- `.changeset/config.json`
- `.changeset/bright-tables-shave.md`
- `ai/tasks.md`

## Constraints

- Preserve the current publish-on-`main` behavior
- Keep release automation Changesets-based
- Avoid introducing a new release model without explicit user approval
- Distinguish between local setup hardening and true external publish validation

## Definition Of Done

- CI and release workflow steps are aligned with the current repository expectations
- The release path is documented clearly enough for a human to supply secrets and run the first publish
- The remaining external blockers are explicit in the AI continuity files

## Notes

- Completed in this session:
  - aligned CI and release installs to `pnpm install --frozen-lockfile`
  - added release workflow concurrency protection
  - added `pnpm build:packages` as a publishable-package preflight build command
  - expanded `docs/releasing.md` with current behavior, prerequisites, and a release readiness checklist
- Verification completed with:
  - `pnpm.cmd -r test`
  - `pnpm.cmd build:packages`
- Remaining external step:
  - run the release workflow in GitHub with a real `NPM_TOKEN` and package publish permissions
- Next suggested task from `ai/tasks.md` once release credentials are available or this work is deferred:
  - improve performance for larger numbers of windows
