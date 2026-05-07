# Conventions

## General

- TypeScript ESM across the repository
- Formatting inferred from `.prettierrc`:
  - single quotes
  - semicolons
  - trailing commas
- Linting inferred from `.eslintrc.cjs`:
  - `eslint:recommended`
  - `@typescript-eslint/recommended`
  - `prettier`
- Human-facing docs are now English; keep new public docs and package READMEs in English
- Public docs and new public API examples should prefer workspace terminology over desktop terminology
- Project license is MIT; keep root and publishable package license files in sync
- Publishable packages should each keep a local `README.md`, because npm package pages use the package directory README rather than the monorepo root README
- Commit every implemented feature as its own separate git commit; do not bundle unrelated completed features together
- If an implementation requires an important product, API, architecture, persistence, or workflow decision, stop and ask the user before choosing on their behalf

## Language Conventions

- Strict TypeScript is enabled in `tsconfig.base.json`
- Type-only imports are used where appropriate
- Interfaces and explicit literal unions are preferred over loose object typing
- No clear convention inferred for classes; current code is function-oriented
- No clear convention inferred for `any`; none was needed in the inspected code

## Architectural Conventions

- Core business rules live in `packages/core`
- React layer stays thin and consumes the core manager instead of reimplementing rules
- Derived reads belong in selectors
- Persistence format is versioned and centralized in `packages/core/src/serialization.ts`
- Geometry behavior is isolated in `packages/core/src/math.ts`
- Workspace isolation is the primary ownership boundary; monitor layouts live inside each workspace
- Internal serialized state may still use desktop field names (`desktops`, `desktopId`, `activeDesktopId`) for compatibility
- Compatibility aliases may remain in the public API when naming evolves, for example desktop-named methods/hooks/selectors can map to workspace behavior

## Naming Conventions

- `camelCase` for functions, variables, and helpers
- `PascalCase` for React components, interfaces, and domain types
- Command type strings are uppercase with underscores, for example `CREATE_WINDOW`
- Workspace packages use the `@window-manager/*` scope

## Folder Structure Conventions

- Package source files live under `src/`
- Core tests currently live under `packages/core/tests`
- Demo app source lives under `apps/playground/src`
- Docs live under `docs/`

## Dependency / Import Rules

- Package manager convention: `pnpm` is the source of truth for installs and lockfiles
- `pnpm-lock.yaml` should be tracked; accidental `package-lock.json` files are not part of the intended workflow
- Workspace TypeScript resolution uses root `tsconfig.base.json` path mappings for `@window-manager/core` and `@window-manager/react`
- Versioning/release convention: Changesets is the source of truth for package bumps and release notes
- `packages/core` should remain independent from React and browser-only APIs
- `packages/react` imports from `@window-manager/core`
- `apps/playground` imports from both workspace packages
- No clear convention inferred for path aliases beyond package exports

## Testing Conventions

- Test runner: `vitest`
- Current test focus is core reducer/math/serialization behavior
- Non-core tests may live close to the package they validate:
  - `packages/react/tests` for adapter tests
  - `apps/playground/src/*.test.ts` for targeted playground coverage
- Workspace test resolution uses source aliases for `@window-manager/core` and `@window-manager/react`
- If a package has its own Vite config and runs `vitest` locally, preserve the workspace source aliases there as well

## Editing Guidance For Future Sessions

- For behavior changes, update core code and tests first
- If public APIs change, verify impacts in both `packages/react` and `apps/playground`
- If persistence behavior changes, verify both `serializeState()` and playground localStorage hydration
- Keep commits scoped to a single completed feature or tightly related fix
- Escalate important implementation decisions to the user instead of silently making them when multiple reasonable directions exist
