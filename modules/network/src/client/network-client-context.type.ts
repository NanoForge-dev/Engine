import type {
  ReliableOrderedClient,
  ReliableUnorderedClient,
  UnreliableOrderedClient,
  UnreliableUnorderedClient,
} from "./channels.client.network";

/** Public surface of `NetworkClientLibrary`, exposed on `Context.network`. */
export interface NetworkClientContextApi {
  /** Never lost, delivered in send order. Only set when `SERVER_TCP_PORT` was configured. */
  readonly reliableOrdered: ReliableOrderedClient;
  /** Never lost, no ordering promise. Only set when `SERVER_TCP_PORT` was configured. */
  readonly reliableUnordered: ReliableUnorderedClient;
  /**
   * May be lost; late packets are dropped. Only set when `SERVER_UDP_PORT` was configured.
   */
  readonly unreliableOrdered: UnreliableOrderedClient;
  /** May be lost or arrive in any order. Only set when `SERVER_UDP_PORT` was configured. */
  readonly unreliableUnordered: UnreliableUnorderedClient;
  /** Client id assigned by the server, shared by TCP and UDP. `undefined` until welcomed. */
  readonly clientId: string | undefined;
}
