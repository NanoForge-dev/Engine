import type { Channel, ChannelOptions } from "../shared/channels";
import type { NetworkData, NetworkPayload } from "../shared/network-data";
import type { PacketDefinition, PacketListener } from "../shared/packet";
import type { ClientId, ClientInfo, ClientsApi } from "./client-registry";

/** Where a packet received by the server comes from. */
export type ServerPacketInfo = { clientId: ClientId; channel: Channel };

/**
 * Typed packets of the server, exposed as `ctx.network.packets`.
 *
 * @example
 * ```ts
 * network.packets.on(Input, ({ key }, { clientId, ctx }) => handleInput(clientId, key, ctx));
 * for (const { data, clientId } of ctx.network.packets.read(Input)) handleInput(clientId, data.key);
 * ctx.network.packets.sendToAll(Move, move);
 * ```
 */
export interface ServerPacketsApi {
  /**
   * Be notified of every packet of a type, each tick before the ECS systems
   * (not while paused).
   *
   * @returns A function that removes the listener.
   * @throws When another definition with the same name has another channel or
   * `validate`.
   */
  on<T>(
    packet: PacketDefinition<T>,
    listener: PacketListener<NoInfer<T>, ServerPacketInfo>,
  ): () => void;
  /**
   * Return the packets of a type received this tick, for an ECS system.
   *
   * @throws When another definition with the same name has another channel or
   * `validate`.
   */
  read<T>(packet: PacketDefinition<T>): (ServerPacketInfo & { data: T })[];
  /**
   * Send a packet to every client reachable on the definition's channel,
   * unless another `channel` is given.
   *
   * @throws When the channel's port was not configured, or `data` cannot be
   * encoded as JSON.
   */
  sendToAll<T>(packet: PacketDefinition<T>, data: NoInfer<T>, options?: ChannelOptions): void;
  /**
   * Send a packet to one client, on the definition's channel unless another
   * `channel` is given.
   *
   * @throws When the channel's port was not configured, or `data` cannot be
   * encoded as JSON.
   */
  sendToClient<T>(
    clientId: ClientId,
    packet: PacketDefinition<T>,
    data: NoInfer<T>,
    options?: ChannelOptions,
  ): void;
}

/**
 * Public surface of `NetworkServerLibrary`, exposed on `Context.network`.
 *
 * @remarks
 * Every method takes an optional `{ channel }`.  Reliable channels need
 * `LISTENING_TCP_PORT`, unreliable ones `LISTENING_UDP_PORT`; using a channel
 * whose port is not configured throws.
 */
export interface NetworkServerContextApi {
  /** Typed packets: per-type listeners, `read` and sending. */
  readonly packets: ServerPacketsApi;
  /** Client sessions, shared by TCP and UDP: lookup and connect/disconnect callbacks. */
  readonly clients: ClientsApi;
  /**
   * Send bytes, a string or a JSON value to every client, on
   * `Channel.ReliableOrdered` unless another `channel` is given.
   */
  sendToAll(data: NetworkPayload, options?: ChannelOptions): void;
  /**
   * Send bytes, a string or a JSON value to one client, on
   * `Channel.ReliableOrdered` unless another `channel` is given.
   */
  sendToClient(clientId: ClientId, data: NetworkPayload, options?: ChannelOptions): void;
  /**
   * Return the packets each client sent since the last call, from `channel` or
   * from every configured channel.  Call it once per frame:
   * packets left unread for a whole tick are dropped.
   */
  getReceivedPackets(options?: ChannelOptions): Map<ClientId, NetworkData[]>;
  /** Return the clients reachable on `channel`, or on any configured channel. */
  getConnectedClients(options?: ChannelOptions): ClientId[];
  /** Return what is known about a client session, `undefined` once it is gone. */
  getClientInfo(clientId: ClientId): ClientInfo | undefined;
}
