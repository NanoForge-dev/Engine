/**
 * Client side of a transport: what `NetworkClient` needs from the TCP, UDP,
 * peer or loopback links carrying its channels.
 */
export interface ClientTransport<C> {
  sendData(channel: C, data: Uint8Array): void;
  getReceivedPackets(channel: C): Uint8Array[];
  isConnected(channel: C): boolean;
}

/**
 * Server side of a transport: what `NetworkServer` needs from the TCP, UDP or
 * peer-host links carrying its channels.
 */
export interface ServerTransport<C> {
  sendToEverybody(channel: C, data: Uint8Array): void;
  sendToClient(channel: C, clientId: string, data: Uint8Array): void;
  getReceivedPackets(channel: C): Map<string, Uint8Array[]>;
  getConnectedClients(channel: C): string[];
}
