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
