<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/nanoforge"><img src="https://img.shields.io/npm/v/nanoforge.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/nanoforge"><img src="https://img.shields.io/npm/dt/nanoforge.svg?maxAge=3600" alt="npm downloads" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/packages/nanoforge"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=packages%2Fnanoforge" alt="Last commit" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`nanoforge` is a meta package that re-exports the core NanoForge Engine libraries (`@nanoforge-dev/asset`, `@nanoforge-dev/common`, `@nanoforge-dev/core`, `@nanoforge-dev/env`) from a single entry point, plus `@nanoforge-dev/config` from the `nanoforge/config` subpath used by `nanoforge.config.ts` files.

## Installation

**Node.js 26 or newer is required.**

```sh
npm install nanoforge
yarn add nanoforge
pnpm add nanoforge
bun add nanoforge
```

## Example usage

```ts
import { AssetLibrary, NanoforgeFactory, registerEnv } from "nanoforge";
```

```ts
import { defineConfig } from "nanoforge/config";

export default defineConfig({
  // ...
});
```

## Links

- [GitHub][source]
- [npm][npm]

## Contributing

Before creating an issue, please ensure that it hasn't already been reported/suggested, and double-check the
[documentation][documentation].  
See [the contribution guide][contributing] if you'd like to submit a PR.

## Help

If you don't understand something in the documentation, you are experiencing problems, or you just need a gentle nudge in the right direction, please don't hesitate to ask questions in [discussions][discussions].

[documentation]: https://github.com/NanoForge-dev/Engine
[discussions]: https://github.com/NanoForge-dev/Engine/discussions
[source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/nanoforge
[npm]: https://www.npmjs.com/package/nanoforge
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
