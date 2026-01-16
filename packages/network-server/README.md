<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/network-server"><img src="https://img.shields.io/npm/v/@nanoforge-dev/network-server.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/network-server"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/network-server.svg?maxAge=3600" alt="npm downloads" /></a>
		<a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/push-docs.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/push-docs.yml/badge.svg" alt="Documentation status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/packages/network-server"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=packages%2Fnetwork-server" alt="Last commit" /></a>
    	<a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/network-server` is a network lib with tcp and udp support for server-side usage.

## Installation

**Node.js 24.11.0 or newer is required.**

```sh
npm install @nanoforge-dev/network-server
yarn add @nanoforge-dev/network-server
pnpm add @nanoforge-dev/network-server
bun add @nanoforge-dev/network-server
```

## Example usage

Initilize the library in your main file.

```ts
import { type IRunServerOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

export async function main(options: IRunServerOptions) {
  const app = NanoforgeFactory.createServer();

  const network = new NetworkServerLibrary();

  app.useNetwork(network);

  await app.init(options);

  await app.run();
}
```

Use to receive packets

```ts
export function myReceiveSystem(registry: Registry, ctx: Context) {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();

  network.tcp.getReceivedPackets().forEach((packets, client) => {
    packets.forEach((packet) => {
      const data = JSON.parse(new TextDecoder().decode(packet));
      // Do something with the data
    });
  });
}
```

Use to send packets to everyones

```ts
export function mySendSystem(registry: Registry, ctx: Context) {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();

  // Do something to get a data
  const packet = new TextEncoder().encode(JSON.stringify(data));
  network.tcp.sendToEverybody(packet);
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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/network-server
[npm]: https://www.npmjs.com/package/@nanoforge-dev/network-server
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
