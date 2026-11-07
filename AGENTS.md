# Engine

## Role

Nanoforge Engine is Nanoforge's game engine for the web browser. It is a monorepo publishing a collection of npm packages scoped under `@nanoforge-dev/*` (game loop, ECS, networking, 2D graphics, assets, input, sound, music...), each versioned and published separately. It is meant to be consumed via the Nanoforge CLI (`nf new`, `nf start`) rather than used directly.

## Tech Stack

- **Language**: TypeScript (strict), with a C++ module compiled to WebAssembly (ECS) via Emscripten.
- **Package manager**: pnpm (`pnpm@12.0.0`), multi-package workspace with `pnpm-workspace.yaml` and pnpm **catalogs** (centralized versions by category: `build`, `ci`, `config`, `core`, `docs`, `env`, `graphics`, `lint`, `network`, `test`).
- **Build orchestrator**: Turborepo (`turbo.json`), with remote cache enabled.
- **Per-package bundler**: `tsdown` (loader config `unrun`).
- **Tests**: Vitest (unit tests per package + e2e at the root level via `vitest.config.e2e.ts`), v8 coverage.
- **Lint/format**: ESLint (shared config `@nanoforge-dev/utils-eslint-config`) + Prettier (shared config `@nanoforge-dev/utils-prettier-config`, import-sorting plugin `@trivago/prettier-plugin-sort-imports`).
- **Local quality/CI**: Husky (`commit-msg`, `pre-commit`, `pre-push` hooks), lint-staged, commitlint (conventional commits).
- **API documentation**: `mint-tsdocs` (per-package generation, Liquid templates in `docs/templates`) + `@microsoft/api-extractor`.
- **Changelog/release**: `git-cliff` (per-package changelog) + `@favware/cliff-jumper` (release).
- **Nix environment**: `flake.nix` provides a dev shell with `nodejs_24`, `pnpm` and `emscripten` (the ECS module needs Emscripten to compile its WASM part).
- **Node**: version 26 (`engines.node` in the `package.json` files).

## Project Structure

A pnpm monorepo with several package folders grouped by role (`packages/*`, `modules/*`, `utils/*`), plus demo/test apps (`e2e/game`, `example/pong-network`).

```
Engine/
├── packages/            # Foundational building blocks, few dependencies between them
│   ├── common/           @nanoforge-dev/common — shared interfaces/utilities (context, exception, viewport, library, editor)
│   ├── core/              @nanoforge-dev/core — main game loop (application, library-registry, internal)
│   ├── asset/             @nanoforge-dev/asset — uniform asset management/loading (client & server)
│   └── env/               @nanoforge-dev/env — config decorators based on class-validator/class-transformer
├── modules/              # Higher-level features, often depend on packages/
│   ├── ecs/               @nanoforge-dev/ecs — ECS (Entity Component System); C++ core compiled to WASM (wasm/ folder, Makefile + Emscripten/em++), exports ./client and ./server
│   ├── graphics-2d/       @nanoforge-dev/graphics-2d — 2D rendering based on Konva, depends on common only (no dependency on ecs or editor-lib)
│   ├── network/           @nanoforge-dev/network — TCP/UDP networking via node-datachannel, exports ./client and ./server
│   ├── scene/              @nanoforge-dev/scene — scene management (scene library, paths, editor integration), depends on common, peer-depends on editor-lib
│   ├── editor/            @nanoforge-dev/editor-lib — building blocks used by the editor
│   ├── input/              @nanoforge-dev/input — keyboard/mouse handling
│   ├── music/              @nanoforge-dev/music — music player
│   └── sound/              @nanoforge-dev/sound — sound effects management
├── utils/                # Internal shared configs for the monorepo (not published as game libs)
│   ├── eslint-config/     @nanoforge-dev/utils-eslint-config
│   └── prettier-config/   @nanoforge-dev/utils-prettier-config
├── e2e/game/             @nanoforge-dev/e2e-game (private) — client + server app used for the engine's end-to-end tests
├── example/pong-network/ Example game (networked Pong, unscoped private package) used as an integration test
├── docs/                 Liquid templates + generated API reference output
└── scripts/              Utility scripts (e.g. sync-docs-references.sh)
```

Each package follows the same layout convention: `src/` (code), `test/` (unit tests), `package.json` with dual ESM/CJS exports (`dist/index.js` + `dist/index.cjs` + `.d.ts`/`.d.cts` types).

Cross-dependencies declared via `workspace:*`: `packages/core` only depends on `asset` and `common`; `modules/network` depends on `common`/`env` and has an optional peer dependency on `editor-lib`; `modules/scene` depends on `common` and peer-depends on `editor-lib`; `modules/graphics-2d` depends only on `common` (it was decoupled from `ecs`/`editor-lib` as part of a breaking change — the editor now moves entities itself via its own viewport feature rather than making graphics-2d shapes draggable); `modules/editor` (the `editor-lib` package) depends on `common` and `core`.

## Main Commands

From the repo root:

- `pnpm install --frozen-lockfile` — installation (requires Emscripten to be installed to compile the ECS module).
- `pnpm build` — builds all packages via Turborepo (`turbo run build`).
- `pnpm format` — Prettier write + `turbo run format` per package.
- `pnpm lint` — Prettier check + `turbo run lint` per package (ESLint).
- `pnpm test` — `test:unit` (per package, via Turborepo) then `test:e2e` (Vitest on `e2e/game`).
- `pnpm docs` — generates the API docs (`turbo run docs`) then syncs the references (`scripts/sync-docs-references.sh`).

Within an individual package/module (e.g. `packages/core`):

- `build`: `tsc --noEmit && tsdown --config-loader unrun`
- `lint` / `format`: Prettier + ESLint on `src`
- `test:unit`: `vitest run --config ../../vitest.config.ts`
- `release`: `cliff-jumper` (independent npm publish per package)

Specific to `modules/ecs` (WASM part):

- `build:wasm`: `make` (compiles the C++ to WASM via `em++`, targeting web + node)
- `test:unit`: `make fclean && make tests -j 16 && vitest run ... && make fclean`
- `clean`: `make fclean`

## Conventions

- **Conventional commits** are mandatory (commitlint + `@commitlint/config-conventional`), enforced by Husky's `commit-msg` hook.
- **lint-staged**: Prettier on all staged files, ESLint `--fix` on `src/**/*.ts`.
- **Strict TypeScript**: `strict: true`, `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `noImplicitReturns`, experimental decorators enabled (`experimentalDecorators`, `useDefineForClassFields`) — notably used by `@nanoforge-dev/env` (class-validator/class-transformer).
- Each package publishes in **dual ESM/CJS format** with separate type declarations (`.d.ts` / `.d.cts`), and an explicit `exports` map in its `package.json`.
- **Per-package changelog**: each package has its own `CHANGELOG.md` generated via `git-cliff` filtered by path (`--include-path 'packages/<x>/*'`), and its own independent release (`cliff-jumper`) — each package can thus be versioned and published separately.
- Contribution: fork + PR, install Emscripten, `pnpm install --frozen-lockfile`, `pnpm build`, then `pnpm format && pnpm build && pnpm test:unit` before submitting (see `.github/CONTRIBUTING.md`).
