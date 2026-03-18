<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/core"><img src="https://img.shields.io/npm/v/@nanoforge-dev/core.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/core"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/core.svg?maxAge=3600" alt="npm downloads" /></a>
		<a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/push-docs.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/push-docs.yml/badge.svg" alt="Documentation status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/packages/core"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=packages%2Fcore" alt="Last commit" /></a>
    	<a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/core` is a core package that contains game main loop. It is used to initialize the game and run it.

## Installation

**Node.js 24.11.0 or newer is required.**

```sh
npm install @nanoforge-dev/core
yarn add @nanoforge-dev/core
pnpm add @nanoforge-dev/core
bun add @nanoforge-dev/core
```

## Example usage

Initialize the game in your main file.

```ts
import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";

export async function main(options: IRunClientOptions) {
  const app = NanoforgeFactory.createClient();

  await app.init(options);

  await app.run();
}
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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/core
[npm]: https://www.npmjs.com/package/@nanoforge-dev/core
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
