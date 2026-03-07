import { BaseNetworkLibrary, type InitContext, NfConfigException } from "@nanoforge-dev/common";

import { ServerConfigNetwork } from "./config.server.network";
import { TCPServer } from "./tcp.server.network";
import { UDPServer } from "./udp.server.network";

export class NetworkServerLibrary extends BaseNetworkLibrary {
  // Fast but less reliable unordered send/receive to multiple UDP clients
  public udp!: UDPServer;

  // Reliable ordered send/receive of packets to multiple TCP clients
  public tcp!: TCPServer;

  get __name(): string {
    return "NetworkServerLibrary";
  }

  public override async __init(context: InitContext): Promise<void> {
    const config: ServerConfigNetwork = await context.config.registerConfig(ServerConfigNetwork);

    if (config.LISTENING_INTERFACE === undefined) {
      throw new NfConfigException("No listenning address provided", this.__name);
    }
    if (config.LISTENING_TCP_PORT === undefined && config.LISTENING_UDP_PORT === undefined) {
      throw new NfConfigException("No listenning port specified", this.__name);
    }

    if (
      (config.WSS_CERT !== undefined && config.WSS_KEY === undefined) ||
      (config.WSS_CERT === undefined && config.WSS_KEY !== undefined)
    ) {
      throw new NfConfigException("Both cert and key must be provided together", this.__name);
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
      );
      this.udp.listen();
    }
  }
}
