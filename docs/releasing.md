# Releasing

This repository uses Changesets for package versioning and a tag-driven GitHub Actions workflow for publishing.

Publishable packages:

- `@window-manager/core`
- `@window-manager/react`

## Prerequisites

- GitHub Actions enabled for the repository
- `NPM_TOKEN` stored in repository secrets
- `NPM_TOKEN` can publish public packages under the `@window-manager` npm scope
- the release tag exists on GitHub before running a manual workflow dispatch
- `pnpm-lock.yaml` is committed and in sync

## Package Versioning

Create a changeset for every user-facing package change:

```bash
pnpm changeset
```

When a release is ready, apply the version updates:

```bash
pnpm version-packages
```

Review and commit the package version and changelog changes.

## Publishing

Create and push a version tag from the release commit:

```bash
git tag v0.1.2
git push origin v0.1.2
```

The `Release` workflow runs for `v*` tags. It checks out the tag, installs dependencies, runs verification, builds the workspace, publishes unpublished package versions to npm, and creates a GitHub release for the tag when one does not already exist.

The workflow can also be started manually with an existing pushed tag, for example `v0.1.2`.

## Local Checks

Run these before tagging:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm changeset -- status
```

Optional package dry-runs:

```bash
cd packages/core
npm pack --dry-run

cd ../react
npm pack --dry-run
```

## Notes

- Both `@window-manager/core@0.1.1` and `@window-manager/react@0.1.1` have been published to npm.
- GitHub releases are created by `.github/workflows/release.yml`.
- Built artifacts are published from each package `dist` directory.
- The root package is private and is not published.
- If `NPM_TOKEN` is missing or invalid, npm publish fails before the GitHub release step.
