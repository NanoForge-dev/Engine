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
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/modules/music"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=modules%2Fmusic" alt="Last commit" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/music` is NanoForge's built-in music library. It manages a collection of named `HTMLAudioElement` tracks exposed on `Context.music` and ensures only one track plays at a time — starting a new track pauses whichever one was playing.

## Installation

**Node.js 26 or newer is required.**

```sh
npm install @nanoforge-dev/music
yarn add @nanoforge-dev/music
pnpm add @nanoforge-dev/music
bun add @nanoforge-dev/music
```

## Example usage

Register `MusicLibrary` on your client app:

```ts
import { MusicLibrary } from "@nanoforge-dev/music";

app.use(new MusicLibrary());
```

Load and play tracks through `Context.music`:

```ts
public override async __init(): Promise<void> {
  ctx.music.load("menu", "/assets/menu.mp3");
  ctx.music.load("level-1", "/assets/level-1.mp3");
}

public override async __run(ctx: Context): Promise<void> {
  if (levelStarted) ctx.music.play("level-1"); // stops "menu" automatically
}
```

Call `ctx.music.mute()` to toggle the muted state of every loaded track. `play` throws `NfNotFound` when the given key was never loaded.

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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/music
[npm]: https://www.npmjs.com/package/@nanoforge-dev/music
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
