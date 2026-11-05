<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/graphics-3d"><img src="https://img.shields.io/npm/v/@nanoforge-dev/graphics-3d.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/graphics-3d"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/graphics-3d.svg?maxAge=3600" alt="npm downloads" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/modules/graphics-3d"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=modules%2Fgraphics-3d" alt="Last commit" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/graphics-3d` is NanoForge's built-in 3D rendering library, powered by [Three.js][three]. It renders a `Scene` with a camera on a WebGPU canvas (WebGL2 fallback), once per engine tick, and exposes them on `Context.graphics`. Client-only. An app uses either graphics-2d or graphics-3d, not both.

## Installation

**Node.js 26 or newer is required.** `three` is a peer dependency: install it next to the library, so the game and Three.js add-ons share one copy.

```sh
npm install @nanoforge-dev/graphics-3d three
yarn add @nanoforge-dev/graphics-3d three
pnpm add @nanoforge-dev/graphics-3d three
bun add @nanoforge-dev/graphics-3d three
```

## Example usage

Register `Graphics3DLibrary` on your client app:

```ts
import { Graphics3DLibrary } from "@nanoforge-dev/graphics-3d";

app.use(new Graphics3DLibrary());
```

Add Three.js objects to `Context.graphics.scene`. Three.js is re-exported from `@nanoforge-dev/graphics-3d/three`:

```ts
import {
  BoxGeometry,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
} from "@nanoforge-dev/graphics-3d/three";

const cube = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ color: "#44aa88" }));
graphics.scene.add(cube, new DirectionalLight("white", 3));
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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/graphics-3d
[npm]: https://www.npmjs.com/package/@nanoforge-dev/graphics-3d
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
[three]: https://threejs.org/
