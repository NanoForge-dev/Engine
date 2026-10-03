import { type Context, type InitContext, Library, defineLibraryKey } from "@nanoforge-dev/common";
import { registerEnv } from "@nanoforge-dev/env";

import {
  CHANNELS,
  type Channel,
  type ChannelOptions,
  DEFAULT_CHANNEL,
  isReliableChannel,
} from "../shared/channels";
import { NetworkData, type NetworkPayload, encodeNetworkPayload } from "../shared/network-data";
import { type ClientId, type ClientInfo, ClientRegistry, type ClientsApi } from "./client-registry";
import { ServerConfigNetwork } from "./config.server.network";
import type { NetworkServerContextApi } from "./network-server-context.type";
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
 *
 * @example
 * ```ts
 * ctx.network.sendToAll({ type: "start" }); // Channel.ReliableOrdered
 * ctx.network.sendToAll({ x: 1, y: 2 }, { channel: Channel.UnreliableUnordered });
 * ctx.network.getReceivedPackets().forEach((packets, clientId) => {
 *   const messages = packets.map((packet) => packet.json()); // every channel
 * });
 * ```
 */
export class NetworkServerLibrary extends Library {
  readonly key = defineLibraryKey("network");

  private _tcp?: TCPServer;
  private _udp?: UDPServer;

  private readonly _registry = new ClientRegistry();

  /** Client sessions shared by the TCP and UDP servers. */
  public get clients(): ClientsApi {
    return this._registry;
  }

  public override async __init(ctx: InitContext): Promise<void> {
    if (typeof Bun === "undefined") {
      throw new Error(
        "NetworkServerLibrary: the Bun runtime is required. The server is built on " +
          "Bun.serve and cannot run on Node.js — start the server process with Bun.",
      );
    }

    const config = await registerEnv(ServerConfigNetwork, ctx.env);

    if (config.LISTENING_TCP_PORT === undefined && config.LISTENING_UDP_PORT === undefined) {
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
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override async __clear(_ctx: Context): Promise<void> {
    this._tcp?.close();
    this._udp?.close();
    this._registry.clear();
    delete this._tcp;
    delete this._udp;
  }

  /**
   * Send a payload to every client reachable on a channel.
   *
   * @param data - Bytes, a string, or any value `JSON.stringify` can encode.
   * @param options - `channel` to send on, `Channel.ReliableOrdered` by default.
   * @throws When the channel's port was not configured, or `data` cannot be
   * encoded as JSON.
   */
  public sendToAll(data: NetworkPayload, { channel = DEFAULT_CHANNEL }: ChannelOptions = {}): void {
    const bytes = encodeNetworkPayload(data);
    if (isReliableChannel(channel)) this.requireTcp(channel).sendToEverybody(channel, bytes);
    else this.requireUdp(channel).sendToEverybody(channel, bytes);
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
  public sendToClient(
    clientId: ClientId,
    data: NetworkPayload,
    { channel = DEFAULT_CHANNEL }: ChannelOptions = {},
  ): void {
    const bytes = encodeNetworkPayload(data);
    if (isReliableChannel(channel)) this.requireTcp(channel).sendToClient(channel, clientId, bytes);
    else this.requireUdp(channel).sendToClient(channel, clientId, bytes);
  }

  /**
   * Return the packets each client sent since the last call.
   *
   * @remarks
   * Call this method once per frame.  Without a `channel`, the packets of every
   * configured channel are merged per client, reliable channels first.
   *
   * @param options - `channel` to read from, every channel by default.
   * @returns Map of client id to packets, each read with `bytes()`, `text()`,
   * `json()`…
   * @throws When the channel's port was not configured.
   */
  public getReceivedPackets({ channel }: ChannelOptions = {}): Map<ClientId, NetworkData[]> {
    if (channel !== undefined) {
      const packets = isReliableChannel(channel)
        ? this.requireTcp(channel).getReceivedPackets(channel)
        : this.requireUdp(channel).getReceivedPackets(channel);
      return new Map(
        [...packets].map(([clientId, raw]) => [clientId, raw.map((p) => new NetworkData(p))]),
      );
    }

    const merged = new Map<ClientId, NetworkData[]>();
    for (const c of this.configuredChannels()) {
      this.getReceivedPackets({ channel: c }).forEach((packets, clientId) => {
        merged.set(clientId, [...(merged.get(clientId) ?? []), ...packets]);
      });
    }
    return merged;
  }

  /**
   * Return the clients reachable on a channel.
   *
   * @param options - `channel` to check, any configured channel by default.
   * @returns Snapshot array of client ids.
   * @throws When the channel's port was not configured.
   */
  public getConnectedClients({ channel }: ChannelOptions = {}): ClientId[] {
    if (channel !== undefined) {
      if (isReliableChannel(channel)) return this.requireTcp(channel).getConnectedClients();
      return this.requireUdp(channel).getConnectedClients(channel);
    }
    return [
      ...new Set([
        ...(this._tcp?.getConnectedClients() ?? []),
        ...(this._udp?.getConnectedClients() ?? []),
      ]),
    ];
  }

  /**
   * Return what is known about a client session: its address, user agent,
   * query parameters and attached transports.
   *
   * @param clientId - Client identifier.
   * @returns The live session info, or `undefined` when the client is gone.
   */
  public getClientInfo(clientId: ClientId): ClientInfo | undefined {
    return this._registry.get(clientId);
  }

  public override expose(): NetworkServerContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      sendToAll: (data, options) => library.sendToAll(data, options),
      sendToClient: (clientId, data, options) => library.sendToClient(clientId, data, options),
      getReceivedPackets: (options) => library.getReceivedPackets(options),
      getConnectedClients: (options) => library.getConnectedClients(options),
      getClientInfo: (clientId) => library.getClientInfo(clientId),
      get clients() {
        return library.clients;
      },
    };
  }

  private configuredChannels(): Channel[] {
    return CHANNELS.filter((channel) =>
      isReliableChannel(channel) ? this._tcp !== undefined : this._udp !== undefined,
    );
  }

  private requireTcp(channel: Channel): TCPServer {
    if (!this._tcp) throw new Error(`Channel ${channel} needs LISTENING_TCP_PORT to be set`);
    return this._tcp;
  }

  private requireUdp(channel: Channel): UDPServer {
    if (!this._udp) throw new Error(`Channel ${channel} needs LISTENING_UDP_PORT to be set`);
    return this._udp;
  }
}
