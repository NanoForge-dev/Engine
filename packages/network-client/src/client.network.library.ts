import { BaseNetworkLibrary, type InitContext, NfConfigException } from "@nanoforge-dev/common";

import { ClientConfigNetwork } from "./config.client.network";
import { TCPClient } from "./tcp.client.network";
import { UDPClient } from "./udp.client.network";

export class NetworkClientLibrary extends BaseNetworkLibrary {
  // Fast but less reliable send/receive of packets to a UDP server
  public udp!: UDPClient;

  // Reliable ordered send/receive of packets to a TCP server
  public tcp!: TCPClient;

  get __name(): string {
    return "NetworkClientLibrary";
  }

  public override async __init(context: InitContext): Promise<void> {
    const config: ClientConfigNetwork = await context.config.registerConfig(ClientConfigNetwork);

    if (config.SERVER_TCP_PORT === undefined && config.SERVER_UDP_PORT === undefined) {
      throw new NfConfigException("No server port specified to connect", this.__name);
    }

    if (config.SERVER_TCP_PORT !== undefined) {
      this.tcp = new TCPClient(
        +config.SERVER_TCP_PORT,
        config.SERVER_ADDRESS,
        config.MAGIC_VALUE,
        config.WSS,
      );
      await this.tcp.connect();
    }

    if (config.SERVER_UDP_PORT !== undefined) {
      this.udp = new UDPClient(
        +config.SERVER_UDP_PORT,
        config.SERVER_ADDRESS,
        config.MAGIC_VALUE,
        config.WSS,
      );
      await this.udp.connect();
    }
  }
}
