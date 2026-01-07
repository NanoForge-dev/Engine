TCPServer
~~~~~~~~~

**listen** ()
  Start the WebSocket server and begin accepting clients.

  :return: void

**getConnectedClients** ()
  Return a snapshot array of numeric client IDs currently connected.

  :return: number[] — an array of client IDs.

**sendToEverybody** (*data*)
  Send a payload to every connected client.

  :param data: Uint8Array — raw payload bytes.
  :return: void
  :throws: none (errors are logged, not thrown)

**sendToClient** (*clientId, data*)
  Send a payload to the client identified by `clientId`.

  :param clientId: number — numeric client identifier.
  :param data: Uint8Array — payload bytes.
  :return: void
  :throws: none (logs if client unknown)

**getReceivedPackets** ()
  Parse and return complete packets received from each client. Each packet is a `Uint8Array` buffer.

  :return: Map<number, Uint8Array[]> — mapping client ID to array of packets.


UDPServer
~~~~~~~~~

**listen** ()
  Start the signaling WebSocket and accept incoming client offers (SDP/ICE).

  :return: void

**getConnectedClients** ()
  Return a snapshot array of client IDs with active data channels.

  :return: number[] — list of client IDs.

**sendToEverybody** (*data*)
  Send a payload to every connected data channel.

  :param data: Uint8Array — raw payload bytes.
  :return: void

**sendToClient** (*clientId, data*)
  Send a payload to a single client data channel.

  :param clientId: number
  :param data: Uint8Array
  :return: void

**getReceivedPackets** ()
  Parse incoming channel chunks and return a map of complete packets per client.

  :return: Map<number, Uint8Array[]> — mapping client ID to array of packets.
