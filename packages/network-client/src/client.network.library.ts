import { BaseNetworkLibrary, type InitContext, NfConfigException } from "@nanoforge-dev/common";

import { ClientConfigNetwork } from "./config.client.network";
import { TCPClient } from "./tcp.client.network";
import { UDPClient } from "./udp.client.network";

/**
 * Built-in network library for client-side applications.
 *
 * @remarks
 * Reads network configuration from the environment via
 * `ClientConfigNetwork` and automatically connects to the server over
 * TCP (WebSocket), UDP (WebRTC data channel), or both.  Register with:
 *
 * ```ts
 * client.useNetwork(new NetworkClientLibrary());
 * ```
 *
 * Configuration (via environment variables):
 * - `SERVER_ADDRESS` — hostname or IP of the server (required).
 * - `SERVER_TCP_PORT` — WebSocket port for TCP (optional).
 * - `SERVER_UDP_PORT` — signaling port for UDP/WebRTC (optional).
 * - `MAGIC_VALUE` — packet framing delimiter (default: `"PACKET_END"`).
 * - `WSS` — set to `"true"` to use `wss://` / `https://` (default: `false`).
 *
 * After `init`, access the connections via `tcp` and `udp`.
 */
export class NetworkClientLibrary extends BaseNetworkLibrary {
  /**
   * Reliable, ordered WebSocket-based connection to the server.
   *
   * @remarks
   * Only available when `SERVER_TCP_PORT` was specified in the environment.
   */
  public tcp!: TCPClient;

  /**
   * Unreliable, unordered WebRTC data-channel connection to the server.
   *
   * @remarks
   * Only available when `SERVER_UDP_PORT` was specified in the environment.
   */
  public udp!: UDPClient;

  /** @internal */
  get __name(): string {
    return "NetworkClientLibrary";
  }

  /** @internal */
  public override async __init(context: InitContext): Promise<void> {
    const config: ClientConfigNetwork = await context.config.registerConfig(ClientConfigNetwork);

    if (config.SERVER_TCP_PORT === undefined && config.SERVER_UDP_PORT === undefined) {
      throw new NfConfigException("No server port specified to connect", this.__name);
    }

    if (config.SERVER_TCP_PORT !== undefined) {
      this.tcp = new TCPClient(
        +config.SERVER_TCP_PORT,
        config.SERVER_ADDRESS,
        config.MAGIC_VALUE,
        config.WSS,
      );
      await this.tcp.connect();
    }

    if (config.SERVER_UDP_PORT !== undefined) {
      this.udp = new UDPClient(
        +config.SERVER_UDP_PORT,
        config.SERVER_ADDRESS,
        config.MAGIC_VALUE,
        config.WSS,
      );
      await this.udp.connect();
    }
  }
}
