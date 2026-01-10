<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/music"><img src="https://img.shields.io/npm/v/@nanoforge-dev/music.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/music"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/music.svg?maxAge=3600" alt="npm downloads" /></a>
		<a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/push-docs.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/push-docs.yml/badge.svg" alt="Documentation status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/packages/music"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=packages%2Fmusic" alt="Last commit" /></a>
    	<a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/music` is a music player for your game.

## Installation

**Node.js 24.11.0 or newer is required.**

```sh
npm install @nanoforge-dev/music
yarn add @nanoforge-dev/music
pnpm add @nanoforge-dev/music
bun add @nanoforge-dev/music
```

## Example usage

Initialize the library in your main file

```ts
import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { type IRunClientOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { MusicLibrary } from "@nanoforge-dev/music";

export const MUSIC_SYM = Symbol("music");

export async function main(options: IRunClientOptions) {
  const app = NanoforgeFactory.createClient();

  const assetManager = new AssetManagerLibrary();
  const music = new MusicLibrary();

  app.useAssetManager(assetManager);
  app.use(MUSIC_SYM, music);

  await app.init(options);

  music.load("music", assetManager.getAsset("/path/to/music.mp3").path);

  await app.run();
}
```

Use to play music

```ts
export function mySystem(registry: Registry, ctx: Context) {
  const assetManager = ctx.libs.getAssetManager<AssetManagerLibrary>();
  const music = ctx.libs.get<MusicLibrary>(MUSIC_SYM);

  music.play("music");
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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/music
[npm]: https://www.npmjs.com/package/@nanoforge-dev/music
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
