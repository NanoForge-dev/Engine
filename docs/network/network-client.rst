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

Example
-------

It works exactly the same with UDP

.. code-block:: javascript

  // Wait for connection to be established
  async function waitForConnection(): Promise<void> {
    if (network.tcp?.isConnected()) return;

    return new Promise((resolve) => {
      const check = () => {
        if (network.tcp.isConnected()) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }
  await waitForConnection();

  // Send a json encoded packet
  network.tcp.sendData(new TextEncoder().encode(JSON.stringify({ hello: 'world' })));

  // Receive raw server packets
  const latestsPackets = getReceivedPackets();

  // Decode packets if encoded in json
  const decodedPackets = latestsPackets.map((packet) => {
    return JSON.parse(new TextDecoder().decode(packet));
  });

Notes
-----

- See `docs/network/network-client-api.rst` for the exact list available functions.
- For packet framing/terminator semantics see `docs/network/packet-framing.rst`.