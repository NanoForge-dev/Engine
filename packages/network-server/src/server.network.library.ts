import { BaseNetworkLibrary, type InitContext } from "@nanoforge-dev/common";

import { ServerConfigNetwork } from "./config.server.network";
import { TCPServer } from "./tcp.server.network";
import { UDPServer } from "./udp.server.network";

export class ServerNetworkLibrary extends BaseNetworkLibrary {
  public udp: UDPServer | null = null;
  public tcp: TCPServer | null = null;

  get __name(): string {
    return "ServerNetworkLibrary";
  }

  public override async __init(context: InitContext): Promise<void> {
    const config: ServerConfigNetwork = await context.config.registerConfig(ServerConfigNetwork);

    if (config.listeningInterface === undefined) {
      throw new Error("No listenning address provided");
    }
    if (config.listeningUdpPort === undefined && config.listeningTcpPort === undefined) {
      throw new Error("No listenning port specified");
    }

    if (config.listeningTcpPort !== undefined) {
      this.tcp = new TCPServer(
        +config.listeningTcpPort,
        config.listeningInterface,
        config.magicValue,
      );
      this.tcp.listen();
    }

    if (config.listeningUdpPort !== undefined) {
      this.udp = new UDPServer(
        +config.listeningUdpPort,
        config.listeningInterface,
        config.magicValue,
      );
      this.udp.listen();
    }
  }

  public async __run(): Promise<void> {}
}
