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

    if (config.listeningInterface === undefined) {
      throw new NfConfigException("No listenning address provided", this.__name);
    }
    if (config.listeningUdpPort === undefined && config.listeningTcpPort === undefined) {
      throw new NfConfigException("No listenning port specified", this.__name);
    }

    if (
      (config.cert !== undefined && config.key === undefined) ||
      (config.cert === undefined && config.key !== undefined)
    ) {
      throw new NfConfigException("Both cert and key must be provided together", this.__name);
    }

    if (config.listeningTcpPort !== undefined) {
      this.tcp = new TCPServer(
        +config.listeningTcpPort,
        config.listeningInterface,
        config.magicValue,
        config.cert,
        config.key,
      );
      this.tcp.listen();
    }

    if (config.listeningUdpPort !== undefined) {
      this.udp = new UDPServer(
        +config.listeningUdpPort,
        config.listeningInterface,
        config.magicValue,
        config.cert,
        config.key,
      );
      this.udp.listen();
    }
  }
}
