import { Channel } from "../shared/channels";
import type { ClientId, ClientInfo } from "./client-registry";

/** Transport server a server channel sends and receives through. */
export interface ServerChannelConnection<C extends Channel> {
  getConnectedClients(channel: C): ClientId[];
  getClientInfo(clientId: ClientId): ClientInfo | undefined;
  sendToEverybody(channel: C, data: Uint8Array): void;
  sendToClient(channel: C, clientId: ClientId, data: Uint8Array): void;
  getReceivedPackets(channel: C): Map<ClientId, Uint8Array[]>;
}

/**
 * Server end of one {@link Channel}, for every connected client.
 *
 * @remarks
 * A thin view over the transport server carrying the channel: the TCP
 * WebSocket server for reliable channels, the WebRTC server for unreliable
 * ones.  Packets received on other channels are never returned here.
 */
export abstract class ChannelServer<C extends Channel> {
  /** Channel this server sends and receives on. */
  public abstract readonly channel: C;

  constructor(private readonly _connection: ServerChannelConnection<C>) {}

  /**
   * Return a snapshot array of the clients reachable on this channel.
   *
   * @returns ClientId[]
   */
  public getConnectedClients(): ClientId[] {
    return this._connection.getConnectedClients(this.channel);
  }

  /**
   * Return what is known about a client session: its address, user agent,
   * query parameters and attached transports.
   *
   * @param clientId - Client identifier.
   * @returns ClientInfo | undefined — `undefined` when the client is gone.
   */
  public getClientInfo(clientId: ClientId): ClientInfo | undefined {
    return this._connection.getClientInfo(clientId);
  }

  /**
   * Send a payload to every client reachable on this channel.
   *
   * @param data - Raw payload bytes.
   */
  public sendToEverybody(data: Uint8Array): void {
    this._connection.sendToEverybody(this.channel, data);
  }

  /**
   * Send a payload to one client on this channel.
   *
   * @param clientId - Client identifier, as listed by `getConnectedClients`.
   * @param data - Raw payload bytes.
   */
  public sendToClient(clientId: ClientId, data: Uint8Array): void {
    this._connection.sendToClient(this.channel, clientId, data);
  }

  /**
   * Return the packets each client sent on this channel since the last call.
   *
   * @remarks
   * Call this method once per frame.
   *
   * @returns Map<ClientId, Uint8Array[]> — mapping client ID to array of packets.
   */
  public getReceivedPackets(): Map<ClientId, Uint8Array[]> {
    return this._connection.getReceivedPackets(this.channel);
  }
}

/** Never lost, delivered in send order. Carried by TCP. */
export class ReliableOrderedServer extends ChannelServer<Channel.ReliableOrdered> {
  public readonly channel = Channel.ReliableOrdered;
}

/** Never lost, no ordering promise. Carried by TCP. */
export class ReliableUnorderedServer extends ChannelServer<Channel.ReliableUnordered> {
  public readonly channel = Channel.ReliableUnordered;
}

/**
 * May be lost; a packet older than the last one delivered is dropped.
 * Carried by WebRTC.
 */
export class UnreliableOrderedServer extends ChannelServer<Channel.UnreliableOrdered> {
  public readonly channel = Channel.UnreliableOrdered;
}

/** May be lost or arrive in any order. Carried by WebRTC. */
export class UnreliableUnorderedServer extends ChannelServer<Channel.UnreliableUnordered> {
  public readonly channel = Channel.UnreliableUnordered;
}
