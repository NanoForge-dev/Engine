Network Overview
================

This page describes the global design and rationale for the engine's networking
libraries: the `network-server` and `network-client` TypeScript packages. These
libraries provide a small, pragmatic networking layer used by the example
`pong-network` game and designed to be easy to understand and integrate.

Goals
-----

- Minimal, predictable protocol for multiplayer games.
- Use well-understood transports: TCP for reliable control messages and UDP
  for low-latency, best-effort state updates.
- Provide clear validation hooks (magic value, versioning) to avoid processing
  ```restructuredtext
  Network Overview
  ================

  This page explains how the engine's TypeScript networking packages actually
  work and the rationale behind important implementation choices. The two
  packages are `network-server` and `network-client` and are used by the
  `example/pong-network` project.

  Design summary
  --------------

  - Two logical transports are provided: a reliable, ordered channel (called
    "TCP" in the packages) and an unreliable, unordered channel (called
    "UDP"). Important: these names refer to channel semantics in the library,
    not to raw OS sockets. Implementation details:
    - The reliable channel is implemented over WebSocket (node `ws` and
      browser `WebSocket`) to provide an ordered, byte-stream-like channel.
    - The unreliable channel is implemented as a WebRTC `RTCDataChannel`
      created with `ordered: false, maxRetransmits: 0`. WebSocket is used for
      signaling/ICE exchange between client and server.

- For packet framing and terminator semantics see the dedicated note:
  `docs/network/packet-framing.rst`.

  Why these choices
  ------------------

  - WebSocket for reliable messages: WebSocket is universally available in
    browsers and easy to host in Node.js. Using it for the "TCP" channel avoids
    needing a separate TCP server and simplifies browser + native client parity.

  - WebRTC DataChannel for unreliable messages: Browsers cannot open raw UDP
    sockets; WebRTC provides a browser-friendly unreliable datagram channel
    with low latency. The repository uses WebSocket for ICE signaling and
    negotiates a `RTCDataChannel` for actual game-state messages.

  - Terminator (magic value) appended at packet end: appending a terminator is
    robust against fragmented transport frames. Because WebSocket and RTC
    DataChannels can split or aggregate application messages, a terminator
    allows the receiver to detect full logical packets regardless of chunking.

  - Configurable `magicValue`: The default (`PACKET_END`) is a human-readable
    sentinel that makes debugging easier; it is configurable via the server or
    client config objects if you prefer a shorter or binary marker.

  Serialization and extensibility
  -------------------------------

  - Example code uses JSON payloads for clarity (easy to inspect and debug).
    The transport layer operates on `Uint8Array` buffers, so you can replace
    JSON with any binary encoding for
    production.
