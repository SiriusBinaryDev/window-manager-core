# Releasing

## Goal

This repository uses Changesets for versioning and release automation.
The release workflow is designed for the `pnpm` workspace and the two publishable packages:

- `@window-manager/core`
- `@window-manager/react`

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

## Publish Flow

The GitHub workflow in `.github/workflows/release.yml` runs on `main` and can also be started manually.

It performs:

- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `changesets/action`

The workflow will:

- open or update a versioning PR when pending changesets exist
- publish to npm when version packages are already prepared and `NPM_TOKEN` is available

## Required Secrets

- `GITHUB_TOKEN`: provided by GitHub Actions
- `NPM_TOKEN`: required for npm publish

## Notes

- Package publish metadata is configured for public scoped packages.
- Built artifacts are published from `dist` only.
- If publishing should stay disabled for now, keep the workflow but do not provide `NPM_TOKEN`.
