import { type Context, type InitContext, Library, defineLibraryKey } from "@nanoforge-dev/common";
import type { EditorAwareLibrary, EditorInitContext } from "@nanoforge-dev/editor-lib";
import { registerEnv } from "@nanoforge-dev/env";

import { buildServerUrl } from "../client/client-session";
import { NetworkClient } from "../client/network-client";
import type { ClientPacketsApi } from "../client/network-client-context.type";
import { UDPClient } from "../client/udp.client.network";
import { ClientRegistry } from "../server/client-registry";
import { NetworkServer } from "../server/network-server";
import type { NetworkServerContextApi } from "../server/network-server-context.type";
import {
  CHANNELS,
  CONNECT_TIMEOUT_MS,
  type Channel,
  type ChannelOptions,
} from "../shared/channels";
import type { NetworkData, NetworkPayload } from "../shared/network-data";
import { ROOM_PARAM } from "../shared/signaling";
import { type Trace, createTrace, traceClient, traceServer } from "../shared/trace";
import { PeerConfigNetwork } from "./config.peer.network";
import type { NetworkPeerContextApi } from "./network-peer-context.type";
import { PeerHost } from "./peer-host";

/** Every channel routed to one transport. */
const allChannels = <T>(transport: T): Partial<Record<Channel, T>> =>
  Object.fromEntries(CHANNELS.map((channel) => [channel, transport]));

/**
 * Network library for games without a dedicated server: one player hosts,
 * the others join it peer-to-peer.
 *
 * @remarks
 * The host's browser runs the game's server (the same API as
 * `NetworkServerLibrary`, as `server`) and accepts joiners over WebRTC; its
 * own player reaches that server through an in-memory loopback.  Each joiner
 * holds one WebRTC connection to the host, carrying the four channels as data
 * channels.  A signaling server (`NetworkServerLibrary` with
 * `LISTENING_SIGNALING_PORT`) only pairs players for the handshake: game
 * traffic never goes through it.  The game ends when the host leaves.
 *
 * Configuration (via environment variables):
 * - `SERVER_ADDRESS` — hostname or IP of the signaling server (required).
 * - `SERVER_SIGNALING_PORT` — its port (required).
 * - `WSS` — set to `"true"` to use `wss://` (default: `false`).
 * - `ICE_SERVERS` — STUN/TURN servers, comma-separated or a JSON array.
 *
 * @example
 * ```ts
 * const room = new URLSearchParams(location.search).get("room");
 * if (room) await network.join(room);
 * else {
 *   const server = await network.host();
 *   console.info(`invite: ${location.origin}${location.pathname}?room=${network.room}`);
 *   server.packets.on(Input, ({ key }, { clientId }) => handleInput(clientId, key, server));
 * }
 * network.packets.send(Play); // on the host, reaches its own server
 * ```
 */
export class NetworkPeerLibrary extends Library implements EditorAwareLibrary {
  readonly key = defineLibraryKey("network");

  private _config?: PeerConfigNetwork;
  private readonly _client = new NetworkClient(
    "NetworkPeerLibrary",
    () => "NetworkPeerLibrary: call host() or join() first",
  );
  private _host?: PeerHost;
  private _server?: NetworkServerContextApi;
  private _serverCore?: NetworkServer;
  private _udp?: UDPClient;
  private _trace: Trace | undefined;

  constructor() {
    // `runAfter` keys run after this library: packets are dispatched before the ECS systems.
    super({ runAfter: ["ecs"] });
  }

  /** Typed packets: per-type listeners, `read` and `send`, to the host's server. */
  public get packets(): ClientPacketsApi {
    return this._client.packets;
  }

  /** Session id of this player, the host's player included. */
  public get clientId(): string | undefined {
    return this._client.clientId;
  }

  /** Whether this player hosts the game. */
  public get isHost(): boolean {
    return this._server !== undefined;
  }

  /** Code joiners use to reach the host, once `host()` resolved; `undefined` once the room closed. */
  public get room(): string | undefined {
    return this._host?.room;
  }

  /** The host's server; `undefined` on joiners. */
  public get server(): NetworkServerContextApi | undefined {
    return this._server;
  }

  public override async __init(ctx: InitContext): Promise<void> {
    this._config = await registerEnv(PeerConfigNetwork, ctx.env);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override async __clear(_ctx: Context): Promise<void> {
    this.leave();
  }

  /** See `NetworkPeerContextApi.host`. */
  public async host(): Promise<NetworkServerContextApi> {
    const config = this.prepare();
    const registry = new ClientRegistry();
    const host = (this._host = new PeerHost(registry, config.ICE_SERVERS));

    try {
      const url = buildServerUrl(
        config.WSS,
        config.SERVER_ADDRESS,
        +config.SERVER_SIGNALING_PORT,
        {},
      );
      await host.open(url);
    } catch (error) {
      // A `leave()` meanwhile may have started another session: leave only this one.
      if (this._host === host) this.leave();
      throw new Error("NetworkPeerLibrary: could not reach the signaling server", {
        cause: error,
      });
    }
    if (this._host !== host) throw new Error("NetworkPeerLibrary: left while hosting");

    const server = (this._serverCore = new NetworkServer(
      registry,
      (channel) => `Channel ${channel} is not open`,
    ));
    server.transports = allChannels(host);
    const local = host.attachLocal();
    this._client.session.id = local.id;
    this._client.transports = allChannels(local.transport);
    if (this._trace) traceServer(host, "udp", this._trace);
    return (this._server = server.expose());
  }

  /** See `NetworkPeerContextApi.join`. */
  public async join(room: string): Promise<void> {
    const config = this.prepare();
    const udp = (this._udp = new UDPClient(
      +config.SERVER_SIGNALING_PORT,
      config.SERVER_ADDRESS,
      config.WSS,
      config.ICE_SERVERS,
      this._client.session,
      CHANNELS,
      { [ROOM_PARAM]: room },
    ));
    this._client.transports = allChannels(udp);
    if (this._trace) traceClient(udp, "udp", this._trace);

    try {
      // The host welcomes a joiner once its channels are open, so wait for as long.
      await this._client.openChannels([
        ["Peer", { connect: () => udp.connect(CONNECT_TIMEOUT_MS) }],
      ]);
    } catch (error) {
      if (this._udp === udp) this.leave();
      throw error;
    }
  }

  /** See `NetworkPeerContextApi.leave`. */
  public leave(): void {
    this._host?.close();
    this._udp?.close();
    delete this._host;
    delete this._udp;
    delete this._server;
    delete this._serverCore;
    this._client.transports = {};
    delete this._client.session.id;
    delete this._client.session.token;
  }

  /** See `NetworkClientContextApi.sendData`. */
  public sendData(data: NetworkPayload, options?: ChannelOptions): void {
    this._client.sendData(data, options);
  }

  /** See `NetworkClientContextApi.getReceivedPackets`. */
  public getReceivedPackets(options?: ChannelOptions): NetworkData[] {
    return this._client.getReceivedPackets(options);
  }

  /** See `NetworkClientContextApi.isConnected`. */
  public isConnected(options?: ChannelOptions): boolean {
    return this._client.isConnected(options);
  }

  /**
   * Traces packets for the editor (`network-trace`, `network-stats`) while
   * its `welcome` asks for it.
   */
  public async __editorInit(ctx: EditorInitContext): Promise<void> {
    // shortcut: WebRTC links are traced as "udp" and the host's loopback is not traced; add a "peer" kind to the editor protocol if needed.
    const trace = createTrace(ctx.editor);
    if (this._host) traceServer(this._host, "udp", trace);
    if (this._udp) traceClient(this._udp, "udp", trace);
    this._trace = trace;
  }

  /** Sends the totals of the packets traced for the editor (also while paused). */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override async __events(_ctx: Context): Promise<void> {
    this._trace?.tick();
  }

  /**
   * Calls the listeners of the typed packets received since the last tick:
   * the host's server first, so its replies to its own player arrive this tick.
   */
  public override async __run(ctx: Context): Promise<void> {
    this._serverCore?.run(ctx);
    this._client.run(ctx);
  }

  public override expose(): NetworkPeerContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      sendData: (data, options) => library.sendData(data, options),
      getReceivedPackets: (options) => library.getReceivedPackets(options),
      isConnected: (options) => library.isConnected(options),
      host: () => library.host(),
      join: (room) => library.join(room),
      leave: () => library.leave(),
      get packets() {
        return library.packets;
      },
      get clientId() {
        return library.clientId;
      },
      get isHost() {
        return library.isHost;
      },
      get room() {
        return library.room;
      },
      get server() {
        return library.server;
      },
    };
  }

  /** The config, once nothing is hosted or joined. */
  private prepare(): PeerConfigNetwork {
    if (!this._config) throw new Error("NetworkPeerLibrary: the app is not initialized");
    if (this._host || this._udp) {
      throw new Error("NetworkPeerLibrary: already hosting or joined, call leave() first");
    }
    return this._config;
  }
}
