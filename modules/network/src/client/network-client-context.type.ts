import type { ChannelOptions, ConnectOptions } from "../shared/channels";
import type { NetworkData, NetworkPayload } from "../shared/network-data";

/**
 * Public surface of `NetworkClientLibrary`, exposed on `Context.network`.
 *
 * @remarks
 * Every method takes an optional `{ channel }`.  Reliable channels need
 * `SERVER_TCP_PORT`, unreliable ones `SERVER_UDP_PORT`; using a channel whose
 * port is not configured throws.
 */
export interface NetworkClientContextApi {
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
   * every configured channel.  Call it once per frame.
   */
  getReceivedPackets(options?: ChannelOptions): NetworkData[];
  /** Return `true` when `channel`, or every configured channel, is connected. */
  isConnected(options?: ChannelOptions): boolean;
}
