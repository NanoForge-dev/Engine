import { type Context, type InitContext, Library, defineLibraryKey } from "@nanoforge-dev/common";
import { registerEnv } from "@nanoforge-dev/env";

import {
  ReliableOrderedServer,
  ReliableUnorderedServer,
  UnreliableOrderedServer,
  UnreliableUnorderedServer,
} from "./channels.server.network";
import { ClientRegistry, type ClientsApi } from "./client-registry";
import { ServerConfigNetwork } from "./config.server.network";
import type { NetworkServerContextApi } from "./network-server-context.type";
import { TCPServer } from "./tcp.server.network";
import { UDPServer } from "./udp.server.network";

const required = <T>(channel: T | undefined, name: string, port: string): T => {
  if (!channel) throw new Error(`The ${name} channel isn't defined: set ${port}`);
  return channel;
};

/**
 * Built-in network library for server-side applications.
 *
 * @remarks
 * Reads network configuration from the environment via `ServerConfigNetwork`
 * and starts TCP (WebSocket) and/or UDP (WebRTC) servers.  TCP carries the
 * reliable channels and UDP the unreliable ones.
 *
 * Configuration (via environment variables):
 * - `LISTENING_INTERFACE` — bind address (default: `"0.0.0.0"`).
 * - `LISTENING_TCP_PORT` — WebSocket listen port for TCP (optional).
 * - `LISTENING_UDP_PORT` — signaling listen port for UDP (optional).
 * - `WSS_CERT` / `WSS_KEY` — paths to TLS certificate and key files for WSS (optional).
 * - `ICE_SERVERS` — STUN/TURN servers for the UDP transport, comma-separated or a JSON array (default: `[]`).
 * - `ICE_PORT` — fixed, multiplexed UDP port for the UDP transport (optional).
 * - `ADVERTISE_IP` — public address written into host ICE candidates (optional).
 */
export class NetworkServerLibrary extends Library {
  readonly key = defineLibraryKey("network");

  /** Only set when `LISTENING_TCP_PORT` was configured. */
  public reliableOrdered?: ReliableOrderedServer;
  /** Only set when `LISTENING_TCP_PORT` was configured. */
  public reliableUnordered?: ReliableUnorderedServer;
  /** Only set when `LISTENING_UDP_PORT` was configured. */
  public unreliableOrdered?: UnreliableOrderedServer;
  /** Only set when `LISTENING_UDP_PORT` was configured. */
  public unreliableUnordered?: UnreliableUnorderedServer;

  private _tcp?: TCPServer;
  private _udp?: UDPServer;

  private readonly _registry = new ClientRegistry();

  /** Client sessions shared by the TCP and UDP servers. */
  public get clients(): ClientsApi {
    return this._registry;
  }

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
      this._tcp = new TCPServer(
        +config.LISTENING_TCP_PORT,
        config.LISTENING_INTERFACE,
        config.WSS_CERT,
        config.WSS_KEY,
        this._registry,
      );
      this.reliableOrdered = new ReliableOrderedServer(this._tcp);
      this.reliableUnordered = new ReliableUnorderedServer(this._tcp);
      this._tcp.listen();
    }

    if (config.LISTENING_UDP_PORT !== undefined) {
      this._udp = new UDPServer(
        +config.LISTENING_UDP_PORT,
        config.LISTENING_INTERFACE,
        config.WSS_CERT,
        config.WSS_KEY,
        {
          iceServers: config.ICE_SERVERS,
          ...(config.ICE_PORT !== undefined ? { port: +config.ICE_PORT } : {}),
          ...(config.ADVERTISE_IP !== undefined ? { advertiseIp: config.ADVERTISE_IP } : {}),
        },
        this._registry,
      );
      this.unreliableOrdered = new UnreliableOrderedServer(this._udp);
      this.unreliableUnordered = new UnreliableUnorderedServer(this._udp);
      this._udp.listen();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override async __clear(_ctx: Context): Promise<void> {
    this._tcp?.close();
    this._udp?.close();
    this._registry.clear();
    delete this._tcp;
    delete this._udp;
    delete this.reliableOrdered;
    delete this.reliableUnordered;
    delete this.unreliableOrdered;
    delete this.unreliableUnordered;
  }

  public override expose(): NetworkServerContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      get reliableOrdered() {
        return required(library.reliableOrdered, "reliableOrdered", "LISTENING_TCP_PORT");
      },
      get reliableUnordered() {
        return required(library.reliableUnordered, "reliableUnordered", "LISTENING_TCP_PORT");
      },
      get unreliableOrdered() {
        return required(library.unreliableOrdered, "unreliableOrdered", "LISTENING_UDP_PORT");
      },
      get unreliableUnordered() {
        return required(library.unreliableUnordered, "unreliableUnordered", "LISTENING_UDP_PORT");
      },
      get clients() {
        return library.clients;
      },
    };
  }
}
