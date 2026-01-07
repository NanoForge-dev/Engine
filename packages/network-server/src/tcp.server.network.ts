import { type RawData, type WebSocket, WebSocketServer } from "ws";

import { buildMagicPacket, parsePacketsFromChunks, rawDataToUint8Array } from "./utils";

/** TCPServer
 * Reliable ordered send/receive of packets to multiple TCP clients
 */
export class TCPServer {
  private _clients = new Map<
    number,
    { channel: WebSocket; data: Uint8Array; chunkedData: Uint8Array[] }
  >();
  private _nextClientId: number = 0;
  private readonly _magicData = new Uint8Array();

  constructor(
    private _port: number,
    private _host: string,
    magicValue: string,
  ) {
    this._magicData = new TextEncoder().encode(magicValue);
  }

  /**
   * Start the WebSocket server and begin accepting clients.
   *
   * @returns void
   */
  public listen() {
    const webSocketServer = this.startWebSocketServer();

    webSocketServer.on("connection", (webSocket, request) => {
      webSocket.binaryType = "arraybuffer";
      this._clients.set(this._nextClientId, {
        channel: webSocket,
        data: new Uint8Array(),
        chunkedData: [],
      });
      const id = this._nextClientId;
      const client = this._clients.get(id);
      this._nextClientId++;

      console.log("TCP openned for user: " + id + ", ip: " + request.socket.remoteAddress);

      webSocket.on("message", (msg: RawData) => {
        const chunk = rawDataToUint8Array(msg);
        client?.chunkedData.push(chunk);
      });

      webSocket.on("close", () => {
        console.log("TCP closed for user: " + id + ", ip: " + request.socket.remoteAddress);
        this._clients.delete(id);
      });
    });
  }

  /**
   * Return a snapshot array of numeric client IDs currently connected.
   *
   * @returns number[]
   */
  public getConnectedClients(): number[] {
    return [...this._clients.keys()];
  }

  /**
   * Send a payload to every connected client.
   *
   * @param data Uint8Array — raw payload bytes.
   * @returns void
   */
  public sendToEverybody(data: Uint8Array) {
    const magicPacket = buildMagicPacket(data, this._magicData);
    this._clients.forEach((client) => {
      client.channel.send(magicPacket);
    });
  }

  /**
   * Send a payload to the client identified by `clientId`.
   *
   * @param clientId number — numeric client identifier.
   * @param data Uint8Array — payload bytes.
   * @returns void
   */
  public sendToClient(clientId: number, data: Uint8Array) {
    const client = this._clients.get(clientId);
    if (!client) {
      console.error(`Unknown client: ${clientId}`);
      return;
    }
    client.channel.send(buildMagicPacket(data, this._magicData));
  }

  /**
   * Parse and return complete packets received from each client. Each packet is a `Uint8Array` buffer.
   *
   * @returns Map<number, Uint8Array[]> — mapping client ID to array of packets.
   */
  public getReceivedPackets(): Map<number, Uint8Array[]> {
    const packets = new Map<number, Uint8Array[]>();

    this._clients.forEach((client, clientId) => {
      const {
        packets: clientPackets,
        data,
        chunkedData,
      } = parsePacketsFromChunks(client.data, client.chunkedData, this._magicData);
      client.data = data;
      client.chunkedData = chunkedData;
      packets.set(clientId, clientPackets);
    });
    return packets;
  }

  private startWebSocketServer(): WebSocketServer {
    const webSocketServer = new WebSocketServer({
      port: this._port,
      host: this._host,
    });

    console.log("WebSocketServer for TCP listening on ws://" + this._host + ":" + this._port);
    return webSocketServer;
  }
}
