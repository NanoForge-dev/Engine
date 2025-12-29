<div align="center">
	<br />
	<p>
		<a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
	</p>
	<br />
	<p>
		<a href="https://www.npmjs.com/package/@nanoforge-dev/asset-manager"><img src="https://img.shields.io/npm/v/@nanoforge-dev/asset-manager.svg?maxAge=3600" alt="npm version" /></a>
		<a href="https://www.npmjs.com/package/@nanoforge-dev/asset-manager"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/asset-manager.svg?maxAge=3600" alt="npm downloads" /></a>
		<a href="https://github.com/NanoForge-dev/Engine/actions"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
		<a href="https://github.com/NanoForge-dev/Engine/commits/main/packages/asset-manager"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=packages%2Fasset-manager" alt="Last commit." /></a>
	</p>
</div>

## About

`@nanoforge-dev/asset-manager` is a manager for loading assets to uniform work with between client and server.

## Installation

**Node.js 24.11.0 or newer is required.**

```sh
npm install @nanoforge-dev/asset-manager
yarn add @nanoforge-dev/asset-manager
pnpm add @nanoforge-dev/asset-manager
bun add @nanoforge-dev/asset-manager
```

## Example usage

Initialize the library in your main file

```ts
import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";

export async function main(options: IRunOptions) {
  const app = NanoforgeFactory.createClient(); // Or NanoforgeFactory.createServer()

  const assetManager = new AssetManagerLibrary();

  app.useAssetManager(assetManager);

  await app.init(options);

  await app.run();
}
```

Use to load assets

```ts
export async function mySystem(registry: Registry, ctx: Context) {
  const assetManager = ctx.libs.getAssetManager<AssetManagerLibrary>();

  const file = assetManager.getAsset("/path/to/file.txt");
  const text = await file.text();

  // Do something with file or text
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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/asset-manager
[npm]: https://www.npmjs.com/package/@nanoforge-dev/asset-manager
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
