import type { Channel, ChannelOptions, ConnectOptions } from "../shared/channels";
import type { NetworkData, NetworkPayload } from "../shared/network-data";
import type { PacketArgs, PacketDefinition, PacketListener } from "../shared/packet";

/** Where a packet received by the client comes from. */
export type ClientPacketInfo = { channel: Channel };

/**
 * Typed packets of the client, exposed as `ctx.network.packets`.
 *
 * @example
 * ```ts
 * network.packets.on(Move, (move, { ctx }) => applyMove(ctx.ecs.registry, move));
 * for (const { data } of ctx.network.packets.read(Move)) applyMove(registry, data);
 * ctx.network.packets.send(Input, { key: "up" });
 * ```
 */
export interface ClientPacketsApi {
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
    listener: PacketListener<NoInfer<T>, ClientPacketInfo>,
  ): () => void;
  /**
   * Return the packets of a type received this tick, for an ECS system.
   *
   * @throws When another definition with the same name has another channel or
   * `validate`.
   */
  read<T>(packet: PacketDefinition<T>): (ClientPacketInfo & { data: T })[];
  /**
   * Send a packet to the server, on the definition's channel unless another
   * `channel` is given.  `data` is left out for a packet without payload:
   * `send(Play)`.
   *
   * @throws When the channel's port was not configured, or `data` cannot be
   * encoded as JSON.
   */
  send<T>(packet: PacketDefinition<T>, ...args: PacketArgs<NoInfer<T>>): void;
}

/**
 * Public surface of `NetworkClientLibrary`, exposed on `Context.network`.
 *
 * @remarks
 * Every method takes an optional `{ channel }`.  Reliable channels need
 * `SERVER_TCP_PORT`, unreliable ones `SERVER_UDP_PORT`; using a channel whose
 * port is not configured throws.
 */
export interface NetworkClientContextApi {
  /** Typed packets: per-type listeners, `read` and `send`. */
  readonly packets: ClientPacketsApi;
  /** Client id assigned by the server, shared by TCP and UDP. `undefined` until welcomed. */
  readonly clientId: string | undefined;
  /**
   * Connect to the server and resolve once `channels` (every configured
   * channel by default) are open.  Rejects on failure or after `timeout` ms.
   */
  connect(options?: ConnectOptions): Promise<void>;
  /**
   * Send bytes, a string or a JSON value to the server, on
   * `Channel.ReliableOrdered` unless another `channel` is given.
   */
  sendData(data: NetworkPayload, options?: ChannelOptions): void;
  /**
   * Return the packets received since the last call, from `channel` or from
   * every configured channel.  Call it once per frame:
   * packets left unread for a whole tick are dropped.
   */
  getReceivedPackets(options?: ChannelOptions): NetworkData[];
  /** Return `true` when `channel`, or every configured channel, is connected. */
  isConnected(options?: ChannelOptions): boolean;
}
