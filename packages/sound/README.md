<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/sound"><img src="https://img.shields.io/npm/v/@nanoforge-dev/sound.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/sound"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/sound.svg?maxAge=3600" alt="npm downloads" /></a>
		<a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/push-docs.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/push-docs.yml/badge.svg" alt="Documentation status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/packages/sound"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=packages%2Fsound" alt="Last commit" /></a>
    	<a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/sound` is a sound manager for your game.

## Installation

**Node.js 24.11.0 or newer is required.**

```sh
npm install @nanoforge-dev/sound
yarn add @nanoforge-dev/sound
pnpm add @nanoforge-dev/sound
bun add @nanoforge-dev/sound
```

## Example usage

Initialize the library in your main file

```ts
import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { type IRunClientOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { SoundLibrary } from "@nanoforge-dev/sound";

export async function main(options: IRunClientOptions) {
  const app = NanoforgeFactory.createClient();

  const assetManager = new AssetManagerLibrary();
  const sound = new SoundLibrary();

  app.useAssetManager(assetManager);
  app.useSound(sound);

  await app.init(options);

  sound.load("sound", assetManager.getAssetPath("/path/to/sound.mp3").path);

  await app.run();
}
```

Use to play sound

```ts
export function mySystem(registry: Registry, ctx: Context) {
  const assetManager = ctx.libs.getAssetManager<AssetManagerLibrary>();
  const sound = ctx.libs.getSound<SoundLibrary>();

  sound.play("sound");
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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/sound
[npm]: https://www.npmjs.com/package/@nanoforge-dev/sound
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
