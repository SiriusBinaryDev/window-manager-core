# Current Task

## Title

- Workspace naming aliases and documentation

## Status

- Completed locally

## Objective

- Make the public API and human-facing docs prefer `workspace` terminology.
- Keep the change non-breaking by retaining the existing desktop-named API and serialized state fields.
- Update the playground UI to use workspace language.

## Context

- The user clarified that the monitor/workspace ownership discussion should be handled as naming convention, not a breaking state-model migration.
- Public docs now describe workspaces as the main concept.
- Serialized state still uses `desktops`, `desktopId`, and `activeDesktopId` for compatibility with persisted payloads and existing consumers.

## Relevant Files

- `packages/core/src/types.ts`
- `packages/core/src/commands.ts`
- `packages/core/src/selectors.ts`
- `packages/core/src/createWindowManager.ts`
- `packages/core/src/reducer.ts`
- `packages/core/tests/core.test.ts`
- `packages/react/src/index.tsx`
- `packages/react/tests/index.test.tsx`
- `apps/playground/src/App.tsx`
- `apps/playground/src/styles.css`
- `apps/playground/src/App.test.tsx`
- `README.md`
- `docs/architecture.md`
- `docs/state-model.md`
- `docs/examples.md`
- `docs/roadmap.md`
- `packages/core/README.md`
- `packages/react/README.md`
- `.changeset/bright-tables-shave.md`

## Constraints

- Do not rename internal serialized desktop fields in a patch release.
- Keep desktop-named methods, selectors, hooks, and types working as compatibility aliases.
- Keep playground behavior delegated to the public manager API.
- Keep docs and package READMEs in English.

## Definition Of Done

- Core exports workspace aliases for ids, workspace state, workspaces, commands, selectors, and manager methods.
- `createWindow` accepts `workspaceId` while retaining `desktopId`.
- React exports workspace hooks while retaining desktop hooks.
- Playground UI uses workspace terminology and calls workspace-named manager methods.
- README and package docs explain workspace-first usage plus desktop compatibility names.
- Verification passes.

## Notes

- Latest verification passed with:
  - `pnpm.cmd -r lint`
  - `pnpm.cmd typecheck`
  - `pnpm.cmd -r test`
  - `pnpm.cmd build`
  - `npm.cmd pack --dry-run` in `packages/core`
  - `npm.cmd pack --dry-run` in `packages/react`
  - `pnpm.cmd changeset -- status`
