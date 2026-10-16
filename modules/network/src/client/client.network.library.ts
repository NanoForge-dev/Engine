import { type Context, type InitContext, Library, defineLibraryKey } from "@nanoforge-dev/common";
import type { EditorAwareLibrary, EditorInitContext } from "@nanoforge-dev/editor-lib";
import { registerEnv } from "@nanoforge-dev/env";

import {
  type ChannelOptions,
  RELIABLE_CHANNELS,
  UNRELIABLE_CHANNELS,
  isReliableChannel,
} from "../shared/channels";
import type { NetworkData, NetworkPayload } from "../shared/network-data";
import { type Trace, createTrace, traceClient } from "../shared/trace";
import { ClientConfigNetwork } from "./config.client.network";
import { NetworkClient } from "./network-client";
import type { ClientPacketsApi, NetworkClientContextApi } from "./network-client-context.type";
import { TCPClient } from "./tcp.client.network";
import { UDPClient } from "./udp.client.network";

/**
 * Built-in network library for client-side applications.
 *
 * @remarks
 * Reads network configuration from the environment via `ClientConfigNetwork`
 * and opens the connections during `__init`, so the channels are open before
 * the game runs: TCP (WebSocket) carries the reliable channels and UDP (WebRTC
 * data channels) the unreliable ones.  TCP connects first; once welcomed, UDP
 * presents the session token so both transports share one client id.
 *
 * Configuration (via environment variables):
 * - `SERVER_ADDRESS` — hostname or IP of the server (required).
 * - `SERVER_TCP_PORT` — WebSocket port for TCP (optional).
 * - `SERVER_UDP_PORT` — signaling port for UDP/WebRTC (optional).
 * - `WSS` — set to `"true"` to use `wss://` / `https://` (default: `false`).
 * - `ICE_SERVERS` — STUN/TURN servers for the UDP transport, comma-separated or a JSON array (default: `[]`).
 *
 * @example
 * ```ts
 * ctx.network.sendData({ type: "join" }); // Channel.ReliableOrdered
 * ctx.network.sendData({ x: 1, y: 2 }, { channel: Channel.UnreliableOrdered });
 * const messages = ctx.network.getReceivedPackets().map((packet) => packet.json()); // every channel
 * ctx.network.packets.send(Input, { key: "up" }); // typed packet, see `definePacket`
 * ```
 */
export class NetworkClientLibrary extends Library implements EditorAwareLibrary {
  readonly key = defineLibraryKey("network");

  private _tcp?: TCPClient;
  private _udp?: UDPClient;
  private readonly _client = new NetworkClient(
    "NetworkClientLibrary",
    (channel) =>
      `Channel ${channel} needs ${isReliableChannel(channel) ? "SERVER_TCP_PORT" : "SERVER_UDP_PORT"} to be set`,
  );

  /** Client id assigned by the server, `undefined` until transport is welcomed. */
  public get clientId(): string | undefined {
    return this._client.clientId;
  }

  private _trace: Trace | undefined;

  constructor() {
    // `runAfter` keys run after this library: packets are dispatched before the ECS systems.
    super({ runAfter: ["ecs"] });
  }

  /** Typed packets: per-type listeners, `read` and `send`. */
  public get packets(): ClientPacketsApi {
    return this._client.packets;
  }

  public override async __init(ctx: InitContext): Promise<void> {
    const config = await registerEnv(ClientConfigNetwork, ctx.env);

    if (config.SERVER_TCP_PORT === undefined && config.SERVER_UDP_PORT === undefined) {
      throw new Error("NetworkClientLibrary: no server port specified to connect to.");
    }

    if (config.SERVER_TCP_PORT !== undefined) {
      this._tcp = new TCPClient(
        +config.SERVER_TCP_PORT,
        config.SERVER_ADDRESS,
        config.WSS,
        this._client.session,
      );
    }

    if (config.SERVER_UDP_PORT !== undefined) {
      this._udp = new UDPClient(
        +config.SERVER_UDP_PORT,
        config.SERVER_ADDRESS,
        config.WSS,
        config.ICE_SERVERS,
        this._client.session,
      );
    }

    // TCP carries the reliable channels, UDP the unreliable ones.
    this._client.transports = {
      ...(this._tcp && Object.fromEntries(RELIABLE_CHANNELS.map((c) => [c, this._tcp]))),
      ...(this._udp && Object.fromEntries(UNRELIABLE_CHANNELS.map((c) => [c, this._udp]))),
    };

    // TCP first, so UDP joins its session with the token from the TCP welcome.
    const transports: [string, TCPClient | UDPClient][] = [];
    if (this._tcp) transports.push(["TCP", this._tcp]);
    if (this._udp) transports.push(["UDP", this._udp]);
    await this._client.openChannels(transports);
  }

  /**
   * Send a payload to the server.
   *
   * @param data - Bytes, a string, or any value `JSON.stringify` can encode.
   * @param options - `channel` to send on, `Channel.ReliableOrdered` by default.
   * @throws When the channel's port was not configured
   */
  public sendData(data: NetworkPayload, options?: ChannelOptions): void {
    this._client.sendData(data, options);
  }

  /**
   * Return the packets received since the last call.
   *
   * @remarks
   * Call this method once per frame: packets left unread for a whole tick are
   * dropped, and typed packets never show up here.  Without a `channel`, the
   * packets of every configured channel are returned, reliable channels first.
   *
   * @param options - `channel` to read from, every channel by default.
   * @returns Array of packets, each read with `bytes()`, `text()`, `json()`…
   * @throws When the channel's port was not configured.
   */
  public getReceivedPackets(options?: ChannelOptions): NetworkData[] {
    return this._client.getReceivedPackets(options);
  }

  /**
   * Return `true` when packets can be sent and received.
   *
   * @param options - `channel` to check, every configured channel by default.
   * @throws When the channel's port was not configured.
   */
  public isConnected(options?: ChannelOptions): boolean {
    return this._client.isConnected(options);
  }

  /**
   * Traces packets for the editor (`network-trace`, `network-stats`) while
   * its `welcome` asks for it.
   */
  public async __editorInit(ctx: EditorInitContext): Promise<void> {
    const trace = createTrace(ctx.editor);
    if (this._tcp) traceClient(this._tcp, "tcp", trace);
    if (this._udp) traceClient(this._udp, "udp", trace);
    this._trace = trace;
  }

  /** Sends the totals of the packets traced for the editor (also while paused). */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override async __events(_ctx: Context): Promise<void> {
    this._trace?.tick();
  }

  /** Calls the listeners of the typed packets received since the last tick. */
  public override async __run(ctx: Context): Promise<void> {
    this._client.run(ctx);
  }

  public override expose(): NetworkClientContextApi {
    return this._client.expose();
  }
}
