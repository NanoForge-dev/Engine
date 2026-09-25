import type { Server, ServerWebSocket } from "bun";

import {
  RELIABLE_CHANNELS,
  type ReliableChannel,
  decodeReliableFrame,
  encodeReliableFrame,
} from "../shared/channels";
import type { WelcomeMessage } from "../shared/session";
import {
  type ClientId,
  type ClientInfo,
  ClientRegistry,
  type ConnectionInfo,
  buildConnectionInfo,
  getSessionToken,
} from "./client-registry";
import { rawDataToUint8Array } from "./utils";

/** Per-connection state attached to each upgraded socket. */
type TCPSocketData = {
  /** Session identifier, assigned once the socket opens and joins a session. */
  id?: ClientId;
  /** Session token presented in the upgrade request, `null` for a new session. */
  token: string | null;
  /** What is known about the connection, resolved during the upgrade. */
  connection: ConnectionInfo;
};

/** Server side of one client's WebSocket. */
type TCPClientState = {
  channel: ServerWebSocket<TCPSocketData>;
  packets: Map<ReliableChannel, Uint8Array[]>;
};

/**
 * WebSocket server carrying the reliable channels of every TCP client.
 *
 * @remarks
 * Each binary frame is one packet, prefixed with the tag of its reliable
 * channel.  Each client that connects joins a session identified by a {@link ClientId},
 * shared with the UDP transport when the client presents its session token.
 * On open, the server sends a `welcome` text frame carrying the id and token.
 *
 * Runs on Bun's native WebSocket server (`Bun.serve`) and therefore requires
 * the Bun runtime.
 *
 * Internal: games use it through `ReliableOrderedServer` and
 * `ReliableUnorderedServer`, which `NetworkServerLibrary` sets up during
 * `__init`.
 */
export class TCPServer {
  private _clients = new Map<ClientId, TCPClientState>();
  private _server: Server<TCPSocketData> | undefined;

  constructor(
    private _port: number,
    private _host: string,
    private _cert?: string,
    private _key?: string,
    private readonly _registry: ClientRegistry = new ClientRegistry(),
  ) {
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
        const token = getSessionToken(request);
        if (!this._registry.canAttach(token, "tcp")) {
          return new Response("Invalid session token", { status: 401 });
        }

        const connection = buildConnectionInfo("tcp", request, server);
        if (server.upgrade(request, { data: { token, connection } })) {
          return undefined;
        }
        return new Response("Expected a WebSocket connection", { status: 426 });
      },
      websocket: {
        open: (webSocket) => {
          const session = this._registry.attach(webSocket.data.token, webSocket.data.connection);
          if (!session) {
            webSocket.close(1008, "Invalid session token");
            return;
          }

          const { id, token } = session;
          webSocket.data.id = id;
          this._clients.set(id, {
            channel: webSocket,
            packets: new Map(RELIABLE_CHANNELS.map((channel) => [channel, []])),
          });
          webSocket.send(JSON.stringify({ type: "welcome", id, token } satisfies WelcomeMessage));

          console.log("TCP openned for user: " + id + ", ip: " + webSocket.data.connection.address);
        },
        message: (webSocket, message) => {
          if (typeof message === "string") {
            console.error("TCP received an unexpected text frame from user: " + webSocket.data.id);
            return;
          }

          if (webSocket.data.id === undefined) return;
          const client = this._clients.get(webSocket.data.id);
          if (!client) return;

          const frame = decodeReliableFrame(rawDataToUint8Array(message));
          if (!frame) {
            console.error(
              "TCP received a frame on an unknown channel from user: " + client.channel.data.id,
            );
            return;
          }
          client.packets.get(frame.channel)?.push(frame.data);
        },
        close: (webSocket) => {
          const id = webSocket.data.id;
          if (id === undefined) return;

          console.log("TCP closed for user: " + id + ", ip: " + webSocket.data.connection.address);
          this._clients.delete(id);
          this._registry.detach(id, "tcp");
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
   * Return a snapshot array of the client IDs currently connected over TCP.
   *
   * @remarks
   * Both reliable channels share the WebSocket, so the channel is ignored.
   *
   * @returns ClientId[]
   */
  public getConnectedClients(): ClientId[] {
    return [...this._clients.keys()];
  }

  /**
   * Return what is known about a client session: its address, user agent,
   * query parameters and attached transports.
   *
   * @param clientId ClientId — client identifier.
   * @returns ClientInfo | undefined — `undefined` when the client is gone.
   */
  public getClientInfo(clientId: ClientId): ClientInfo | undefined {
    return this._registry.get(clientId);
  }

  /**
   * Send a payload to every connected client on a reliable channel.
   *
   * @param channel ReliableChannel — channel to send on.
   * @param data Uint8Array — raw payload bytes.
   * @returns void
   */
  public sendToEverybody(channel: ReliableChannel, data: Uint8Array) {
    const frame = encodeReliableFrame(channel, data);
    this._clients.forEach((client) => {
      client.channel.send(frame);
    });
  }

  /**
   * Send a payload to the client identified by `clientId` on a reliable channel.
   *
   * @param channel ReliableChannel — channel to send on.
   * @param clientId ClientId — client identifier.
   * @param data Uint8Array — payload bytes.
   * @returns void
   */
  public sendToClient(channel: ReliableChannel, clientId: ClientId, data: Uint8Array) {
    const client = this._clients.get(clientId);
    if (!client) {
      console.error(`Unknown client: ${clientId}`);
      return;
    }
    client.channel.send(encodeReliableFrame(channel, data));
  }

  /**
   * Return the packets each client sent on a reliable channel since the last call.
   *
   * @param channel ReliableChannel — channel to read.
   * @returns Map<ClientId, Uint8Array[]> — mapping client ID to array of packets.
   */
  public getReceivedPackets(channel: ReliableChannel): Map<ClientId, Uint8Array[]> {
    const packets = new Map<ClientId, Uint8Array[]>();

    this._clients.forEach((client, clientId) => {
      packets.set(clientId, client.packets.get(channel) ?? []);
      client.packets.set(channel, []);
    });
    return packets;
  }
}
