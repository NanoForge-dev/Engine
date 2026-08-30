<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/input"><img src="https://img.shields.io/npm/v/@nanoforge-dev/input.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/input"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/input.svg?maxAge=3600" alt="npm downloads" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/modules/input"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=modules%2Finput" alt="Last commit" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/input` is NanoForge's built-in keyboard/mouse input library. It listens to browser keyboard and mouse events and exposes a per-frame snapshot of the current input state on `Context.input`. Client-only.

## Installation

**Node.js 26 or newer is required.**

```sh
npm install @nanoforge-dev/input
yarn add @nanoforge-dev/input
pnpm add @nanoforge-dev/input
bun add @nanoforge-dev/input
```

## Example usage

Register `InputLibrary` on your client app:

```ts
import { InputLibrary } from "@nanoforge-dev/input";

app.use(new InputLibrary());
```

Query the current input state from any library's `__run`:

```ts
import { InputEnum } from "@nanoforge-dev/input";

public override async __run(ctx: Context): Promise<void> {
  if (ctx.input.isKeyPressed(InputEnum.Space)) {
    player.jump();
  }

  if (ctx.input.isDragging(InputEnum.MouseLeft)) {
    camera.pan(ctx.input.getDragState());
  }

  const { x, y } = ctx.input.getMousePosition();
}
```

`Context.input` also exposes `getPressedKeys()`, `getMouseState()`, and `getWheelState()` for scroll input.

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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/input
[npm]: https://www.npmjs.com/package/@nanoforge-dev/input
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
