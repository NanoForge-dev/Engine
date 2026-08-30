<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/ecs"><img src="https://img.shields.io/npm/v/@nanoforge-dev/ecs.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/ecs"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/ecs.svg?maxAge=3600" alt="npm downloads" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/modules/ecs"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=modules%2Fecs" alt="Last commit" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/ecs` is NanoForge's built-in entity-component-system library, backed by a WebAssembly registry (compiled from C++). It ships two subpath entry points — `@nanoforge-dev/ecs/client` and `@nanoforge-dev/ecs/server` — each loading its own WASM build (browser-targeted vs Node-targeted) behind the same `EcsLibrary` API, so a client bundle never pulls in the server build or vice versa.

## Installation

**Node.js 26 or newer is required.**

```sh
npm install @nanoforge-dev/ecs
yarn add @nanoforge-dev/ecs
pnpm add @nanoforge-dev/ecs
bun add @nanoforge-dev/ecs
```

## Example usage

Register `EcsLibrary` from the entry point matching your app:

```ts
// Client app
import { EcsLibrary } from "@nanoforge-dev/ecs/client";

app.use(new EcsLibrary());
```

```ts
// Server app
import { EcsLibrary } from "@nanoforge-dev/ecs/server";

app.use(new EcsLibrary());
```

Once registered, `Context.ecs.registry` gives every other library access to the entity/component registry:

```ts
public override async __run(ctx: Context): Promise<void> {
  const entity = ctx.ecs.registry.spawnEntity();
  ctx.ecs.registry.addComponent(entity, new Position(0, 0));
}
```

Register systems to run on every tick:

```ts
ctx.ecs.registry.addSystem((registry) => {
  for (const { __RESERVED_entityId, Position } of registry.getZipper([
    { name: "__RESERVED_entityId" },
    { name: "Position" },
  ])) {
    // Move things around.
  }
});
```

When registered alongside `@nanoforge-dev/editor`'s `EditorLibrary`, `EcsLibrary` also listens for a `"hot-reload"` command from the editor and applies incoming components via `registry.addComponent` — useful for live-editing entity state from an external editor host.

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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/ecs
[npm]: https://www.npmjs.com/package/@nanoforge-dev/ecs
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
