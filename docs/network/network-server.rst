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

Minimal usage pattern (as in `example/pong-network`)
--------------------------------------------------

- Server reads incoming TCP packets and handles simple single-message commands
  (JSON frames in the example):

.. code-block:: javascript

  // In a server system: read incoming messages
  const clientPackets = network.tcp.getReceivedPackets();
  clientPackets.forEach((packets, clientId) => {
    packets.forEach((packet) => {
      const msg = JSON.parse(new TextDecoder().decode(packet));
      if (msg.type === 'play') {
        // register client and reply using network.tcp.sendToClient(...)
      }
    });
  });

- To broadcast authoritative state, the server can use `network.tcp.sendToEverybody`
  or `network.tcp.sendToClient(clientId, data)`, and use the UDP-like data channels
  (WebRTC) for fast, best-effort updates.

Notes
-----

- See `docs/network/network-server-api.rst` for the exact list of server
  functions available to your systems.
- For packet framing and terminator semantics see:
  `docs/network/packet-framing.rst`.