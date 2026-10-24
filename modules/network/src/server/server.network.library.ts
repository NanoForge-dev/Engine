import type { Context, InitContext } from "@nanoforge-dev/common";
import type { EditorInitContext } from "@nanoforge-dev/editor-lib";
import { registerEnv } from "@nanoforge-dev/env";

import {
  CHANNELS,
  type Channel,
  RELIABLE_CHANNELS,
  UNRELIABLE_CHANNELS,
  isReliableChannel,
} from "../shared/channels";
import { createTrace, traceServer } from "../shared/trace";
import type { ServerTransport } from "../shared/transport";
import { ServerConfigNetwork } from "./config.server.network";
import { NetworkServerLibraryBase } from "./server.network.base";
import { SignalingServer } from "./signaling.server.network";
import { TCPServer } from "./tcp.server.network";
import { UDPServer } from "./udp.server.network";

const NO_CLIENTS: ServerTransport<Channel> = {
  sendToEverybody: () => {},
  sendToClient: () => {},
  getReceivedPackets: () => new Map(),
  getConnectedClients: () => [],
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
 * - `NETWORK_MODE` — `p2p` (set by `nf` from `network: "p2p"`): the game runs in
 *   the host player's browser, and this server only pairs players, on
 *   `LISTENING_TCP_PORT`: the server app still runs here, with no players.
 *
 * @example
 * ```ts
 * ctx.network.sendToAll({ type: "start" }); // Channel.ReliableOrdered
 * ctx.network.sendToAll({ x: 1, y: 2 }, { channel: Channel.UnreliableUnordered });
 * ctx.network.packets.sendToAll(Move, move); // typed packet, see `definePacket`
 * ctx.network.getReceivedPackets().forEach((packets, clientId) => {
 *   const messages = packets.map((packet) => packet.json()); // every channel
 * });
 * ```
 */
export class NetworkServerLibrary extends NetworkServerLibraryBase {
  private _tcp?: TCPServer;
  private _udp?: UDPServer;
  private _signaling?: SignalingServer;

  constructor() {
    super(
      (channel) =>
        `Channel ${channel} needs ${isReliableChannel(channel) ? "LISTENING_TCP_PORT" : "LISTENING_UDP_PORT"} to be set`,
    );
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

    if (config.NETWORK_MODE === "p2p") {
      if (config.LISTENING_TCP_PORT === undefined) {
        throw new Error("NetworkServerLibrary: p2p needs LISTENING_TCP_PORT for signaling.");
      }
      this._signaling = new SignalingServer(
        +config.LISTENING_TCP_PORT,
        config.LISTENING_INTERFACE,
        config.WSS_CERT,
        config.WSS_KEY,
      );
      this._signaling.listen();
      this._server.transports = Object.fromEntries(CHANNELS.map((c) => [c, NO_CLIENTS]));
      return;
    }

    if (config.LISTENING_TCP_PORT !== undefined) {
      this._tcp = new TCPServer(
        +config.LISTENING_TCP_PORT,
        config.LISTENING_INTERFACE,
        config.WSS_CERT,
        config.WSS_KEY,
        this._registry,
      );
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
      this._udp.listen();
    }

    this.routeChannels();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override async __clear(_ctx: Context): Promise<void> {
    this._tcp?.close();
    this._udp?.close();
    this._signaling?.stop();
    this._registry.clear();
    delete this._tcp;
    delete this._udp;
    delete this._signaling;
    this.routeChannels();
  }

  /**
   * Traces packets for the editor (`network-trace`, `network-stats`) while
   * its `welcome` asks for it.
   */
  public override async __editorInit(ctx: EditorInitContext): Promise<void> {
    const trace = createTrace(ctx.editor);
    if (this._tcp) traceServer(this._tcp, "tcp", trace);
    if (this._udp) traceServer(this._udp, "udp", trace);
    this._trace = trace;
  }

  /** TCP carries the reliable channels, UDP the unreliable ones. */
  private routeChannels(): void {
    this._server.transports = {
      ...(this._tcp && Object.fromEntries(RELIABLE_CHANNELS.map((c) => [c, this._tcp]))),
      ...(this._udp && Object.fromEntries(UNRELIABLE_CHANNELS.map((c) => [c, this._udp]))),
    };
  }
}
