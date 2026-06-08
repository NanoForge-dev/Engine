import { BaseNetworkLibrary, type InitContext, NfConfigException } from "@nanoforge-dev/common";

import { ServerConfigNetwork } from "./config.server.network";
import { TCPServer } from "./tcp.server.network";
import { UDPServer } from "./udp.server.network";

/**
 * Built-in network library for server-side applications.
 *
 * @remarks
 * Reads network configuration from the environment via
 * `ServerConfigNetwork` and starts TCP (WebSocket) and/or UDP (WebRTC)
 * servers.  Register with:
 *
 * ```ts
 * server.useNetwork(new NetworkServerLibrary());
 * ```
 *
 * Configuration (via environment variables):
 * - `LISTENING_INTERFACE` — bind address (default: `"0.0.0.0"`).
 * - `LISTENING_TCP_PORT` — WebSocket listen port for TCP (optional).
 * - `LISTENING_UDP_PORT` — signaling listen port for UDP (optional).
 * - `MAGIC_VALUE` — packet framing delimiter (default: `"PACKET_END"`).
 * - `WSS_CERT` / `WSS_KEY` — paths to TLS certificate and key files for WSS (optional).
 *
 * After `init`, access the servers via `tcp` and `udp`.
 */
export class NetworkServerLibrary extends BaseNetworkLibrary {
  /**
   * Unreliable, unordered WebRTC data-channel server for connected clients.
   *
   * @remarks
   * Only available when `LISTENING_UDP_PORT` was specified in the environment.
   */
  public udp!: UDPServer;

  /**
   * Reliable, ordered WebSocket-based server for connected clients.
   *
   * @remarks
   * Only available when `LISTENING_TCP_PORT` was specified in the environment.
   */
  public tcp!: TCPServer;

  /** @internal */
  get __name(): string {
    return "NetworkServerLibrary";
  }

  /** @internal */
  public override async __init(context: InitContext): Promise<void> {
    const config: ServerConfigNetwork = await context.config.registerConfig(ServerConfigNetwork);

    if (config.LISTENING_INTERFACE === undefined) {
      throw new NfConfigException("No listenning address provided", this.__name);
    }
    if (config.LISTENING_TCP_PORT === undefined && config.LISTENING_UDP_PORT === undefined) {
      throw new NfConfigException("No listenning port specified", this.__name);
    }

    if (
      (config.WSS_CERT !== undefined && config.WSS_KEY === undefined) ||
      (config.WSS_CERT === undefined && config.WSS_KEY !== undefined)
    ) {
      throw new NfConfigException("Both cert and key must be provided together", this.__name);
    }

    if (config.LISTENING_TCP_PORT !== undefined) {
      this.tcp = new TCPServer(
        +config.LISTENING_TCP_PORT,
        config.LISTENING_INTERFACE,
        config.MAGIC_VALUE,
        config.WSS_CERT,
        config.WSS_KEY,
      );
      this.tcp.listen();
    }

    if (config.LISTENING_UDP_PORT !== undefined) {
      this.udp = new UDPServer(
        +config.LISTENING_UDP_PORT,
        config.LISTENING_INTERFACE,
        config.MAGIC_VALUE,
        config.WSS_CERT,
        config.WSS_KEY,
      );
      this.udp.listen();
    }
  }
}
