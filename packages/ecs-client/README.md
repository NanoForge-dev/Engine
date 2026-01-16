<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/ecs-client"><img src="https://img.shields.io/npm/v/@nanoforge-dev/ecs-client.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/ecs-client"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/ecs-client.svg?maxAge=3600" alt="npm downloads" /></a>
		<a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/push-docs.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/push-docs.yml/badge.svg" alt="Documentation status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/packages/ecs-client"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=packages%2Fecs-client" alt="Last commit" /></a>
    	<a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/ecs-client` is a wrapper of `@nanoforge-dev/ecs-lib` for client-side usage.

## Installation

**Node.js 24.11.0 or newer is required.**

```sh
npm install @nanoforge-dev/ecs-client
yarn add @nanoforge-dev/ecs-client
pnpm add @nanoforge-dev/ecs-client
bun add @nanoforge-dev/ecs-client
```

## Example usage

Initialize the library in your main file.

```ts
import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { ECSClientLibrary } from "@nanoforge-dev/ecs-client";

export async function main(options: IRunClientOptions) {
  const app = NanoforgeFactory.createClient();

  const ecs = new ECSClientLibrary();

  app.useComponentSystem(ecs);

  await app.init(options);

  const registry = ecs.registry;

  const entity = registry.spawnEntity();
  registry.addComponent(entity, new ExampleComponent("foo", 42));

  registry.addSystem(exampleSystem);

  await app.run();
}
```

With component

```ts
export class ExampleComponent {
  name = this.constructor.name;

  constructor(
    public paramA: string,
    public paramB: number,
    public paramC: boolean = false,
  ) {}

  get foo() {
    return "bar";
  }

  get paramAOrDefault() {
    return this.paramC ? this.paramA : "default";
  }

  addOne() {
    this.paramB += 1;
  }
}
```

And system

```ts
export const exampleSystem = (registry: Registry, ctx: Context) => {
  const entities = registry.getZipper([ExampleComponent]);

  entities.forEach((entity) => {
    if (entity.ExampleComponent.paramA === "end") {
      ctx.app.setIsRunning(false);
      return;
    }

    if (entity.ExampleComponent.paramB === 0) entity.ExampleComponent.paramA = "end";

    if (entity.ExampleComponent.paramB >= 0)
      entity.ExampleComponent.paramB = entity.ExampleComponent.paramB - 1;
  });
};
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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/ecs-client
[npm]: https://www.npmjs.com/package/@nanoforge-dev/ecs-client
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
