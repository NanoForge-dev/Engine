import type { ChannelOptions } from "../shared/channels";
import type { NetworkData, NetworkPayload } from "../shared/network-data";
import type { ClientId, ClientInfo, ClientsApi } from "./client-registry";

/**
 * Public surface of `NetworkServerLibrary`, exposed on `Context.network`.
 *
 * @remarks
 * Every method takes an optional `{ channel }`.  Reliable channels need
 * `LISTENING_TCP_PORT`, unreliable ones `LISTENING_UDP_PORT`; using a channel
 * whose port is not configured throws.
 */
export interface NetworkServerContextApi {
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
   * from every configured channel.  Call it once per frame.
   */
  getReceivedPackets(options?: ChannelOptions): Map<ClientId, NetworkData[]>;
  /** Return the clients reachable on `channel`, or on any configured channel. */
  getConnectedClients(options?: ChannelOptions): ClientId[];
  /** Return what is known about a client session, `undefined` once it is gone. */
  getClientInfo(clientId: ClientId): ClientInfo | undefined;
}
