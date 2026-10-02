import type { ChannelOptions } from "../shared/channels";
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
   * Send a payload to every client, on `Channel.ReliableOrdered` unless
   * another `channel` is given.
   */
  sendToAll(data: Uint8Array, options?: ChannelOptions): void;
  /**
   * Send a payload to one client, on `Channel.ReliableOrdered` unless another
   * `channel` is given.
   */
  sendToClient(clientId: ClientId, data: Uint8Array, options?: ChannelOptions): void;
  /**
   * Return the packets each client sent since the last call, from `channel` or
   * from every configured channel.  Call it once per frame.
   */
  getReceivedPackets(options?: ChannelOptions): Map<ClientId, Uint8Array[]>;
  /** Return the clients reachable on `channel`, or on any configured channel. */
  getConnectedClients(options?: ChannelOptions): ClientId[];
  /** Return what is known about a client session, `undefined` once it is gone. */
  getClientInfo(clientId: ClientId): ClientInfo | undefined;
}
