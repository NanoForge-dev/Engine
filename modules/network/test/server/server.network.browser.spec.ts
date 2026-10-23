import type { Context, InitContext } from "@nanoforge-dev/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NetworkServerLibrary } from "../../src/server/browser";
import { PeerHost } from "../../src/server/peer-host";
import { Channel } from "../../src/shared/channels";
import { PEER_HOST_KEY } from "../../src/shared/signaling";

const makeInitContext = (env: Record<string, string>): InitContext => ({
  vars: { get: () => undefined, set: () => {} },
  env,
  files: new Map(),
});

const env = { SERVER_ADDRESS: "127.0.0.1", SERVER_TCP_PORT: "4445", NETWORK_MODE: "p2p" };

describe("NetworkServerLibrary (browser)", () => {
  let socket: any;

  beforeEach(() => {
    socket = undefined;
    vi.stubGlobal(
      "WebSocket",
      Object.assign(
        vi.fn(function (this: any, url: string) {
          socket = Object.assign(this, { url, readyState: 1, send: vi.fn(), close: vi.fn() });
        }),
        { OPEN: 1 },
      ),
    );
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, PEER_HOST_KEY);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const init = async () => {
    const lib = new NetworkServerLibrary();
    const initializing = lib.__init(makeInitContext(env));
    await vi.waitFor(() => expect(socket).toBeDefined());
    socket.onmessage({ data: JSON.stringify({ type: "room", room: "ABC234" }) });
    await initializing;
    return lib;
  };

  it("should open a room and publish its host for the page's client", async () => {
    const lib = await init();
    const host = Reflect.get(globalThis, PEER_HOST_KEY);

    expect(lib.key).toBe("network");
    expect(socket.url).toBe("ws://127.0.0.1:4445");
    expect(host).toBeInstanceOf(PeerHost);
    expect(host.room).toBe("ABC234");
  });

  it("should serve its own player through the loopback on every channel", async () => {
    const lib = await init();
    const { id, transport } = Reflect.get(globalThis, PEER_HOST_KEY).attachLocal();

    lib.sendToClient(id, "hi", { channel: Channel.UnreliableOrdered });
    expect(transport.getReceivedPackets(Channel.UnreliableOrdered)).toHaveLength(1);
    expect(lib.getConnectedClients()).toStrictEqual([id]);
  });

  it("should close the room on __clear", async () => {
    const lib = await init();
    await lib.__clear({} as Context);

    expect(socket.close).toHaveBeenCalled();
    expect(Reflect.get(globalThis, PEER_HOST_KEY)).toBeUndefined();
    expect(() => lib.sendToAll("hi")).toThrow("is not open");
  });

  it("should need SERVER_TCP_PORT to reach the signaling server", async () => {
    const ctx = makeInitContext({ SERVER_ADDRESS: "127.0.0.1", SERVER_UDP_PORT: "4444" });
    await expect(new NetworkServerLibrary().__init(ctx)).rejects.toThrow(
      "p2p needs SERVER_TCP_PORT",
    );
  });
});
