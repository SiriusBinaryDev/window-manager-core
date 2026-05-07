# Releasing

## Goal

This repository uses Changesets for versioning and release automation.
The release workflow is designed for the `pnpm` workspace and the two publishable packages:

- `@window-manager/core`
- `@window-manager/react`

The current intended behavior is:

- every push to `main` runs the release workflow
- pending changesets cause Changesets to open or update a version PR
- merging the version PR back into `main` triggers the same workflow again
- if `NPM_TOKEN` is configured, that post-version run publishes the prepared package versions to npm

## Prerequisites

- GitHub Actions must be enabled for the repository
- `NPM_TOKEN` must be configured in repository secrets with publish access for the target npm scope
- the npm account behind `NPM_TOKEN` must be allowed to publish `@window-manager/core` and `@window-manager/react`
- the default branch must remain `main`, because both Changesets config and workflow behavior assume it
- `pnpm-lock.yaml` must be committed and in sync, because CI and release install with `--frozen-lockfile`
- the project license must remain documented in `LICENSE` and package metadata

## Local Versioning Flow

1. Create a changeset after a user-facing package change:

```bash
pnpm changeset
```

2. Commit the generated markdown file in `.changeset/`.

3. When changesets are ready to release, apply version bumps locally:

```bash
pnpm version-packages
```

4. Review the updated package versions and changelog entries, then commit them.

5. Merge the version PR or push the approved version commit to `main` to let the release workflow publish.

## Publish Flow

The GitHub workflow in `.github/workflows/release.yml` runs on `main` and can also be started manually.

It performs:

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `changesets/action`

The workflow will:

- open or update a versioning PR when pending changesets exist
- publish to npm when version packages are already prepared and `NPM_TOKEN` is available

The repository also has a separate CI workflow in `.github/workflows/ci.yml`.
It runs the same verification commands without the publish step so routine validation does not depend on release credentials.

## Required Secrets

- `GITHUB_TOKEN`: provided by GitHub Actions
- `NPM_TOKEN`: required for npm publish

## Release Readiness Checklist

Before expecting the first real publish to succeed, verify:

1. `pnpm test` passes in GitHub Actions.
2. `pnpm build` produces `dist` output for both publishable packages.
3. At least one real `.changeset/*.md` entry exists for the package changes being released.
4. `NPM_TOKEN` is stored in repository secrets.
5. The npm token owner has access to the `@window-manager` scope or package names being published.
6. The package license is documented.

## Notes

- Package publish metadata is configured for public scoped packages.
- The package names currently return 404 from the public npm registry, which means they are not publicly published or the current user cannot access them under that scope.
- Built artifacts are published from `dist` only.
- If publishing should stay disabled for now, keep the workflow but do not provide `NPM_TOKEN`.
- In this Windows development environment, `pnpm typecheck` and some recursive `pnpm` commands can fail locally with shell/process issues even though the same commands succeed in GitHub Actions on Ubuntu.
