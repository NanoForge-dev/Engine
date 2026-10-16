import { type Context, type InitContext, Library, defineLibraryKey } from "@nanoforge-dev/common";
import type { EditorAwareLibrary, EditorInitContext } from "@nanoforge-dev/editor-lib";
import { registerEnv } from "@nanoforge-dev/env";

import {
  type ChannelOptions,
  RELIABLE_CHANNELS,
  UNRELIABLE_CHANNELS,
  isReliableChannel,
} from "../shared/channels";
import type { NetworkData, NetworkPayload } from "../shared/network-data";
import { type Trace, createTrace, traceServer } from "../shared/trace";
import { type ClientId, type ClientInfo, ClientRegistry, type ClientsApi } from "./client-registry";
import { ServerConfigNetwork } from "./config.server.network";
import { NetworkServer } from "./network-server";
import type { NetworkServerContextApi, ServerPacketsApi } from "./network-server-context.type";
import { SignalingServer } from "./signaling.server.network";
import { TCPServer } from "./tcp.server.network";
import { UDPServer } from "./udp.server.network";

/**
 * Built-in network library for server-side applications.
 *
 * @remarks
 * Reads network configuration from the environment via `ServerConfigNetwork`
 * and starts TCP (WebSocket) and/or UDP (WebRTC) servers.  TCP carries the
 * reliable channels and UDP the unreliable ones.
 *
 * Configuration (via environment variables):
 * - `LISTENING_INTERFACE` — bind address (default: `"0.0.0.0"`).
 * - `LISTENING_TCP_PORT` — WebSocket listen port for TCP (optional).
 * - `LISTENING_UDP_PORT` — signaling listen port for UDP (optional).
 * - `WSS_CERT` / `WSS_KEY` — paths to TLS certificate and key files for WSS (optional).
 * - `ICE_SERVERS` — STUN/TURN servers for the UDP transport, comma-separated or a JSON array (default: `[]`).
 * - `ICE_PORT` — fixed, multiplexed UDP port for the UDP transport (optional).
 * - `ADVERTISE_IP` — public address written into host ICE candidates (optional).
 * - `LISTENING_SIGNALING_PORT` — signaling port pairing `NetworkPeerLibrary` players (optional).
 *
 * @example
 * ```ts
 * ctx.network.sendToAll({ type: "start" }); // Channel.ReliableOrdered
 * ctx.network.sendToAll({ x: 1, y: 2 }, { channel: Channel.UnreliableUnordered });
 * ctx.network.packets.sendToAll(Move, move); // typed packet, see `definePacket`
 * ctx.network.getReceivedPackets().forEach((packets, clientId) => {
 *   const messages = packets.map((packet) => packet.json()); // every channel
 * });
 * ```
 */
export class NetworkServerLibrary extends Library implements EditorAwareLibrary {
  readonly key = defineLibraryKey("network");

  private _tcp?: TCPServer;
  private _udp?: UDPServer;
  private _signaling?: SignalingServer;

  private readonly _registry = new ClientRegistry();
  private readonly _server = new NetworkServer(
    this._registry,
    (channel) =>
      `Channel ${channel} needs ${isReliableChannel(channel) ? "LISTENING_TCP_PORT" : "LISTENING_UDP_PORT"} to be set`,
  );

  /** Client sessions shared by the TCP and UDP servers. */
  public get clients(): ClientsApi {
    return this._server.clients;
  }

  private _trace: Trace | undefined;

  constructor() {
    super({ runAfter: ["ecs"] });
  }

  /** Typed packets: per-type listeners, `read` and sending. */
  public get packets(): ServerPacketsApi {
    return this._server.packets;
  }

  public override async __init(ctx: InitContext): Promise<void> {
    if (typeof Bun === "undefined") {
      throw new Error(
        "NetworkServerLibrary: the Bun runtime is required. The server is built on " +
          "Bun.serve and cannot run on Node.js — start the server process with Bun.",
      );
    }

    const config = await registerEnv(ServerConfigNetwork, ctx.env);

    if (
      config.LISTENING_TCP_PORT === undefined &&
      config.LISTENING_UDP_PORT === undefined &&
      config.LISTENING_SIGNALING_PORT === undefined
    ) {
      throw new Error("NetworkServerLibrary: no listening port specified.");
    }

    if (
      (config.WSS_CERT !== undefined && config.WSS_KEY === undefined) ||
      (config.WSS_CERT === undefined && config.WSS_KEY !== undefined)
    ) {
      throw new Error("NetworkServerLibrary: both WSS_CERT and WSS_KEY must be provided together.");
    }

    if (config.LISTENING_TCP_PORT !== undefined) {
      this._tcp = new TCPServer(
        +config.LISTENING_TCP_PORT,
        config.LISTENING_INTERFACE,
        config.WSS_CERT,
        config.WSS_KEY,
        this._registry,
      );
      this._tcp.listen();
    }

    if (config.LISTENING_UDP_PORT !== undefined) {
      this._udp = new UDPServer(
        +config.LISTENING_UDP_PORT,
        config.LISTENING_INTERFACE,
        config.WSS_CERT,
        config.WSS_KEY,
        {
          iceServers: config.ICE_SERVERS,
          ...(config.ICE_PORT !== undefined ? { port: +config.ICE_PORT } : {}),
          ...(config.ADVERTISE_IP !== undefined ? { advertiseIp: config.ADVERTISE_IP } : {}),
        },
        this._registry,
      );
      this._udp.listen();
    }

    if (config.LISTENING_SIGNALING_PORT !== undefined) {
      this._signaling = new SignalingServer(
        +config.LISTENING_SIGNALING_PORT,
        config.LISTENING_INTERFACE,
        config.WSS_CERT,
        config.WSS_KEY,
      );
      this._signaling.listen();
    }

    this.routeChannels();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override async __clear(_ctx: Context): Promise<void> {
    this._tcp?.close();
    this._udp?.close();
    this._signaling?.stop();
    this._registry.clear();
    delete this._tcp;
    delete this._udp;
    delete this._signaling;
    this.routeChannels();
  }

  /**
   * Send a payload to every client reachable on a channel.
   *
   * @param data - Bytes, a string, or any value `JSON.stringify` can encode.
   * @param options - `channel` to send on, `Channel.ReliableOrdered` by default.
   * @throws When the channel's port was not configured, or `data` cannot be
   * encoded as JSON.
   */
  public sendToAll(data: NetworkPayload, options?: ChannelOptions): void {
    this._server.sendToAll(data, options);
  }

  /**
   * Send a payload to one client.
   *
   * @param clientId - Client identifier.
   * @param data - Bytes, a string, or any value `JSON.stringify` can encode.
   * @param options - `channel` to send on, `Channel.ReliableOrdered` by default.
   * @throws When the channel's port was not configured, or `data` cannot be
   * encoded as JSON.
   */
  public sendToClient(clientId: ClientId, data: NetworkPayload, options?: ChannelOptions): void {
    this._server.sendToClient(clientId, data, options);
  }

  /**
   * Return the packets each client sent since the last call.
   *
   * @remarks
   * Call this method once per frame: packets left unread for a whole tick are
   * dropped, and typed packets never show up here.  Without a `channel`, the
   * packets of every configured channel are merged per client, reliable channels first.
   *
   * @param options - `channel` to read from, every channel by default.
   * @returns Map of client id to packets, each read with `bytes()`, `text()`,
   * `json()`…
   * @throws When the channel's port was not configured.
   */
  public getReceivedPackets(options?: ChannelOptions): Map<ClientId, NetworkData[]> {
    return this._server.getReceivedPackets(options);
  }

  /**
   * Return the clients reachable on a channel.
   *
   * @param options - `channel` to check, any configured channel by default.
   * @returns Snapshot array of client ids.
   * @throws When the channel's port was not configured.
   */
  public getConnectedClients(options?: ChannelOptions): ClientId[] {
    return this._server.getConnectedClients(options);
  }

  /**
   * Return what is known about a client session: its address, user agent,
   * query parameters and attached transports.
   *
   * @param clientId - Client identifier.
   * @returns The live session info, or `undefined` when the client is gone.
   */
  public getClientInfo(clientId: ClientId): ClientInfo | undefined {
    return this._server.getClientInfo(clientId);
  }

  /**
   * Traces packets for the editor (`network-trace`, `network-stats`) while
   * its `welcome` asks for it.
   */
  public async __editorInit(ctx: EditorInitContext): Promise<void> {
    const trace = createTrace(ctx.editor);
    if (this._tcp) traceServer(this._tcp, "tcp", trace);
    if (this._udp) traceServer(this._udp, "udp", trace);
    this._trace = trace;
  }

  /** Sends the totals of the packets traced for the editor (also while paused). */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override async __events(_ctx: Context): Promise<void> {
    this._trace?.tick();
  }

  /** Calls the listeners of the typed packets received since the last tick. */
  public override async __run(ctx: Context): Promise<void> {
    this._server.run(ctx);
  }

  public override expose(): NetworkServerContextApi {
    return this._server.expose();
  }

  /** TCP carries the reliable channels, UDP the unreliable ones. */
  private routeChannels(): void {
    this._server.transports = {
      ...(this._tcp && Object.fromEntries(RELIABLE_CHANNELS.map((c) => [c, this._tcp]))),
      ...(this._udp && Object.fromEntries(UNRELIABLE_CHANNELS.map((c) => [c, this._udp]))),
    };
  }
}
