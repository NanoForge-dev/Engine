import type { Context } from "@nanoforge-dev/common";

import { CHANNELS, type Channel, type ChannelOptions, DEFAULT_CHANNEL } from "../shared/channels";
import {
  type NetworkData,
  type NetworkPayload,
  encodeNetworkPayload,
} from "../shared/network-data";
import {
  PacketDispatcher,
  type TypedPacket,
  encodePacket,
  encodeTypedPacket,
  sortPackets,
} from "../shared/packet";
import type { ServerTransport } from "../shared/transport";
import type { ClientId, ClientInfo, ClientRegistry, ClientsApi } from "./client-registry";
import type {
  NetworkServerContextApi,
  ServerPacketInfo,
  ServerPacketsApi,
} from "./network-server-context.type";

/**
 * Transport-independent half of a server: client sessions, typed and raw
 * packet queues, and routing of each channel to the transport carrying it.
 *
 * @remarks
 * Shared by `NetworkServerLibrary` (TCP and UDP transports, on Bun) and the
 * browser `NetworkServerLibrary` (WebRTC and loopback, in the host's tab), so it
 * imports nothing runtime-specific.
 */
export class NetworkServer {
  /** Transport carrying each channel; a missing channel throws when used. */
  public transports: Partial<Record<Channel, ServerTransport<Channel>>> = {};

  private readonly _dispatcher = new PacketDispatcher<ServerPacketInfo>();
  private _typed: TypedPacket<ServerPacketInfo>[] = [];
  private readonly _raw = new Map<Channel, Map<ClientId, NetworkData[]>>();
  private readonly _packets: ServerPacketsApi = {
    on: (packet, listener) => this._dispatcher.on(packet, listener),
    read: (packet) => this._dispatcher.read(packet),
    sendToAll: (packet, ...[data, options]) =>
      this.sendBytesToAll(options?.channel ?? packet.channel, encodeTypedPacket(packet, data)),
    sendToClient: (clientId, packet, ...[data, options]) =>
      this.sendBytesToClient(
        clientId,
        options?.channel ?? packet.channel,
        encodeTypedPacket(packet, data),
      ),
  };

  /**
   * @param registry - Client sessions, shared with the transports.
   * @param requirement - Error message for a channel with no transport.
   */
  constructor(
    private readonly _registry: ClientRegistry,
    private readonly _requirement: (channel: Channel) => string,
  ) {}

  /** Client sessions shared by the transports. */
  public get clients(): ClientsApi {
    return this._registry;
  }

  /** Typed packets: per-type listeners, `read` and sending. */
  public get packets(): ServerPacketsApi {
    return this._packets;
  }

  /** See `NetworkServerContextApi.sendToAll`. */
  public sendToAll(data: NetworkPayload, { channel = DEFAULT_CHANNEL }: ChannelOptions = {}): void {
    this.sendBytesToAll(channel, encodePacket(null, encodeNetworkPayload(data)));
  }

  /** See `NetworkServerContextApi.sendToClient`. */
  public sendToClient(
    clientId: ClientId,
    data: NetworkPayload,
    { channel = DEFAULT_CHANNEL }: ChannelOptions = {},
  ): void {
    this.sendBytesToClient(clientId, channel, encodePacket(null, encodeNetworkPayload(data)));
  }

  /** See `NetworkServerContextApi.getReceivedPackets`. */
  public getReceivedPackets({ channel }: ChannelOptions = {}): Map<ClientId, NetworkData[]> {
    if (channel !== undefined) {
      const clients = this.drain(channel);
      const packets = this._raw.get(channel) ?? new Map<ClientId, NetworkData[]>();
      this._raw.delete(channel);
      for (const clientId of clients) if (!packets.has(clientId)) packets.set(clientId, []);
      return packets;
    }

    const merged = new Map<ClientId, NetworkData[]>();
    for (const c of this.configuredChannels()) {
      this.getReceivedPackets({ channel: c }).forEach((packets, clientId) => {
        merged.set(clientId, [...(merged.get(clientId) ?? []), ...packets]);
      });
    }
    return merged;
  }

  /** See `NetworkServerContextApi.getConnectedClients`. */
  public getConnectedClients({ channel }: ChannelOptions = {}): ClientId[] {
    if (channel !== undefined) return this.require(channel).getConnectedClients(channel);
    return [
      ...new Set(this.configuredChannels().flatMap((c) => this.require(c).getConnectedClients(c))),
    ];
  }

  /** See `NetworkServerContextApi.getClientInfo`. */
  public getClientInfo(clientId: ClientId): ClientInfo | undefined {
    return this._registry.get(clientId);
  }

  /** Calls the listeners of the typed packets received since the last tick. */
  public run(ctx: Context): void {
    this._raw.clear();
    for (const channel of this.configuredChannels()) this.drain(channel);
    const typed = this._typed;
    this._typed = [];
    this._dispatcher.dispatch(typed, ctx);
  }

  public expose(): NetworkServerContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const server = this;
    return {
      sendToAll: (data, options) => server.sendToAll(data, options),
      sendToClient: (clientId, data, options) => server.sendToClient(clientId, data, options),
      getReceivedPackets: (options) => server.getReceivedPackets(options),
      getConnectedClients: (options) => server.getConnectedClients(options),
      getClientInfo: (clientId) => server.getClientInfo(clientId),
      get clients() {
        return server.clients;
      },
      get packets() {
        return server.packets;
      },
    };
  }

  private configuredChannels(): Channel[] {
    return CHANNELS.filter((channel) => this.transports[channel] !== undefined);
  }

  private sendBytesToAll(channel: Channel, bytes: Uint8Array): void {
    this.require(channel).sendToEverybody(channel, bytes);
  }

  private sendBytesToClient(clientId: ClientId, channel: Channel, bytes: Uint8Array): void {
    this.require(channel).sendToClient(channel, clientId, bytes);
  }

  /**
   * Move what each client sent on `channel` to the typed and raw queues.
   *
   * @returns The clients the transport reported, packets or not.
   */
  private drain(channel: Channel): ClientId[] {
    const received = this.require(channel).getReceivedPackets(channel);
    const raw = this._raw.get(channel) ?? new Map<ClientId, NetworkData[]>();
    received.forEach((packets, clientId) => {
      const clientRaw = raw.get(clientId) ?? [];
      sortPackets(packets, { clientId, channel }, clientRaw, this._typed);
      if (clientRaw.length > 0) raw.set(clientId, clientRaw);
    });
    this._raw.set(channel, raw);
    return [...received.keys()];
  }

  private require(channel: Channel): ServerTransport<Channel> {
    const transport = this.transports[channel];
    if (!transport) throw new Error(this._requirement(channel));
    return transport;
  }
}
