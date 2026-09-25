import type { TCPClient } from "./tcp.client.network";
import type { UDPClient } from "./udp.client.network";

/** Public surface of `NetworkClientLibrary`, exposed on `Context.network`. */
export interface NetworkClientContextApi {
  /** Reliable, ordered WebSocket connection. Only set when `SERVER_TCP_PORT` was configured. */
  readonly tcp: TCPClient;
  /** Unreliable, unordered WebRTC data-channel connection. Only set when `SERVER_UDP_PORT` was configured. */
  readonly udp: UDPClient;
  /** Client id assigned by the server, shared by TCP and UDP. `undefined` until welcomed. */
  readonly clientId: string | undefined;
}
