<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/graphics-2d"><img src="https://img.shields.io/npm/v/@nanoforge-dev/graphics-2d.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/graphics-2d"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/graphics-2d.svg?maxAge=3600" alt="npm downloads" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/modules/graphics-2d"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=modules%2Fgraphics-2d" alt="Last commit" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/graphics-2d` is NanoForge's built-in 2D rendering library, powered by [Konva][konva]. It creates a full-container `Stage` and a default `Layer` and exposes them on `Context.graphics`. Client-only.

## Installation

**Node.js 26 or newer is required.**

```sh
npm install @nanoforge-dev/graphics-2d
yarn add @nanoforge-dev/graphics-2d
pnpm add @nanoforge-dev/graphics-2d
bun add @nanoforge-dev/graphics-2d
```

## Example usage

Register `Graphics2DLibrary` on your client app:

```ts
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";

app.use(new Graphics2DLibrary());
```

Draw shapes directly on `Context.graphics.stage`/`.baseLayer`:

```ts
import { Circle } from "@nanoforge-dev/graphics-2d";

public override async __run(ctx: Context): Promise<void> {
  const circle = new Circle({ x: 100, y: 100, radius: 40, fill: "red" });
  ctx.graphics.baseLayer.add(circle);
}
```

When registered alongside `@nanoforge-dev/ecs`'s `EcsLibrary` and `@nanoforge-dev/editor`'s `EditorLibrary`, `Graphics2DLibrary` automatically makes any entity carrying a `DrawableCircle2D`/`DrawableRect2D`/`DrawableText2D` component draggable in the viewport and notifies the editor on drag end — no extra wiring required.

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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/graphics-2d
[npm]: https://www.npmjs.com/package/@nanoforge-dev/graphics-2d
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
[konva]: https://konvajs.org/
