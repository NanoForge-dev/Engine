import { type Context, type InitContext, Library, defineLibraryKey } from "@nanoforge-dev/common";
import { registerEnv } from "@nanoforge-dev/env";

import { ServerConfigNetwork } from "./config.server.network";
import type { NetworkServerContextApi } from "./network-server-context.type";
import { TCPServer } from "./tcp.server.network";
import { UDPServer } from "./udp.server.network";

/**
 * Built-in network library for server-side applications.
 *
 * @remarks
 * Reads network configuration from the environment via `ServerConfigNetwork`
 * and starts TCP (WebSocket) and/or UDP (WebRTC) servers.
 *
 * Configuration (via environment variables):
 * - `LISTENING_INTERFACE` — bind address (default: `"0.0.0.0"`).
 * - `LISTENING_TCP_PORT` — WebSocket listen port for TCP (optional).
 * - `LISTENING_UDP_PORT` — signaling listen port for UDP (optional).
 * - `MAGIC_VALUE` — packet framing delimiter (default: `"PACKET_END"`).
 * - `WSS_CERT` / `WSS_KEY` — paths to TLS certificate and key files for WSS (optional).
 * - `ICE_SERVERS` — STUN/TURN servers for the UDP transport, comma-separated or a JSON array (default: `[]`).
 * - `ICE_PORT` — fixed, multiplexed UDP port for the UDP transport (optional).
 * - `ADVERTISE_IP` — public address written into host ICE candidates (optional).
 */
export class NetworkServerLibrary extends Library {
  readonly key = defineLibraryKey("network");

  /** Only set when `LISTENING_TCP_PORT` was configured. */
  public tcp?: TCPServer;
  /** Only set when `LISTENING_UDP_PORT` was configured. */
  public udp?: UDPServer;

  public override async __init(ctx: InitContext): Promise<void> {
    if (typeof Bun === "undefined") {
      throw new Error(
        "NetworkServerLibrary: the Bun runtime is required. The server is built on " +
          "Bun.serve and cannot run on Node.js — start the server process with Bun.",
      );
    }

    const config = await registerEnv(ServerConfigNetwork, ctx.env);

    if (config.LISTENING_TCP_PORT === undefined && config.LISTENING_UDP_PORT === undefined) {
      throw new Error("NetworkServerLibrary: no listening port specified.");
    }

    if (
      (config.WSS_CERT !== undefined && config.WSS_KEY === undefined) ||
      (config.WSS_CERT === undefined && config.WSS_KEY !== undefined)
    ) {
      throw new Error("NetworkServerLibrary: both WSS_CERT and WSS_KEY must be provided together.");
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
        {
          iceServers: config.ICE_SERVERS,
          ...(config.ICE_PORT !== undefined ? { port: +config.ICE_PORT } : {}),
          ...(config.ADVERTISE_IP !== undefined ? { advertiseIp: config.ADVERTISE_IP } : {}),
        },
      );
      this.udp.listen();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override async __clear(_ctx: Context): Promise<void> {
    this.tcp?.close();
    this.udp?.close();
    delete this.tcp;
    delete this.udp;
  }

  public override expose(): NetworkServerContextApi {
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
