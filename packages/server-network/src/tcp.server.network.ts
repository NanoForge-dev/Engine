import { type RawData, type WebSocket, WebSocketServer } from "ws";

import { buildMagicPacket, parsePacketsFromChunks, rawDataToUint8Array } from "./utils";

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

  public getConnectedClients(): number[] {
    return [...this._clients.keys()];
  }

  public sendToEverybody(data: Uint8Array) {
    const magicPacket = buildMagicPacket(data, this._magicData);
    this._clients.forEach((client) => {
      client.channel.send(magicPacket);
    });
  }

  public sendToClient(clientId: number, data: Uint8Array) {
    const client = this._clients.get(clientId);
    if (!client) {
      console.error(`Unkown client: ${clientId}`);
      return;
    }
    client.channel.send(buildMagicPacket(data, this._magicData));
  }

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
