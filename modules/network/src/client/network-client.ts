import type { Context } from "@nanoforge-dev/common";

import {
  CHANNELS,
  CONNECT_TIMEOUT_MS,
  type Channel,
  type ChannelOptions,
  DEFAULT_CHANNEL,
} from "../shared/channels";
import {
  type NetworkData,
  type NetworkPayload,
  encodeNetworkPayload,
} from "../shared/network-data";
import {
  PacketDispatcher,
  type TypedPacket,
  encodePacket,
  encodeTypedPacket,
  sortPackets,
} from "../shared/packet";
import type { ClientTransport } from "../shared/transport";
import type { ClientSession } from "./client-session";
import type {
  ClientPacketInfo,
  ClientPacketsApi,
  NetworkClientContextApi,
} from "./network-client-context.type";

/** Delay between two checks of the channels while `openChannels` waits for them. */
const CONNECT_POLL_MS = 50;

/**
 * Transport-independent half of a client: session, typed and raw packet
 * queues, and routing of each channel to the transport carrying it.
 *
 * @remarks
 * Shared by `NetworkClientLibrary` (TCP and UDP to a dedicated server) and
 * `NetworkPeerLibrary` (WebRTC to a host, or loopback on the host).
 */
export class NetworkClient {
  /** Transport carrying each channel; a missing channel throws when used. */
  public transports: Partial<Record<Channel, ClientTransport<Channel>>> = {};
  /** Session shared with the transports, filled by the server's welcome. */
  public readonly session: ClientSession = {};

  private readonly _dispatcher = new PacketDispatcher<ClientPacketInfo>();
  /** Typed packets drained from the transports, dispatched by the next `run`. */
  private _typed: TypedPacket<ClientPacketInfo>[] = [];
  /** `sendData` packets drained from the transports, returned by `getReceivedPackets`. */
  private readonly _raw = new Map<Channel, NetworkData[]>();
  private readonly _packets: ClientPacketsApi = {
    on: (packet, listener) => this._dispatcher.on(packet, listener),
    read: (packet) => this._dispatcher.read(packet),
    send: (packet, ...[data, options]) =>
      this.sendBytes(options?.channel ?? packet.channel, encodeTypedPacket(packet, data)),
  };

  /**
   * @param _name - Library name, prefixed to connection errors.
   * @param _requirement - Error message for a channel with no transport.
   */
  constructor(
    private readonly _name: string,
    private readonly _requirement: (channel: Channel) => string,
  ) {}

  /** Client id assigned by the server, `undefined` until welcomed. */
  public get clientId(): string | undefined {
    return this.session.id;
  }

  /** Typed packets: per-type listeners, `read` and `send`. */
  public get packets(): ClientPacketsApi {
    return this._packets;
  }

  /** See `NetworkClientContextApi.sendData`. */
  public sendData(data: NetworkPayload, { channel = DEFAULT_CHANNEL }: ChannelOptions = {}): void {
    this.sendBytes(channel, encodePacket(null, encodeNetworkPayload(data)));
  }

  /** See `NetworkClientContextApi.getReceivedPackets`. */
  public getReceivedPackets({ channel }: ChannelOptions = {}): NetworkData[] {
    if (channel === undefined) {
      return this.configuredChannels().flatMap((c) => this.getReceivedPackets({ channel: c }));
    }
    this.drain(channel);
    const packets = this._raw.get(channel) ?? [];
    this._raw.delete(channel);
    return packets;
  }

  /** See `NetworkClientContextApi.isConnected`. */
  public isConnected({ channel }: ChannelOptions = {}): boolean {
    if (channel === undefined) {
      const channels = this.configuredChannels();
      return channels.length > 0 && channels.every((c) => this.isConnected({ channel: c }));
    }
    return this.require(channel).isConnected(channel);
  }

  /** Calls the listeners of the typed packets received since the last tick. */
  public run(ctx: Context): void {
    this._raw.clear();
    for (const channel of this.configuredChannels()) this.drain(channel);
    const typed = this._typed;
    this._typed = [];
    this._dispatcher.dispatch(typed, ctx);
  }

  /**
   * Connect each transport, in order, then wait until every routed channel is
   * open.
   *
   * @param transports - Transports to connect, named for error messages. The
   * first one welcomed gives its session token to the next.
   * @throws When a transport fails to connect, or the channels are not open
   * within `CONNECT_TIMEOUT_MS`.
   */
  public async openChannels(transports: [string, { connect(): Promise<void> }][]): Promise<void> {
    const deadline = Date.now() + CONNECT_TIMEOUT_MS;
    const channels = this.configuredChannels();

    const failures: unknown[] = [];
    for (const [name, transport] of transports) {
      try {
        await transport.connect();
      } catch (error) {
        failures.push(new Error(`${name} connection failed`, { cause: error }));
      }
    }
    if (failures.length > 0) {
      throw new Error(`${this._name}: could not connect to the server`, {
        cause: failures.length === 1 ? failures[0] : failures,
      });
    }

    while (!channels.every((channel) => this.isConnected({ channel }))) {
      if (Date.now() >= deadline) {
        const pending = channels.filter((channel) => !this.isConnected({ channel }));
        throw new Error(
          `${this._name}: channels ${pending.join(", ")} not open after ${CONNECT_TIMEOUT_MS}ms`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, CONNECT_POLL_MS));
    }
  }

  public expose(): NetworkClientContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const client = this;
    return {
      sendData: (data, options) => client.sendData(data, options),
      getReceivedPackets: (options) => client.getReceivedPackets(options),
      isConnected: (options) => client.isConnected(options),
      get packets() {
        return client.packets;
      },
      get clientId() {
        return client.clientId;
      },
    };
  }

  private configuredChannels(): Channel[] {
    return CHANNELS.filter((channel) => this.transports[channel] !== undefined);
  }

  private sendBytes(channel: Channel, bytes: Uint8Array): void {
    this.require(channel).sendData(channel, bytes);
  }

  private drain(channel: Channel): void {
    const packets = this.require(channel).getReceivedPackets(channel);
    const raw = this._raw.get(channel) ?? [];
    sortPackets(packets, { channel }, raw, this._typed);
    this._raw.set(channel, raw);
  }

  private require(channel: Channel): ClientTransport<Channel> {
    const transport = this.transports[channel];
    if (!transport) throw new Error(this._requirement(channel));
    return transport;
  }
}
