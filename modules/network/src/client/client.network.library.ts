import { type InitContext, Library, defineLibraryKey } from "@nanoforge-dev/common";
import { registerEnv } from "@nanoforge-dev/env";

import {
  ReliableOrderedClient,
  ReliableUnorderedClient,
  UnreliableOrderedClient,
  UnreliableUnorderedClient,
} from "./channels.client.network";
import type { ClientSession } from "./client-session";
import { ClientConfigNetwork } from "./config.client.network";
import type { NetworkClientContextApi } from "./network-client-context.type";
import { TCPClient } from "./tcp.client.network";
import { UDPClient } from "./udp.client.network";

const required = <T>(channel: T | undefined, name: string, port: string): T => {
  if (!channel) throw new Error(`The ${name} channel isn't defined: set ${port}`);
  return channel;
};

/**
 * Built-in network library for client-side applications.
 *
 * @remarks
 * Reads network configuration from the environment via `ClientConfigNetwork`
 * and automatically connects to the server over TCP (WebSocket), UDP
 * (WebRTC data channels), or both.  TCP carries the reliable channels and UDP
 * the unreliable ones.  TCP connects first; once welcomed, UDP presents the
 * session token so both transports share one client id.  A transport that
 * fails to connect is logged and does not fail initialization.
 *
 * Configuration (via environment variables):
 * - `SERVER_ADDRESS` — hostname or IP of the server (required).
 * - `SERVER_TCP_PORT` — WebSocket port for TCP (optional).
 * - `SERVER_UDP_PORT` — signaling port for UDP/WebRTC (optional).
 * - `WSS` — set to `"true"` to use `wss://` / `https://` (default: `false`).
 * - `ICE_SERVERS` — STUN/TURN servers for the UDP transport, comma-separated or a JSON array (default: `[]`).
 */
export class NetworkClientLibrary extends Library {
  readonly key = defineLibraryKey("network");

  /** Only set when `SERVER_TCP_PORT` was configured. */
  public reliableOrdered?: ReliableOrderedClient;
  /** Only set when `SERVER_TCP_PORT` was configured. */
  public reliableUnordered?: ReliableUnorderedClient;
  /** Only set when `SERVER_UDP_PORT` was configured. */
  public unreliableOrdered?: UnreliableOrderedClient;
  /** Only set when `SERVER_UDP_PORT` was configured. */
  public unreliableUnordered?: UnreliableUnorderedClient;

  private readonly _session: ClientSession = {};

  /** Client id assigned by the server, `undefined` until a transport is welcomed. */
  public get clientId(): string | undefined {
    return this._session.id;
  }

  public override async __init(ctx: InitContext): Promise<void> {
    const config = await registerEnv(ClientConfigNetwork, ctx.env);

    if (config.SERVER_TCP_PORT === undefined && config.SERVER_UDP_PORT === undefined) {
      throw new Error("NetworkClientLibrary: no server port specified to connect to.");
    }

    if (config.SERVER_TCP_PORT !== undefined) {
      const tcp = new TCPClient(
        +config.SERVER_TCP_PORT,
        config.SERVER_ADDRESS,
        config.WSS,
        this._session,
      );
      this.reliableOrdered = new ReliableOrderedClient(tcp);
      this.reliableUnordered = new ReliableUnorderedClient(tcp);
      await this.connectTransport("TCP", tcp);
    }

    if (config.SERVER_UDP_PORT !== undefined) {
      const udp = new UDPClient(
        +config.SERVER_UDP_PORT,
        config.SERVER_ADDRESS,
        config.WSS,
        config.ICE_SERVERS,
        this._session,
      );
      this.unreliableOrdered = new UnreliableOrderedClient(udp);
      this.unreliableUnordered = new UnreliableUnorderedClient(udp);
      await this.connectTransport("UDP", udp);
    }
  }

  public override expose(): NetworkClientContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      get reliableOrdered() {
        return required(library.reliableOrdered, "reliableOrdered", "SERVER_TCP_PORT");
      },
      get reliableUnordered() {
        return required(library.reliableUnordered, "reliableUnordered", "SERVER_TCP_PORT");
      },
      get unreliableOrdered() {
        return required(library.unreliableOrdered, "unreliableOrdered", "SERVER_UDP_PORT");
      },
      get unreliableUnordered() {
        return required(library.unreliableUnordered, "unreliableUnordered", "SERVER_UDP_PORT");
      },
      get clientId() {
        return library.clientId;
      },
    };
  }

  private async connectTransport(name: string, client: TCPClient | UDPClient): Promise<void> {
    try {
      await client.connect();
    } catch (error) {
      console.error(`${name} connection failed`, { cause: error });
    }
  }
}
