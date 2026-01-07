Server Networking (network-server)
==================================

This document explains the actual `network-server` package implementation and
the APIs you will use from server-side code.

Overview
--------

The server listens on configured ports and accepts client connections.
A single server process can accept many clients; typical server responsibilities
in a game are:

- Accept reliable control messages from clients over the TCP (WebSocket) channel.
- Optionally establish `RTCPeerConnection`s (via WebSocket signaling) to receive
  unreliable, unordered data channels for low-latency state updates.

Example
--------------------------------------------------

It works exactly the same with UDP

.. code-block:: javascript
  // Send everybody a json encoded packet
  network.tcp.sendToEverybody(
    new TextEncoder().encode(JSON.stringify(
      { type: "are you here" }
    ))
  );

  // Check connected clients
  const connectedClients = getConnectedClients();

  // Receive all packets
  const allPackets = network.tcp.getReceivedPackets();

  // Get first client packets
  const firstClientPackets = map.get(connectedClients[0]);

  // Decode packets if encoded in json
  const decodedPackets = firstClientPackets.map((packet) => {
    return JSON.parse(new TextDecoder().decode(packet));
  });

Notes
-----

- See `docs/network/network-server-api.rst` for the exact list available functions.
- For packet framing and terminator semantics see `docs/network/packet-framing.rst`.