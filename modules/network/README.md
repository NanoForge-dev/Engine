<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/network"><img src="https://img.shields.io/npm/v/@nanoforge-dev/network.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/network"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/network.svg?maxAge=3600" alt="npm downloads" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/modules/network"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=modules%2Fnetwork" alt="Last commit" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/network` is NanoForge's built-in networking library. It ships two subpath entry points — `@nanoforge-dev/network/client` and `@nanoforge-dev/network/server` — each providing reliable, ordered TCP (WebSocket) and unreliable, unordered UDP (WebRTC data channel) transports. Splitting client and server into separate entry points keeps Node-only dependencies (`ws`, `wrtc`) out of a client's bundle graph entirely.

## Installation

**Node.js 26 or newer is required.**

```sh
npm install @nanoforge-dev/network
yarn add @nanoforge-dev/network
pnpm add @nanoforge-dev/network
bun add @nanoforge-dev/network
```

## Warning

Configuration is read from the environment via `@nanoforge-dev/env`. Put the relevant variables in your `.env` file (or `InitContext.env`):

```dotenv
# Client
SERVER_ADDRESS=127.0.0.1
SERVER_TCP_PORT=4445
SERVER_UDP_PORT=4444

# Server
LISTENING_INTERFACE=0.0.0.0
LISTENING_TCP_PORT=4445
LISTENING_UDP_PORT=4444
```

Either the TCP port or the UDP port (or both) must be set on each side.

## Example usage

```ts
// Client app
import { NetworkClientLibrary } from "@nanoforge-dev/network/client";

app.use(new NetworkClientLibrary());

public override async __run(ctx: Context): Promise<void> {
  ctx.network.tcp?.sendData(payload);
  for (const packet of ctx.network.tcp?.getReceivedPackets() ?? []) {
    // Handle incoming packets.
  }
}
```

```ts
// Server app
import { NetworkServerLibrary } from "@nanoforge-dev/network/server";

app.use(new NetworkServerLibrary());

public override async __run(ctx: Context): Promise<void> {
  for (const clientId of ctx.network.tcp?.getConnectedClients() ?? []) {
    ctx.network.tcp?.sendToClient(clientId, payload);
  }
  ctx.network.tcp?.sendToEverybody(broadcastPayload);
}
```

`ctx.network.tcp`/`.udp` are `undefined` when the corresponding port wasn't configured on that side.

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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/network
[npm]: https://www.npmjs.com/package/@nanoforge-dev/network
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
