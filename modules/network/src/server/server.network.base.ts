import { type Context, Library, defineLibraryKey } from "@nanoforge-dev/common";
import type { EditorAwareLibrary, EditorInitContext } from "@nanoforge-dev/editor-lib";

import type { Channel, ChannelOptions } from "../shared/channels";
import type { NetworkData, NetworkPayload } from "../shared/network-data";
import type { Trace } from "../shared/trace";
import { type ClientId, type ClientInfo, ClientRegistry, type ClientsApi } from "./client-registry";
import { NetworkServer } from "./network-server";
import type { NetworkServerContextApi, ServerPacketsApi } from "./network-server-context.type";

/**
 * Public API of `NetworkServerLibrary`, shared by its Bun build (TCP and UDP
 * servers) and its browser build (peer-to-peer host).
 */
export abstract class NetworkServerLibraryBase extends Library implements EditorAwareLibrary {
  readonly key = defineLibraryKey("network");

  protected readonly _registry = new ClientRegistry();
  protected readonly _server: NetworkServer;
  protected _trace: Trace | undefined;

  /** @param requirement - Error message for a channel with no transport. */
  constructor(requirement: (channel: Channel) => string) {
    super({ runAfter: ["ecs"] });
    this._server = new NetworkServer(this._registry, requirement);
  }

  /** Client sessions shared by the transports. */
  public get clients(): ClientsApi {
    return this._server.clients;
  }

  /** Typed packets: per-type listeners, `read` and sending. */
  public get packets(): ServerPacketsApi {
    return this._server.packets;
  }

  /**
   * Send a payload to every client reachable on a channel.
   *
   * @param data - Bytes, a string, or any value `JSON.stringify` can encode.
   * @param options - `channel` to send on, `Channel.ReliableOrdered` by default.
   * @throws When the channel's port was not configured, or `data` cannot be
   * encoded as JSON.
   */
  public sendToAll(data: NetworkPayload, options?: ChannelOptions): void {
    this._server.sendToAll(data, options);
  }

  /**
   * Send a payload to one client.
   *
   * @param clientId - Client identifier.
   * @param data - Bytes, a string, or any value `JSON.stringify` can encode.
   * @param options - `channel` to send on, `Channel.ReliableOrdered` by default.
   * @throws When the channel's port was not configured, or `data` cannot be
   * encoded as JSON.
   */
  public sendToClient(clientId: ClientId, data: NetworkPayload, options?: ChannelOptions): void {
    this._server.sendToClient(clientId, data, options);
  }

  /**
   * Return the packets each client sent since the last call.
   *
   * @remarks
   * Call this method once per frame: packets left unread for a whole tick are
   * dropped, and typed packets never show up here.  Without a `channel`, the
   * packets of every configured channel are merged per client, reliable channels first.
   *
   * @param options - `channel` to read from, every channel by default.
   * @returns Map of client id to packets, each read with `bytes()`, `text()`,
   * `json()`…
   * @throws When the channel's port was not configured.
   */
  public getReceivedPackets(options?: ChannelOptions): Map<ClientId, NetworkData[]> {
    return this._server.getReceivedPackets(options);
  }

  /**
   * Return the clients reachable on a channel.
   *
   * @param options - `channel` to check, any configured channel by default.
   * @returns Snapshot array of client ids.
   * @throws When the channel's port was not configured.
   */
  public getConnectedClients(options?: ChannelOptions): ClientId[] {
    return this._server.getConnectedClients(options);
  }

  /**
   * Return what is known about a client session: its address, user agent,
   * query parameters and attached transports.
   *
   * @param clientId - Client identifier.
   * @returns The live session info, or `undefined` when the client is gone.
   */
  public getClientInfo(clientId: ClientId): ClientInfo | undefined {
    return this._server.getClientInfo(clientId);
  }

  /**
   * Traces packets for the editor (`network-trace`, `network-stats`) while
   * its `welcome` asks for it.
   */
  public abstract __editorInit(ctx: EditorInitContext): Promise<void>;

  /** Sends the totals of the packets traced for the editor (also while paused). */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override async __events(_ctx: Context): Promise<void> {
    this._trace?.tick();
  }

  /** Calls the listeners of the typed packets received since the last tick. */
  public override async __run(ctx: Context): Promise<void> {
    this._server.run(ctx);
  }

  public override expose(): NetworkServerContextApi {
    return this._server.expose();
  }
}
