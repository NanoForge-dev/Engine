import { type Context, type InitContext, Library, defineLibraryKey } from "@nanoforge-dev/common";
import type { EditorAwareLibrary, EditorInitContext } from "@nanoforge-dev/editor-lib";
import { registerEnv } from "@nanoforge-dev/env";

import {
  CHANNELS,
  CONNECT_TIMEOUT_MS,
  type Channel,
  type ChannelOptions,
  type ConnectOptions,
  DEFAULT_CHANNEL,
  isReliableChannel,
} from "../shared/channels";
import { NetworkData, type NetworkPayload, encodeNetworkPayload } from "../shared/network-data";
import { type Trace, createTrace, traceClient } from "../shared/trace";
import type { ClientSession } from "./client-session";
import { ClientConfigNetwork } from "./config.client.network";
import type { NetworkClientContextApi } from "./network-client-context.type";
import { TCPClient } from "./tcp.client.network";
import { UDPClient } from "./udp.client.network";

/** Delay between two checks of the channels while `connect` waits. */
const CONNECT_POLL_MS = 50;

/**
 * Built-in network library for client-side applications.
 *
 * @remarks
 * Reads network configuration from the environment via `ClientConfigNetwork`
 * during `__init`.  Call `connect` to open the connections: TCP (WebSocket)
 * carries the reliable channels and UDP (WebRTC data channels) the unreliable
 * ones.  TCP connects first; once welcomed, UDP presents the session token so
 * both transports share one client id.
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
 * await ctx.network.connect({ channels: [Channel.ReliableOrdered, Channel.UnreliableOrdered] });
 * ctx.network.sendData({ type: "join" }); // Channel.ReliableOrdered
 * ctx.network.sendData({ x: 1, y: 2 }, { channel: Channel.UnreliableOrdered });
 * const messages = ctx.network.getReceivedPackets().map((packet) => packet.json()); // every channel
 * ```
 */
export class NetworkClientLibrary extends Library implements EditorAwareLibrary {
  readonly key = defineLibraryKey("network");

  private _tcp?: TCPClient;
  private _udp?: UDPClient;
  /** Pending or settled connection of each transport, so it is only opened once. */
  private readonly _connecting = new Map<TCPClient | UDPClient, Promise<void>>();
  private readonly _session: ClientSession = {};

  /** Client id assigned by the server, `undefined` until transport is welcomed. */
  public get clientId(): string | undefined {
    return this._session.id;
  }

  private _trace: Trace | undefined;

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
        this._session,
      );
    }

    if (config.SERVER_UDP_PORT !== undefined) {
      this._udp = new UDPClient(
        +config.SERVER_UDP_PORT,
        config.SERVER_ADDRESS,
        config.WSS,
        config.ICE_SERVERS,
        this._session,
      );
    }
  }

  /**
   * Connect to the server and wait until `channels` are open.
   *
   * @remarks
   * Only opens the transports the channels need: TCP for reliable channels,
   * UDP for unreliable ones.  Calling it again for already open channels
   * resolves right away.
   *
   * @param options - `channels` to wait for (every configured channel by
   * default) and a `timeout` in milliseconds (10 seconds by default).
   * @throws When a channel's port was not configured, a transport fails to
   * connect, or the channels are not open before the timeout.
   */
  public async connect({
    channels = this.configuredChannels(),
    timeout = CONNECT_TIMEOUT_MS,
  }: ConnectOptions = {}): Promise<void> {
    if (!this._tcp && !this._udp) {
      throw new Error("NetworkClientLibrary: connect() was called before __init");
    }
    const deadline = Date.now() + timeout;
    const reliable = channels.find(isReliableChannel);
    const unreliable = channels.find((channel) => !isReliableChannel(channel));

    // TCP first, so UDP joins its session with the token from the TCP welcome.
    const transports: [string, TCPClient | UDPClient][] = [];
    if (reliable !== undefined) transports.push(["TCP", this.requireTcp(reliable)]);
    if (unreliable !== undefined) transports.push(["UDP", this.requireUdp(unreliable)]);

    const failures: unknown[] = [];
    for (const [name, transport] of transports) {
      try {
        await this.connectTransport(name, transport);
      } catch (error) {
        failures.push(error);
      }
    }
    if (failures.length > 0) {
      throw new Error("NetworkClientLibrary: could not connect to the server", {
        cause: failures.length === 1 ? failures[0] : failures,
      });
    }

    while (!channels.every((channel) => this.isConnected({ channel }))) {
      if (Date.now() >= deadline) {
        const pending = channels.filter((channel) => !this.isConnected({ channel }));
        throw new Error(
          `NetworkClientLibrary: channels ${pending.join(", ")} not open after ${timeout}ms`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, CONNECT_POLL_MS));
    }
  }

  /**
   * Send a payload to the server.
   *
   * @param data - Bytes, a string, or any value `JSON.stringify` can encode.
   * @param options - `channel` to send on, `Channel.ReliableOrdered` by default.
   * @throws When the channel's port was not configured
   */
  public sendData(data: NetworkPayload, { channel = DEFAULT_CHANNEL }: ChannelOptions = {}): void {
    const bytes = encodeNetworkPayload(data);
    if (isReliableChannel(channel)) this.requireTcp(channel).sendData(channel, bytes);
    else this.requireUdp(channel).sendData(channel, bytes);
  }

  /**
   * Return the packets received since the last call.
   *
   * @remarks
   * Call this method once per frame.  Without a `channel`, the packets of every
   * configured channel are returned, reliable channels first.
   *
   * @param options - `channel` to read from, every channel by default.
   * @returns Array of packets, each read with `bytes()`, `text()`, `json()`…
   * @throws When the channel's port was not configured.
   */
  public getReceivedPackets({ channel }: ChannelOptions = {}): NetworkData[] {
    if (channel === undefined) {
      return this.configuredChannels().flatMap((c) => this.getReceivedPackets({ channel: c }));
    }
    const packets = isReliableChannel(channel)
      ? this.requireTcp(channel).getReceivedPackets(channel)
      : this.requireUdp(channel).getReceivedPackets(channel);
    return packets.map((packet) => new NetworkData(packet));
  }

  /**
   * Return `true` when packets can be sent and received.
   *
   * @param options - `channel` to check, every configured channel by default.
   * @throws When the channel's port was not configured.
   */
  public isConnected({ channel }: ChannelOptions = {}): boolean {
    if (channel === undefined) {
      const channels = this.configuredChannels();
      return channels.length > 0 && channels.every((c) => this.isConnected({ channel: c }));
    }
    if (isReliableChannel(channel)) return this.requireTcp(channel).isConnected();
    return this.requireUdp(channel).isConnected(channel);
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

  public override expose(): NetworkClientContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      connect: (options) => library.connect(options),
      sendData: (data, options) => library.sendData(data, options),
      getReceivedPackets: (options) => library.getReceivedPackets(options),
      isConnected: (options) => library.isConnected(options),
      get clientId() {
        return library.clientId;
      },
    };
  }

  private configuredChannels(): Channel[] {
    return CHANNELS.filter((channel) =>
      isReliableChannel(channel) ? this._tcp !== undefined : this._udp !== undefined,
    );
  }

  private requireTcp(channel: Channel): TCPClient {
    if (!this._tcp) throw new Error(`Channel ${channel} needs SERVER_TCP_PORT to be set`);
    return this._tcp;
  }

  private requireUdp(channel: Channel): UDPClient {
    if (!this._udp) throw new Error(`Channel ${channel} needs SERVER_UDP_PORT to be set`);
    return this._udp;
  }

  private connectTransport(name: string, transport: TCPClient | UDPClient): Promise<void> {
    let connecting = this._connecting.get(transport);
    if (!connecting) {
      connecting = transport.connect().catch((error: unknown) => {
        // Forget the failure so a later `connect` can retry.
        this._connecting.delete(transport);
        throw new Error(`${name} connection failed`, { cause: error });
      });
      this._connecting.set(transport, connecting);
    }
    return connecting;
  }
}
