import type { Server, ServerWebSocket } from "bun";

import { buildMagicPacket, parsePacketsFromChunks } from "../shared/utils";
import { rawDataToUint8Array } from "./utils";

/** Per-connection state attached to each upgraded socket. */
type TCPSocketData = {
  /** Numeric client identifier, assigned once the socket opens. */
  id: number;
  /** Remote address, resolved during the upgrade for logging. */
  ip: string;
};

/**
 * Reliable, ordered WebSocket-based server that manages multiple TCP clients.
 *
 * @remarks
 * Each client that connects is assigned a numeric ID.  Use
 * `getConnectedClients` to enumerate active clients,
 * `sendToClient` / `sendToEverybody` to push data, and
 * `getReceivedPackets` to consume incoming packets per frame.
 *
 * Runs on Bun's native WebSocket server (`Bun.serve`) and therefore requires
 * the Bun runtime.
 *
 * Typical usage is through `NetworkServerLibrary` which instantiates and
 * starts this class automatically during `__init`.
 */
export class TCPServer {
  private _clients = new Map<
    number,
    { channel: ServerWebSocket<TCPSocketData>; data: Uint8Array; chunkedData: Uint8Array[] }
  >();
  private _nextClientId: number = 0;
  private readonly _magicData = new Uint8Array();
  private _server: Server<TCPSocketData> | undefined;

  constructor(
    private _port: number,
    private _host: string,
    magicValue: string,
    private _cert?: string,
    private _key?: string,
  ) {
    this._magicData = new TextEncoder().encode(magicValue);
    if (!this._cert || !this._key) {
      console.warn(
        "No TLS cert/key provided for TCP server, WebSocket connections will be unencrypted",
      );
    }
  }

  /**
   * Start the WebSocket server and begin accepting clients.
   *
   * @returns void
   */
  public listen() {
    const cert = this._cert;
    const key = this._key;
    const secure = cert !== undefined && key !== undefined;

    this._server = Bun.serve<TCPSocketData>({
      port: this._port,
      hostname: this._host,
      ...(cert !== undefined && key !== undefined
        ? { tls: { cert: Bun.file(cert), key: Bun.file(key) } }
        : {}),
      fetch: (request, server) => {
        const ip = server.requestIP(request)?.address ?? "unknown";

        if (server.upgrade(request, { data: { id: -1, ip } })) {
          return undefined;
        }
        return new Response("Expected a WebSocket connection", { status: 426 });
      },
      websocket: {
        open: (webSocket) => {
          const id = this._nextClientId++;
          webSocket.data.id = id;
          this._clients.set(id, {
            channel: webSocket,
            data: new Uint8Array(),
            chunkedData: [],
          });

          console.log("TCP openned for user: " + id + ", ip: " + webSocket.data.ip);
        },
        message: (webSocket, message) => {
          if (typeof message === "string") {
            console.error("TCP received an unexpected text frame from user: " + webSocket.data.id);
            return;
          }

          const client = this._clients.get(webSocket.data.id);
          client?.chunkedData.push(rawDataToUint8Array(message));
        },
        close: (webSocket) => {
          console.log("TCP closed for user: " + webSocket.data.id + ", ip: " + webSocket.data.ip);
          this._clients.delete(webSocket.data.id);
        },
      },
    });

    console.log(
      `${secure ? "Secure " : ""}WebSocketServer for TCP listening on ` +
        `${secure ? "wss" : "ws"}://${this._host}:${this._port}`,
    );
  }

  /**
   * Stop the server and drop every connected client.
   *
   * @returns void
   */
  public close() {
    this._server?.stop(true);
    this._server = undefined;
    this._clients.clear();
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
}
