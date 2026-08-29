import { type InitContext, Library, defineLibraryKey } from "@nanoforge-dev/common";
import { registerEnv } from "@nanoforge-dev/env";

import { ClientConfigNetwork } from "./config.client.network";
import type { NetworkClientContextApi } from "./network-client-context.type";
import { TCPClient } from "./tcp.client.network";
import { UDPClient } from "./udp.client.network";

/**
 * Built-in network library for client-side applications.
 *
 * @remarks
 * Reads network configuration from the environment via `ClientConfigNetwork`
 * and automatically connects to the server over TCP (WebSocket), UDP
 * (WebRTC data channel), or both.
 *
 * Configuration (via environment variables):
 * - `SERVER_ADDRESS` — hostname or IP of the server (required).
 * - `SERVER_TCP_PORT` — WebSocket port for TCP (optional).
 * - `SERVER_UDP_PORT` — signaling port for UDP/WebRTC (optional).
 * - `MAGIC_VALUE` — packet framing delimiter (default: `"PACKET_END"`).
 * - `WSS` — set to `"true"` to use `wss://` / `https://` (default: `false`).
 */
export class NetworkClientLibrary extends Library {
  readonly key = defineLibraryKey("network");

  /** Only set when `SERVER_TCP_PORT` was configured. */
  public tcp?: TCPClient;
  /** Only set when `SERVER_UDP_PORT` was configured. */
  public udp?: UDPClient;

  public override async __init(ctx: InitContext): Promise<void> {
    const config = await registerEnv(ClientConfigNetwork, ctx.env);

    if (config.SERVER_TCP_PORT === undefined && config.SERVER_UDP_PORT === undefined) {
      throw new Error("NetworkClientLibrary: no server port specified to connect to.");
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

  public override expose(): NetworkClientContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      get tcp() {
        if (!library.tcp) throw new Error("TCP isn't defined");
        return library.tcp;
      },
      get udp() {
        if (!library.udp) throw new Error("UDP isn't defined");
        return library.udp;
      },
    };
  }
}
