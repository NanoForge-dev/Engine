# Contributing

If you wish to contribute to the NanoForge project, fork the repository and submit a pull request. Please mind following the pre-commit hooks to keep the codebase as clean as possible.

## Setup

To get ready to work on the codebase, please do the following:

1. Fork & clone the repository, and make sure you're on the **main** branch
2. Install Emscripten (see [here](https://emscripten.org/docs/getting_started/downloads.html) for more info)
3. Run `pnpm install --frozen-lockfile` ([install](https://pnpm.io/installation))
4. Run `pnpm build` to build local packages
5. Make your changes
6. Run `pnpm format && pnpm build && pnpm test:unit` to run ESLint/Prettier, build and tests
7. [Submit a pull request](https://github.com/NanoForge-dev/Engine/compare) (Make sure you follow the [conventional commit format](https://github.com/NanoForge-dev/Engine/blob/main/.github/COMMIT_CONVENTION.md))

## Releases

Releases use the shared workflows of [NanoForge-dev/actions](https://github.com/NanoForge-dev/actions) (`@v3`), configured in `.github/nanoforge.json`:

- `engine`: the runtime packages, one `shared` version for all of them, tagged `<version>`. Its releases also sync the docs.
- `utils`: `utils-eslint-config` and `utils-prettier-config`, released one at a time with their own version, tagged `<package>@<version>`.

1. Run the **Release PR** workflow (Actions tab). Leave `group` empty for `engine`, or set `utils` and the package in `packages`. Leave `version` empty to take it from the commits, and use `dry-run` to preview.
2. Review and merge the `releases/*` pull request with "Squash and merge".
3. Merging it triggers the **Release** workflow: it publishes the changed packages on npm, tags them, creates the GitHub release and, for `engine`, syncs the docs.

Run the **Alpha Release** workflow from a feature branch to publish an alpha of the packages listed in `packages`. Other merged pull requests release nothing: no group has `betaOnMerge`.
