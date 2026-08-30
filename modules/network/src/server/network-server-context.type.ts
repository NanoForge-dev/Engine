import type { TCPServer } from "./tcp.server.network";
import type { UDPServer } from "./udp.server.network";

/** Public surface of `NetworkServerLibrary`, exposed on `Context.network`. */
export interface NetworkServerContextApi {
  /** Reliable, ordered WebSocket server. Only set when `LISTENING_TCP_PORT` was configured. */
  readonly tcp: TCPServer;
  /** Unreliable, unordered WebRTC data-channel server. Only set when `LISTENING_UDP_PORT` was configured. */
  readonly udp: UDPServer;
}
