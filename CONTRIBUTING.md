# Contributing

Thanks for helping improve `window-manager-core`.

## Development Setup

Use Node.js 20 or newer and pnpm 10.

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run the playground locally with:

```bash
pnpm dev
```

## Project Layout

- `packages/core`: framework-agnostic window manager state, reducer, selectors, geometry, serialization, and manager facade.
- `packages/react`: React provider and hooks over `@window-manager/core`.
- `apps/playground`: Vite playground for exercising package behavior.
- `docs`: architecture, state model, roadmap, and release notes for maintainers.

## Workflow

- Keep core behavior in `packages/core`.
- Keep React code thin and based on the core manager.
- Prefer workspace terminology in public docs and examples.
- Add or update tests for behavior changes.
- Update README or package READMEs when public usage changes.
- Add a changeset for user-facing package changes:

```bash
pnpm changeset
```

## Pull Request Checklist

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- Changeset added when a published package changes
- Documentation updated when public behavior or usage changes
