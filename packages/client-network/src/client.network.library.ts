import { BaseNetworkLibrary, type InitContext } from "@nanoforge-dev/common";

import { ClientConfigNetwork } from "./config.client.network";
import { TCPClient } from "./tcp.client.network";
import { UDPClient } from "./udp.client.network";

export class ClientNetworkLibrary extends BaseNetworkLibrary {
  public udp: UDPClient | null = null;
  public tcp: TCPClient | null = null;

  get __name(): string {
    return "ClientNetworkLibrary";
  }

  public override async __init(context: InitContext): Promise<void> {
    const config: ClientConfigNetwork = await context.config.registerConfig(ClientConfigNetwork);

    if (config.serverAddress === undefined) {
      throw new Error("No server address provided");
    }
    if (config.serverTcpPort === undefined && config.serverUdpPort === undefined) {
      throw new Error("No server port specified to connect");
    }

    if (config.serverTcpPort !== undefined) {
      this.tcp = new TCPClient(+config.serverTcpPort, config.serverAddress, config.magicValue);
      await this.tcp.connect();
    }

    if (config.serverUdpPort !== undefined) {
      this.udp = new UDPClient(+config.serverUdpPort, config.serverAddress, config.magicValue);
      await this.udp.connect();
    }
  }

  public async __run(): Promise<void> {}
}
