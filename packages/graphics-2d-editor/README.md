<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/graphics-2d-editor"><img src="https://img.shields.io/npm/v/@nanoforge-dev/graphics-2d-editor.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/graphics-2d-editor"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/graphics-2d-editor.svg?maxAge=3600" alt="npm downloads" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/packages/graphics-2d-editor"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=packages%2Fgraphics-2d-editor" alt="Last commit" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/graphics-2d-editor` is an addon for the [NanoForge Graphics 2D library][graphics] to handle the creation of 2D graphics games in the editor.

## Installation

**Node.js 25 or newer is required.**

```sh
npm install @nanoforge-dev/graphics-2d-editor
yarn add @nanoforge-dev/graphics-2d-editor
pnpm add @nanoforge-dev/graphics-2d-editor
bun add @nanoforge-dev/graphics-2d-editor
```

## Example usage

Initialize the library in your main file (for the rest of the example, please refer to the graphics 2D library [documentation][graphics]).

```ts
import { type IRunClientOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { ECSClientLibrary } from "@nanoforge-dev/ecs-client";
import { Circle, Graphics2DLibrary, Layer } from "@nanoforge-dev/graphics-2d";
import { Graphics2DEditorLibrary } from "@nanoforge-dev/graphics-2d-editor";

import { CircleComponent } from "./components/CircleComponent";

export async function main(options: IRunClientOptions) {
  const app = NanoforgeFactory.createClient();

  const ecs = new ECSClientLibrary();
  const graphics = new Graphics2DLibrary();
  const graphicsEditor = new Graphics2DEditorLibrary();

  app.useComponentSystem(ecs);
  app.useGraphics(graphics);
  app.use(Symbol.for("GraphicsEditor"), graphicsEditor);

  await app.init(options);

  const registry = ecs.registry;

  const layer = new Layer();
  graphics.stage.add(layer);

  const entity = registry.spawnEntity();
  registry.addComponent(
    entity,
    new CircleComponent(
      new Circle({
        radius: 70,
        fill: "red",
      }),
      layer,
    ),
  );

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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/graphics-2d-editor
[graphics]: https://github.com/NanoForge-dev/Engine/tree/main/packages/graphics-2d
[npm]: https://www.npmjs.com/package/@nanoforge-dev/graphics-2d-editor
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
