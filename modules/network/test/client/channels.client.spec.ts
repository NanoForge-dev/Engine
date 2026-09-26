import { describe, expect, it, vi } from "vitest";

import {
  type ClientChannelConnection,
  ReliableOrderedClient,
  ReliableUnorderedClient,
  UnreliableOrderedClient,
  UnreliableUnorderedClient,
} from "../../src/client/channels.client.network";
import { Channel } from "../../src/shared/channels";

const makeConnection = () =>
  ({
    getClientId: vi.fn(() => "client-0"),
    isConnected: vi.fn(() => true),
    sendData: vi.fn(),
    getReceivedPackets: vi.fn(() => [new Uint8Array([1])]),
  }) satisfies ClientChannelConnection<Channel>;

const cases = [
  { Client: ReliableOrderedClient, channel: Channel.ReliableOrdered },
  { Client: ReliableUnorderedClient, channel: Channel.ReliableUnordered },
  { Client: UnreliableOrderedClient, channel: Channel.UnreliableOrdered },
  { Client: UnreliableUnorderedClient, channel: Channel.UnreliableUnordered },
];

describe.each(cases)("$Client.name", ({ Client, channel }) => {
  it(`should send on ${channel}`, () => {
    const connection = makeConnection();
    new Client(connection).sendData(new Uint8Array([2]));
    expect(connection.sendData).toHaveBeenCalledWith(channel, new Uint8Array([2]));
  });

  it(`should read the packets of ${channel}`, () => {
    const connection = makeConnection();
    expect(new Client(connection).getReceivedPackets()).toStrictEqual([new Uint8Array([1])]);
    expect(connection.getReceivedPackets).toHaveBeenCalledWith(channel);
  });

  it(`should report whether ${channel} is connected`, () => {
    const connection = makeConnection();
    expect(new Client(connection).isConnected()).toBe(true);
    expect(connection.isConnected).toHaveBeenCalledWith(channel);
  });

  it("should return the client id of its connection", () => {
    expect(new Client(makeConnection()).getClientId()).toBe("client-0");
  });
});
