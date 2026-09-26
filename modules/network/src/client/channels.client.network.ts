import { Channel } from "../shared/channels";

/** Transport connection a client channel sends and receives through. */
export interface ClientChannelConnection<C extends Channel> {
  getClientId(): string | undefined;
  isConnected(channel: C): boolean;
  sendData(channel: C, data: Uint8Array): void;
  getReceivedPackets(channel: C): Uint8Array[];
}

/**
 * Client end of one {@link Channel}.
 *
 * @remarks
 * A thin view over the transport connection carrying the channel: the TCP
 * WebSocket for reliable channels, the WebRTC peer connection for unreliable
 * ones.  Packets received on other channels are never returned here.
 */
export abstract class ChannelClient<C extends Channel> {
  /** Channel this client sends and receives on. */
  public abstract readonly channel: C;

  constructor(private readonly _connection: ClientChannelConnection<C>) {}

  /**
   * Return the client id assigned by the server, once welcomed.
   */
  public getClientId(): string | undefined {
    return this._connection.getClientId();
  }

  /**
   * Return `true` when packets can be sent and received on this channel.
   */
  public isConnected(): boolean {
    return this._connection.isConnected(this.channel);
  }

  /**
   * Send a payload to the server on this channel.
   *
   * @param data - Raw payload bytes.
   */
  public sendData(data: Uint8Array): void {
    this._connection.sendData(this.channel, data);
  }

  /**
   * Return the packets received on this channel since the last call.
   *
   * @remarks
   * Call this method once per frame.
   *
   * @returns Array of packet buffers.
   */
  public getReceivedPackets(): Uint8Array[] {
    return this._connection.getReceivedPackets(this.channel);
  }
}

/** Never lost, delivered in send order. Carried by TCP. */
export class ReliableOrderedClient extends ChannelClient<Channel.ReliableOrdered> {
  public readonly channel = Channel.ReliableOrdered;
}

/** Never lost, no ordering promise. Carried by TCP. */
export class ReliableUnorderedClient extends ChannelClient<Channel.ReliableUnordered> {
  public readonly channel = Channel.ReliableUnordered;
}

/**
 * May be lost; a packet older than the last one delivered is dropped.
 * Carried by WebRTC.
 */
export class UnreliableOrderedClient extends ChannelClient<Channel.UnreliableOrdered> {
  public readonly channel = Channel.UnreliableOrdered;
}

/** May be lost or arrive in any order. Carried by WebRTC. */
export class UnreliableUnorderedClient extends ChannelClient<Channel.UnreliableUnordered> {
  public readonly channel = Channel.UnreliableUnordered;
}
