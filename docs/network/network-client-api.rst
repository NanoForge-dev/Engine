TCPClient
~~~~~~~~~

**connect** ()
  Initiate a WebSocket connection to the server (e.g. `ws://<ip>:<port>`).

  :return: Promise<void>

**isConnected** ()
  Return `true` when the underlying WebSocket is open.

  :return: boolean

**sendData** (*data*)
  Send a payload to the server.

  :param data: Uint8Array — raw payload bytes.
  :return: void

**getReceivedPackets** ()
  Return an array of complete packets that were reassembled from received chunks.

  :return: Uint8Array[] — array of packet buffers.


UDPClient
~~~~~~~~~

**connect** ()
  Open a WebSocket for signaling, create an RTCPeerConnection and initiate an SDP offer.

  :return: Promise<void>

**isConnected** ()
  Return `true` when the RTCDataChannel is open.

  :return: boolean

**sendData** (*data*)
  Send a payload on the data channel.

  :param data: Uint8Array — raw payload bytes.
  :return: void

**getReceivedPackets** ()
  Return an array of complete packets reassembled from received data-channel chunks.

  :return: Uint8Array[] — array of packet buffers.

