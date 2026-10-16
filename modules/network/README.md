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

`@nanoforge-dev/network` is NanoForge's built-in networking library. It ships two subpath entry points — `@nanoforge-dev/network/client` and `@nanoforge-dev/network/server` — each sending packets on four channels: `Channel.ReliableOrdered` and `Channel.ReliableUnordered` over TCP (WebSocket), `Channel.UnreliableOrdered` and `Channel.UnreliableUnordered` over UDP (WebRTC data channels). The root entry, `@nanoforge-dev/network`, exposes the types shared by both, such as `NetworkConfig`. Splitting client and server into separate entry points keeps the server's runtime-only dependencies (`Bun.serve`, `node-datachannel`) out of a client's bundle graph entirely. A third entry point, `@nanoforge-dev/network/peer`, runs a game with no game server, hosted by one of the players (see [Peer-to-peer](#peer-to-peer)).

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

Either the TCP port or the UDP port (or both) must be set on each side. The TCP
port enables the reliable channels, the UDP port the unreliable ones.

### Channels

Every method takes an optional `{ channel }`. Sending defaults to
`Channel.ReliableOrdered`, or to the definition's channel for
[typed packets](#typed-packets); reading covers every configured channel.

| Channel               | Lost?    | Order                    | Transport |
| --------------------- | -------- | ------------------------ | --------- |
| `ReliableOrdered`     | Never    | Send order               | TCP       |
| `ReliableUnordered`   | Never    | No promise               | TCP       |
| `UnreliableOrdered`   | Possibly | Late packets are dropped | WebRTC    |
| `UnreliableUnordered` | Possibly | Any order                | WebRTC    |

One WebSocket per client carries both reliable channels: each binary frame
starts with a one-byte channel tag. Each unreliable channel is its own data
channel (`ordered: false`, `maxRetransmits: 0`); `UnreliableOrdered` packets
are prefixed with a `uint32` sequence number so the receiver drops any packet older than
the last one it delivered. One message is one packet on every channel, so
payloads may contain any bytes. Over TCP, `ReliableUnordered` is delivered in
order in practice.

### Payloads

The send methods take bytes, a string or any JSON value, and every received
packet is a `NetworkData` you read in the format you need. Their payload carries
no format tag: read a packet the way it was sent. Every packet starts with the
name of its [typed packet](#typed-packets) type, empty for these ones.

| Sent value                                         | Encoded as            | Read back with                    |
| -------------------------------------------------- | --------------------- | --------------------------------- |
| `Uint8Array`, `ArrayBuffer`, any `ArrayBufferView` | The bytes as they are | `bytes()` or `arrayBuffer()`      |
| `string`                                           | UTF-8 text            | `text()`                          |
| Any other value (object, array, number, …)         | `JSON.stringify` text | `json()`                          |
| A received `NetworkData`                           | Its bytes, unchanged  | Whatever the original sender used |

`NetworkData` methods are synchronous and return a new value on every call.
`json()` throws a `SyntaxError` when the payload is not JSON, and sending a value
`JSON.stringify` cannot encode (`undefined`, a function) throws a `TypeError`.

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
import { Channel, NetworkClientLibrary } from "@nanoforge-dev/network/client";

app.use(new NetworkClientLibrary());

// Every frame:
ctx.network.sendData({ type: "join" }); // Channel.ReliableOrdered
ctx.network.sendData({ x: 1, y: 2 }, { channel: Channel.UnreliableOrdered });
for (const packet of ctx.network.getReceivedPackets()) {
  const message = packet.json(); // Incoming packets, from every channel.
}
```

```ts
// Server app
import { Channel, NetworkServerLibrary } from "@nanoforge-dev/network/server";

app.use(new NetworkServerLibrary());

// Every frame:
ctx.network.getReceivedPackets().forEach((packets, clientId) => {
  const messages = packets.map((packet) => packet.json()); // From every channel.
});
ctx.network.sendToAll(snapshot, { channel: Channel.UnreliableOrdered });
ctx.network.sendToClient(clientId, { type: "event" }); // Channel.ReliableOrdered
```

The client connects during `__init` and its channels are open before the game
starts: `__init` rejects when a transport fails or the channels are not open
within 10 seconds. The server starts listening during `__init`.

### Typed packets

Declare each packet type once, in a file both apps import, then listen for it,
read it from a system, or send it, with the payload type checked:

```ts
// shared/protocol.ts
import { Channel, definePacket } from "@nanoforge-dev/network";

export const Input = definePacket<{ key: "up" | "down" }>("input");
export const Move = definePacket<{ id: number; x: number; y: number }>("move", {
  channel: Channel.UnreliableOrdered, // default channel of this type
});
```

```ts
// Client: listeners run every tick before the ECS systems, not while paused.
network.packets.on(Move, (move, { channel, ctx }) => applyMove(ctx.ecs.registry, move));
ctx.network.packets.send(Input, { key: "up" });

// Server: listeners and `read` also get the sender.
network.packets.on(Input, ({ key }, { clientId }) => handleInput(clientId, key));
for (const { data, clientId } of ctx.network.packets.read(Input)) handleInput(clientId, data.key); // in a system
ctx.network.packets.sendToAll(Move, { id: 1, x: 2, y: 3 });
```

`on` returns a function that removes the listener. Typed packets never appear in
`getReceivedPackets`, and a type nobody listens to or reads is dropped with a
warning. Use `definePacket`'s `validate` option to check payloads on the server.

### Client identification

Each client gets a `ClientId` (a random UUID string) shared by its TCP and UDP
connections: the first transport receives the id and a session token in a
`welcome` message, and the client presents the token when opening the other one.
Use `ctx.network.clients` to follow sessions and `ctx.network.getClientInfo` to read what
the server knows about a client (address, port, user agent, origin, query
parameters):

```ts
ctx.network.clients.onConnect((info) => console.log(`${info.id} joined`));
ctx.network.clients.onDisconnect((info) => console.log(`${info.id} left`));

const info = ctx.network.getClientInfo(clientId);
```

On the client, `ctx.network.clientId` holds the id once the server has welcomed the client. A page reload
starts a new session with a new id.

Using a channel whose port wasn't configured on that side throws.

### Peer-to-peer

`@nanoforge-dev/network/peer` runs a game without a game server: one player
hosts, their browser running the game's server, and the others join it over
WebRTC, on the same four channels and typed packets. A signaling server pairs
them for the WebRTC handshake only: it is `NetworkServerLibrary` with
`LISTENING_SIGNALING_PORT` set.

```dotenv
# Signaling server
LISTENING_SIGNALING_PORT=4447

# Game (every player)
SERVER_ADDRESS=127.0.0.1
SERVER_SIGNALING_PORT=4447
```

```ts
import { NetworkPeerLibrary } from "@nanoforge-dev/network/peer";

app.use(network); // new NetworkPeerLibrary()
await app.init(options);

const room = new URLSearchParams(location.search).get("room");
if (room)
  await network.join(room); // one WebRTC connection, to the host
else {
  const server = await network.host(); // same API as NetworkServerLibrary's ctx.network
  console.info(`invite: ${location.origin}${location.pathname}?room=${network.room}`);
  server.packets.on(Input, ({ key }, { clientId }) => handleInput(clientId, key, server));
}
network.packets.send(Play); // on the host, reaches its own server through a loopback

// In systems: authority runs where `ctx.network.server` is set, and systems
// applying the host's state read, then skip on the host:
const moves = ctx.network.packets.read(Move);
if (ctx.network.isHost) return;
```

The game ends when the host leaves: each joiner's `isConnected()` turns `false`.
Keep packets at or below 64 KiB, add a TURN server to `ICE_SERVERS` for players
behind strict NATs, and keep the host's tab in the foreground. See the
[peer-to-peer docs](https://github.com/NanoForge-dev/Engine/blob/main/docs/docs/network/network-peer.mdx)
and `example/pong-p2p`.

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
