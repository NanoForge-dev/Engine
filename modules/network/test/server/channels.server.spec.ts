import { describe, expect, it, vi } from "vitest";

import {
  ReliableOrderedServer,
  ReliableUnorderedServer,
  type ServerChannelConnection,
  UnreliableOrderedServer,
  UnreliableUnorderedServer,
} from "../../src/server/channels.server.network";
import { Channel } from "../../src/shared/channels";

const info = { id: "client-0", connectedAt: 0, transports: {} };
const packets = new Map([["client-0", [new Uint8Array([1])]]]);

const makeConnection = () =>
  ({
    getConnectedClients: vi.fn(() => ["client-0"]),
    getClientInfo: vi.fn(() => info),
    sendToEverybody: vi.fn(),
    sendToClient: vi.fn(),
    getReceivedPackets: vi.fn(() => packets),
  }) satisfies ServerChannelConnection<Channel>;

const cases = [
  { Server: ReliableOrderedServer, channel: Channel.ReliableOrdered },
  { Server: ReliableUnorderedServer, channel: Channel.ReliableUnordered },
  { Server: UnreliableOrderedServer, channel: Channel.UnreliableOrdered },
  { Server: UnreliableUnorderedServer, channel: Channel.UnreliableUnordered },
];

describe.each(cases)("$Server.name", ({ Server, channel }) => {
  it(`should send to one client on ${channel}`, () => {
    const connection = makeConnection();
    new Server(connection).sendToClient("client-0", new Uint8Array([2]));
    expect(connection.sendToClient).toHaveBeenCalledWith(channel, "client-0", new Uint8Array([2]));
  });

  it(`should broadcast on ${channel}`, () => {
    const connection = makeConnection();
    new Server(connection).sendToEverybody(new Uint8Array([3]));
    expect(connection.sendToEverybody).toHaveBeenCalledWith(channel, new Uint8Array([3]));
  });

  it(`should read the packets of ${channel}`, () => {
    const connection = makeConnection();
    expect(new Server(connection).getReceivedPackets()).toBe(packets);
    expect(connection.getReceivedPackets).toHaveBeenCalledWith(channel);
  });

  it(`should list the clients reachable on ${channel}`, () => {
    const connection = makeConnection();
    expect(new Server(connection).getConnectedClients()).toStrictEqual(["client-0"]);
    expect(connection.getConnectedClients).toHaveBeenCalledWith(channel);
  });

  it("should look up client info through its connection", () => {
    expect(new Server(makeConnection()).getClientInfo("client-0")).toBe(info);
  });
});
