Client Networking (network-client)
==================================

This document describes how the `network-client` package actually connects
to a `NetworkServerLibrary` instance and the concrete APIs you will use from
client-side code.

Overview
--------

A client connects to a single server instance (one TCP/WebSocket control
channel and optionally a single WebRTC data channel for unreliable traffic).
Client responsibilities in a game are typically:

- Initiate a TCP connection and send control commands (join/play/input).
- Optionally negotiate a WebRTC data channel for receiving server snapshots
  or sending low-latency updates.

Minimal usage pattern (as in `example/pong-network`)
--------------------------------------------------

.. code-block:: javascript

  // Ensure TCP is connected
  await network.tcp.connect();

  // Wait for UDP (RTC data channel) if used by the server
  await waitForConnection();

  // Send a simple reliable control message (play)
  network.tcp.sendData(new TextEncoder().encode(JSON.stringify({ type: 'play' })));

  // Send input messages (example)
  network.tcp.sendData(new TextEncoder().encode(JSON.stringify({ type: 'input', key: 'up' })));

Notes
-----

- See `docs/network/network-client-api.rst` for the client functions exposed to
  your game code.
- For packet framing/terminator semantics see `docs/network/packet-framing.rst`.