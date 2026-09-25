import type {
  ReliableOrderedServer,
  ReliableUnorderedServer,
  UnreliableOrderedServer,
  UnreliableUnorderedServer,
} from "./channels.server.network";
import type { ClientsApi } from "./client-registry";

/** Public surface of `NetworkServerLibrary`, exposed on `Context.network`. */
export interface NetworkServerContextApi {
  /** Never lost, delivered in send order. Only set when `LISTENING_TCP_PORT` was configured. */
  readonly reliableOrdered: ReliableOrderedServer;
  /** Never lost, no ordering promise. Only set when `LISTENING_TCP_PORT` was configured. */
  readonly reliableUnordered: ReliableUnorderedServer;
  /**
   * May be lost; late packets are dropped. Only set when `LISTENING_UDP_PORT` was configured.
   */
  readonly unreliableOrdered: UnreliableOrderedServer;
  /** May be lost or arrive in any order. Only set when `LISTENING_UDP_PORT` was configured. */
  readonly unreliableUnordered: UnreliableUnorderedServer;
  /** Client sessions, shared by TCP and UDP: lookup and connect/disconnect callbacks. */
  readonly clients: ClientsApi;
}
