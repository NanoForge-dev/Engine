import { type Context, type InitContext, Library, defineLibraryKey } from "@nanoforge-dev/common";
import type { EditorAwareLibrary, EditorInitContext } from "@nanoforge-dev/editor-lib";
import { registerEnv } from "@nanoforge-dev/env";

import {
  CHANNELS,
  CONNECT_TIMEOUT_MS,
  type Channel,
  type ChannelOptions,
  DEFAULT_CHANNEL,
  isReliableChannel,
} from "../shared/channels";
import {
  type NetworkData,
  type NetworkPayload,
  encodeNetworkPayload,
} from "../shared/network-data";
import {
  PacketDispatcher,
  type TypedPacket,
  encodePacket,
  encodeTypedPacket,
  sortPackets,
} from "../shared/packet";
import { type Trace, createTrace, traceClient } from "../shared/trace";
import type { ClientSession } from "./client-session";
import { ClientConfigNetwork } from "./config.client.network";
import type {
  ClientPacketInfo,
  ClientPacketsApi,
  NetworkClientContextApi,
} from "./network-client-context.type";
import { TCPClient } from "./tcp.client.network";
import { UDPClient } from "./udp.client.network";

/** Delay between two checks of the channels while `__init` waits for them. */
const CONNECT_POLL_MS = 50;

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
  private readonly _session: ClientSession = {};
  private readonly _dispatcher = new PacketDispatcher<ClientPacketInfo>();
  /** Typed packets drained from the transports, dispatched by the next `__run`. */
  private _typed: TypedPacket<ClientPacketInfo>[] = [];
  /** `sendData` packets drained from the transports, returned by `getReceivedPackets`. */
  private readonly _raw = new Map<Channel, NetworkData[]>();
  private readonly _packets: ClientPacketsApi = {
    on: (packet, listener) => this._dispatcher.on(packet, listener),
    read: (packet) => this._dispatcher.read(packet),
    send: (packet, ...[data, options]) =>
      this.sendBytes(options?.channel ?? packet.channel, encodeTypedPacket(packet, data)),
  };

  /** Client id assigned by the server, `undefined` until transport is welcomed. */
  public get clientId(): string | undefined {
    return this._session.id;
  }

  private _trace: Trace | undefined;

  constructor() {
    // `runAfter` keys run after this library: packets are dispatched before the ECS systems.
    super({ runAfter: ["ecs"] });
  }

  /** Typed packets: per-type listeners, `read` and `send`. */
  public get packets(): ClientPacketsApi {
    return this._packets;
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

    await this.openChannels();
  }

  /**
   * Send a payload to the server.
   *
   * @param data - Bytes, a string, or any value `JSON.stringify` can encode.
   * @param options - `channel` to send on, `Channel.ReliableOrdered` by default.
   * @throws When the channel's port was not configured
   */
  public sendData(data: NetworkPayload, { channel = DEFAULT_CHANNEL }: ChannelOptions = {}): void {
    this.sendBytes(channel, encodePacket(null, encodeNetworkPayload(data)));
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
  public getReceivedPackets({ channel }: ChannelOptions = {}): NetworkData[] {
    if (channel === undefined) {
      return this.configuredChannels().flatMap((c) => this.getReceivedPackets({ channel: c }));
    }
    this.drain(channel);
    const packets = this._raw.get(channel) ?? [];
    this._raw.delete(channel);
    return packets;
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

  /** Calls the listeners of the typed packets received since the last tick. */
  public override async __run(ctx: Context): Promise<void> {
    this._raw.clear();
    for (const channel of this.configuredChannels()) this.drain(channel);
    const typed = this._typed;
    this._typed = [];
    this._dispatcher.dispatch(typed, ctx);
  }

  public override expose(): NetworkClientContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      sendData: (data, options) => library.sendData(data, options),
      getReceivedPackets: (options) => library.getReceivedPackets(options),
      isConnected: (options) => library.isConnected(options),
      get packets() {
        return library.packets;
      },
      get clientId() {
        return library.clientId;
      },
    };
  }

  /**
   * Connect every configured transport and wait until its channels are open.
   *
   * @remarks
   * Channels cannot be opened once the game runs, and connection errors are
   * best caught at start, so this runs during `__init`.
   *
   * @throws When a transport fails to connect, or the channels are not open
   * within `CONNECT_TIMEOUT_MS`.
   */
  private async openChannels(): Promise<void> {
    const deadline = Date.now() + CONNECT_TIMEOUT_MS;
    const channels = this.configuredChannels();

    // TCP first, so UDP joins its session with the token from the TCP welcome.
    const transports: [string, TCPClient | UDPClient][] = [];
    if (this._tcp) transports.push(["TCP", this._tcp]);
    if (this._udp) transports.push(["UDP", this._udp]);

    const failures: unknown[] = [];
    for (const [name, transport] of transports) {
      try {
        await transport.connect();
      } catch (error) {
        failures.push(new Error(`${name} connection failed`, { cause: error }));
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
          `NetworkClientLibrary: channels ${pending.join(", ")} not open after ${CONNECT_TIMEOUT_MS}ms`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, CONNECT_POLL_MS));
    }
  }

  private configuredChannels(): Channel[] {
    return CHANNELS.filter((channel) =>
      isReliableChannel(channel) ? this._tcp !== undefined : this._udp !== undefined,
    );
  }

  private sendBytes(channel: Channel, bytes: Uint8Array): void {
    if (isReliableChannel(channel)) this.requireTcp(channel).sendData(channel, bytes);
    else this.requireUdp(channel).sendData(channel, bytes);
  }

  private drain(channel: Channel): void {
    const packets = isReliableChannel(channel)
      ? this.requireTcp(channel).getReceivedPackets(channel)
      : this.requireUdp(channel).getReceivedPackets(channel);
    const raw = this._raw.get(channel) ?? [];
    sortPackets(packets, { channel }, raw, this._typed);
    this._raw.set(channel, raw);
  }

  private requireTcp(channel: Channel): TCPClient {
    if (!this._tcp) throw new Error(`Channel ${channel} needs SERVER_TCP_PORT to be set`);
    return this._tcp;
  }

  private requireUdp(channel: Channel): UDPClient {
    if (!this._udp) throw new Error(`Channel ${channel} needs SERVER_UDP_PORT to be set`);
    return this._udp;
  }
}
