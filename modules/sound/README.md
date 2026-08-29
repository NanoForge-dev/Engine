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
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/modules/sound"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=modules%2Fsound" alt="Last commit" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/sound` is NanoForge's built-in sound-effect library. It manages a collection of named `HTMLAudioElement` instances exposed on `Context.sound`. Unlike `@nanoforge-dev/music`, multiple sounds may overlap — there's no single-track exclusivity.

## Installation

**Node.js 26 or newer is required.**

```sh
npm install @nanoforge-dev/sound
yarn add @nanoforge-dev/sound
pnpm add @nanoforge-dev/sound
bun add @nanoforge-dev/sound
```

## Example usage

Register `SoundLibrary` on your client app:

```ts
import { SoundLibrary } from "@nanoforge-dev/sound";

app.use(new SoundLibrary());
```

Load and play sound effects through `Context.sound`:

```ts
public override async __init(): Promise<void> {
  ctx.sound.load("jump", "/assets/jump.wav");
  ctx.sound.load("hit", "/assets/hit.wav");
}

public override async __run(ctx: Context): Promise<void> {
  if (playerJumped) ctx.sound.play("jump");
}
```

Call `ctx.sound.mute()` to toggle the muted state of every loaded sound effect. `play` throws `NfNotFound` when the given key was never loaded.

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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/sound
[npm]: https://www.npmjs.com/package/@nanoforge-dev/sound
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
