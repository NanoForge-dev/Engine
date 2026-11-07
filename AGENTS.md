# Engine

## Role

Nanoforge Engine is Nanoforge's game engine for the web browser. It is a monorepo publishing a collection of npm packages scoped under `@nanoforge-dev/*` (game loop, ECS, networking, 2D and 3D graphics, assets, input, sound, music...). The runtime packages are released together under one shared version. It is meant to be consumed via the Nanoforge CLI (`nf new`, `nf start`) rather than used directly.

## Tech Stack

- **Language**: TypeScript (strict), with a C++ module compiled to WebAssembly (ECS) via Emscripten.
- **Package manager**: pnpm (`pnpm@12.0.0`), multi-package workspace with `pnpm-workspace.yaml` and pnpm **catalogs** (centralized versions by category: `build`, `ci`, `config`, `core`, `docs`, `env`, `graphics`, `lint`, `network`, `test`).
- **Build orchestrator**: Turborepo (`turbo.json`), with remote cache enabled.
- **Per-package bundler**: `tsdown` (loader config `unrun`).
- **Tests**: Vitest (unit tests per package + e2e at the root level via `vitest.config.e2e.ts`), v8 coverage. Playwright (`playwright.config.ts`) for the browser graphics e2e tests (screenshot comparison in Chromium).
- **Lint/format**: ESLint (shared config `@nanoforge-dev/utils-eslint-config`) + Prettier (shared config `@nanoforge-dev/utils-prettier-config`, import-sorting plugin `@trivago/prettier-plugin-sort-imports`).
- **Local quality/CI**: Husky (`commit-msg`, `pre-commit`, `pre-push` hooks), lint-staged, commitlint (conventional commits).
- **API documentation**: `typedoc` + `typedoc-plugin-markdown` (root `typedoc.json`), with a local plugin (`docs/typedoc/mintlify.mjs`) that turns the output into Mintlify pages.
- **Changelog/release**: shared release workflows of `nanoforge-dev/actions` (`@v3`), configured in `.github/nanoforge.json`. Each package also keeps `git-cliff` (per-package changelog) and `@favware/cliff-jumper` scripts.
- **Graphics**: Konva (`graphics-2d`), Three.js (`graphics-3d`).
- **Nix environment**: `flake.nix` provides a dev shell with `nodejs_24`, `pnpm` and `emscripten` (the ECS module needs Emscripten to compile its WASM part).
- **Node**: version 26 (`engines.node` in the `package.json` files, `.nvmrc`).

## Project Structure

A pnpm monorepo with several package folders grouped by role (`packages/*`, `modules/*`, `utils/*`), plus test apps (`e2e/game`, `e2e/game-2d`, `e2e/game-3d`) and example games (`example/*`).

```
Engine/
├── packages/            # Foundational building blocks, few dependencies between them
│   ├── common/           @nanoforge-dev/common — shared interfaces/utilities (context, exception, viewport, library, editor)
│   ├── core/              @nanoforge-dev/core — main game loop (application, library-registry, internal)
│   ├── asset/             @nanoforge-dev/asset — uniform asset management/loading (client & server)
│   └── env/               @nanoforge-dev/env — config decorators based on class-validator/class-transformer
├── modules/              # Higher-level features, often depend on packages/
│   ├── ecs/               @nanoforge-dev/ecs — ECS (Entity Component System); C++ core compiled to WASM (wasm/ folder, Makefile + Emscripten/em++), exports ./client, ./server and ./scene
│   ├── graphics-2d/       @nanoforge-dev/graphics-2d — 2D rendering based on Konva, depends on common only (no dependency on ecs or editor-lib)
│   ├── graphics-3d/       @nanoforge-dev/graphics-3d — 3D rendering based on Three.js (WebGPU, WebGL2 fallback), client only, exports ./three and ./three/tsl
│   ├── network/           @nanoforge-dev/network — TCP/UDP networking via node-datachannel, plus a p2p mode (WebRTC), exports ./client and ./server
│   ├── scene/              @nanoforge-dev/scene — scene management (scene library, paths, editor integration), depends on common, peer-depends on editor-lib
│   ├── editor/            @nanoforge-dev/editor-lib — building blocks used by the editor
│   ├── input/              @nanoforge-dev/input — keyboard/mouse and controller handling, exports ./keyboard-mouse and ./controller
│   ├── music/              @nanoforge-dev/music — music player
│   └── sound/              @nanoforge-dev/sound — sound effects management
├── utils/                # Internal shared configs for the monorepo (not published as game libs)
│   ├── eslint-config/     @nanoforge-dev/utils-eslint-config
│   └── prettier-config/   @nanoforge-dev/utils-prettier-config
├── e2e/
│   ├── game/              @nanoforge-dev/e2e-game (private) — client + server app built by the Vitest e2e test (e2e/game.test.ts)
│   ├── game-2d/           @nanoforge-dev/e2e-game-2d (private) — 2D game rendered by the graphics e2e tests
│   ├── game-3d/           @nanoforge-dev/e2e-game-3d (private) — 3D game rendered by the graphics e2e tests
│   └── graphics/          Playwright specs (<game>.spec.ts) and their reference screenshots; not a package
├── example/              # Example games (unscoped private packages)
│   ├── pong-network/      Networked Pong, used as an integration test
│   ├── pong-3d/           Networked 3D Pong (graphics-3d + network)
│   └── cube-3d/           Minimal graphics-3d scene
├── docs/
│   ├── docs/              Hand-written Mintlify pages (one folder per topic) + navigation.json
│   ├── design/            Design proposals (e.g. graphics-3d-editor-proposal.md)
│   └── typedoc/           mintlify.mjs, the typedoc plugin; the API reference is generated into docs/references (gitignored)
└── scripts/              nightly.sh, the nightly test runner
```

Each package of `packages/*` and `modules/*` follows the same layout convention: `src/` (code), `test/` (unit tests), `package.json` with dual ESM/CJS exports (`dist/index.js` + `dist/index.cjs` + `.d.ts`/`.d.cts` types). The `utils/*` packages are a bare `index.js`, ESM only, with no build step.

Cross-dependencies declared via `workspace:*`: `packages/core` only depends on `asset` and `common`; `modules/network` depends on `common`/`env` and has an optional peer dependency on `editor-lib`; `modules/ecs` depends on `common`, with optional peer dependencies on `editor-lib` and `scene`; `modules/music` and `modules/sound` depend on `common`, with an optional peer dependency on `editor-lib`; `modules/scene` depends on `common`, with an optional peer dependency on `editor-lib`; `modules/graphics-2d` depends only on `common` (it was decoupled from `ecs`/`editor-lib` as part of a breaking change — the editor now moves entities itself via its own viewport feature rather than making graphics-2d shapes draggable); `modules/graphics-3d` depends on `common`, with `three` as a peer dependency and an optional peer dependency on `editor-lib` (an app uses either graphics-2d or graphics-3d, not both); `modules/editor` (the `editor-lib` package) depends only on `common` at runtime (`core` is a devDependency).

### Network p2p mode

Setting `network: "p2p"` in the workspace `nanoforge.config.ts` runs the same client and server apps without a game server: `nf` sets `NETWORK_MODE=p2p`, the first player hosts the server app in their browser tab, the others join it over WebRTC (`?room=CODE`), and the Bun server only does signaling. `nf build` also builds the server app for the browser (the `browser` condition of `@nanoforge-dev/network/server`). User docs: `docs/docs/network/network-peer.mdx` and `modules/network/README.md`.

## Main Commands

From the repo root:

- `pnpm install --frozen-lockfile` — installation. Install Emscripten first, as `.github/CONTRIBUTING.md` asks: building and testing `modules/ecs` need it (`em++`).
- `pnpm build` — builds all packages via Turborepo (`turbo run build --concurrency=5`).
- `pnpm format` — Prettier write + `turbo run format` per package.
- `pnpm lint` — Prettier check + `turbo run lint` per package (ESLint).
- `pnpm test` — `test:unit` (per package, via Turborepo) then `test:e2e` (Vitest on `e2e/**/*.test.ts`, today `e2e/game.test.ts`).
- `pnpm test:e2e:graphics` — Playwright screenshot tests (`e2e/graphics/<game>.spec.ts`), not part of `pnpm test`. Each game is built and served with `nf build && nf start -p <port>` (`game-2d` on 3101, `game-3d` on 3102). Needs Chromium (`pnpm exec playwright install chromium`); screenshots are only compared on Linux, since the references come from CI's Linux Chromium.
- `pnpm run docs` — builds the packages then runs `typedoc`, which writes the API reference of `packages/*` and `modules/*` as `.mdx` pages into `docs/references`. Use `pnpm run docs`: plain `pnpm docs` is pnpm's built-in command that opens a package's documentation in the browser.
- `scripts/nightly.sh` — nightly test runner: unit tests with coverage (it only scans `packages/*`) then the Vitest e2e tests, and writes JSON and Markdown reports into `$REPORT_DIR` (default `reports/`). Needs `jq`.

Within an individual package/module (e.g. `packages/core`):

- `build`: `tsc --noEmit && tsdown --config-loader unrun`. Exceptions: `modules/ecs` (see below); `modules/network` type-checks `tsconfig.client.json` and `tsconfig.server.json` before `tsdown`; the `utils/*` packages have no `build` or `test:unit` script.
- `lint` / `format`: Prettier + ESLint on `src`
- `test:unit`: `vitest run --config ../../vitest.config.ts`
- `changelog` / `release`: `git-cliff` / `cliff-jumper` (the CI release workflows do the publishing, see Conventions)
- Releases go through the **Release PR** workflow: agents never run `release` (or `cliff-jumper`) locally.

Specific to `modules/ecs` (WASM part):

- `build`: `pnpm build:wasm && pnpm build:script`
- `build:wasm`: `make` (compiles the C++ to WASM via `em++`, targeting web + node)
- `build:script`: `tsc --noEmit && tsdown --config-loader unrun` (the TypeScript part)
- `test:unit`: `make fclean && make tests -j 16 && vitest run ... && make fclean`
- `clean`: `make fclean`

## CI

The workflows in `.github/workflows` call the shared reusable workflows of `nanoforge-dev/actions` (`@v3`): `tests`, `release-pr`, `release`, `alpha-release`, `label-sync`, `issue-triage`, `pr-triage`. `tests.yml` runs `lint`, `test:unit` and `test:e2e` through the shared workflow, plus a local `graphics` job that runs `pnpm test:e2e:graphics` on `ubuntu-24.04` (pinned, because the reference screenshots depend on its Chromium and SwiftShader). Local composite actions: `.github/actions/prepare` and `.github/actions/emsdk-install`.

## Conventions

- **Conventional commits** are mandatory (commitlint + `@commitlint/config-conventional`), enforced by Husky's `commit-msg` hook.
- **Husky hooks**: `pre-commit` runs lint-staged (Prettier `--ignore-unknown --write` on all staged files); `pre-push` runs `pnpm run build`, `pnpm run lint` and `pnpm run test`.
- **Strict TypeScript**: `strict: true`, `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `noImplicitReturns`, experimental decorators enabled (`experimentalDecorators`, `useDefineForClassFields`) — notably used by `@nanoforge-dev/env` (class-validator/class-transformer).
- Each package publishes in **dual ESM/CJS format** with separate type declarations (`.d.ts` / `.d.cts`), and an explicit `exports` map in its `package.json`.
- **Per-package changelog**: each package has its own `CHANGELOG.md` generated via `git-cliff` filtered by path (`--include-path '<folder>/<x>/*'`, where `<folder>` is `packages`, `modules` or `utils`).
- **Releases** (`.github/nanoforge.json`, see `.github/CONTRIBUTING.md`): the `engine` group (the 13 runtime packages) shares one version, tagged `<version>`, and its releases also sync the docs; the `utils` group (`utils-eslint-config`, `utils-prettier-config`) releases one package at a time with its own version, tagged `<package>@<version>`. Run the **Release PR** workflow, squash-merge the `releases/*` PR, and the **Release** workflow publishes. The **Alpha Release** workflow publishes an alpha from a feature branch. Other merged PRs release nothing.
- Contribution: fork + PR, install Emscripten, `pnpm install --frozen-lockfile`, `pnpm build`, then `pnpm format && pnpm build && pnpm test:unit` before submitting (see `.github/CONTRIBUTING.md`).
