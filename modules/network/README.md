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

`@nanoforge-dev/network` is NanoForge's built-in networking library. It ships two subpath entry points — `@nanoforge-dev/network/client` and `@nanoforge-dev/network/server` — each providing reliable, ordered TCP (WebSocket) and unreliable, unordered UDP (WebRTC data channel) transports. The root entry, `@nanoforge-dev/network`, exposes the types shared by both, such as `NetworkConfig`. Splitting client and server into separate entry points keeps the server's runtime-only dependencies (`Bun.serve`, `node-datachannel`) out of a client's bundle graph entirely.

> **The server entry point requires the [Bun](https://bun.sh) runtime.** `@nanoforge-dev/network/server` is built on Bun's native WebSocket server (`Bun.serve`) and does not run on Node.js. The client entry point is runtime-agnostic and targets the browser.

## Installation

**Node.js 26 or newer is required to build. The server entry point requires Bun 1.2 or newer at runtime.**

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

### Running the server behind a NAT

The UDP transport is a WebRTC data channel, so clients connect to the address the
server puts in its ICE candidates. When the server sits behind a NAT — a Kubernetes
pod, a container, a home router — the address it sees on its own interfaces is not
the one clients can reach, and by default each peer also gets a random UDP port that
no firewall rule or port forward can target.

Three optional variables fix that. `ICE_SERVERS` applies to both sides; `ICE_PORT` and
`ADVERTISE_IP` are server-only, since a browser can neither pin its UDP port nor
rewrite its own candidates. With the `nf` CLI, a variable prefixed only with
`NANOFORGE_` (no `CLIENT_`/`SERVER_`) reaches both, so one line configures the
ICE servers everywhere: `NANOFORGE_ICE_SERVERS=stun:stun.example.com:3478`.

```dotenv
ICE_SERVERS=stun:stun.example.com:3478,stun:stun2.example.com:3478
ICE_PORT=50000
ADVERTISE_IP=203.0.113.7
```

- `ICE_SERVERS` — STUN and TURN servers, as a comma-separated list of `stun:`/`turn:`
  URLs. Read by **both** the client and the server, since each builds its own peer
  connection. A STUN entry lets a peer behind a NAT discover its own public address;
  a TURN entry relays traffic when no direct path exists, typically for a client on
  a network that blocks UDP. TURN credentials cannot be embedded in
  the URL, so authenticated TURN uses the JSON form instead:
  `ICE_SERVERS='[{"urls":"turn:turn.example.com:3478","username":"u","credential":"p"}]'`.
- `ICE_PORT` — pins the WebRTC transport to one fixed UDP port and enables ICE UDP
  multiplexing, so every client shares it. Forward or allow this single port.
- `ADVERTISE_IP` — public address written into `typ host` ICE candidates in place of
  the local one. Addresses discovered through STUN are already public and are left
  untouched, so `ICE_SERVERS` and `ADVERTISE_IP` can be used together or apart.

On Kubernetes, pair `ICE_PORT` with a `hostPort` so the media path bypasses
kube-proxy — a Service load-balances UDP across replicas, but a peer connection
lives in exactly one pod — and take `ADVERTISE_IP` from the node:

```yaml
env:
  - name: ADVERTISE_IP
    valueFrom:
      fieldRef:
        fieldPath: status.hostIP
  - name: ICE_PORT
    value: "50000"
ports:
  - containerPort: 50000
    hostPort: 50000
    protocol: UDP
```

Signalling needs no session affinity: the WebSocket is a single long-lived
connection, so the pod that accepts it is the pod that owns the peer connection.

### Bundling the server with pnpm

The UDP transport depends on `node-datachannel`, which loads its native addon at
runtime with a bare `require("@node-datachannel/<platform>")`. A bundler inlines
that call into your server bundle, where pnpm's nested `node_modules` layout puts
the platform package out of reach, and startup fails with
`Cannot load native addon for node-datachannel`. Hoist the platform packages in
`pnpm-workspace.yaml`:

```yaml
publicHoistPattern:
  - "@node-datachannel/*"
```

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

### Client identification

Each client gets a `ClientId` (a random UUID string) shared by its TCP and UDP
connections: the first transport receives the id and a session token in a
`welcome` message, and the client presents the token when opening the other one.
Use `ctx.network.clients` to follow sessions and `getClientInfo` to read what
the server knows about a client (address, port, user agent, origin, query
parameters):

```ts
ctx.network.clients.onConnect((info) => console.log(`${info.id} joined`));
ctx.network.clients.onDisconnect((info) => console.log(`${info.id} left`));

const info = ctx.network.tcp.getClientInfo(clientId);
```

On the client, `ctx.network.clientId` holds the id once welcomed. A page reload
starts a new session with a new id.

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
