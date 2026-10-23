import type { Context, InitContext } from "@nanoforge-dev/common";
import type { EditorInitContext } from "@nanoforge-dev/editor-lib";
import { registerEnv } from "@nanoforge-dev/env";

import { buildServerUrl } from "../client/client-session";
import { ClientConfigNetwork } from "../client/config.client.network";
import { CHANNELS } from "../shared/channels";
import { PEER_HOST_KEY } from "../shared/signaling";
import { createTrace, traceServer } from "../shared/trace";
import { PeerHost } from "./peer-host";
import { NetworkServerLibraryBase } from "./server.network.base";

/**
 * `NetworkServerLibrary` as bundled for the browser, when the game sets
 * `network: "p2p"`: it runs in the host player's tab, accepts joiners over
 * WebRTC through the signaling server, and lets the page's client join it
 * through an in-memory loopback.
 *
 * @remarks
 * Reads the client's environment: `SERVER_ADDRESS`, `SERVER_TCP_PORT` and
 * `WSS` locate the signaling server, `ICE_SERVERS` the STUN/TURN servers.
 */
export class NetworkServerLibrary extends NetworkServerLibraryBase {
  private _host?: PeerHost;

  constructor() {
    super((channel) => `Channel ${channel} is not open`);
  }

  public override async __init(ctx: InitContext): Promise<void> {
    const config = await registerEnv(ClientConfigNetwork, ctx.env);
    if (config.SERVER_TCP_PORT === undefined) {
      throw new Error(
        "NetworkServerLibrary: p2p needs SERVER_TCP_PORT to reach the signaling server.",
      );
    }

    const host = (this._host = new PeerHost(this._registry, config.ICE_SERVERS));
    await host.open(buildServerUrl(config.WSS, config.SERVER_ADDRESS, +config.SERVER_TCP_PORT, {}));
    this._server.transports = Object.fromEntries(CHANNELS.map((channel) => [channel, host]));
    Reflect.set(globalThis, PEER_HOST_KEY, host);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override async __clear(_ctx: Context): Promise<void> {
    this._host?.close();
    this._registry.clear();
    delete this._host;
    this._server.transports = {};
    Reflect.deleteProperty(globalThis, PEER_HOST_KEY);
  }

  public override async __editorInit(ctx: EditorInitContext): Promise<void> {
    const trace = createTrace(ctx.editor);
    if (this._host) traceServer(this._host, "udp", trace);
    this._trace = trace;
  }
}
