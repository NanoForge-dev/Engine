import type { Context, InitContext } from "@nanoforge-dev/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Channel, NetworkPeerLibrary, definePacket } from "../../src/peer";

const makeInitContext = (env: Record<string, string>): InitContext => ({
  vars: { get: () => undefined, set: () => {} },
  env,
  files: new Map(),
});

const env = { SERVER_ADDRESS: "127.0.0.1", SERVER_SIGNALING_PORT: "9000" };
const ctx = {} as Context;

const Play = definePacket("play");
const AssignId = definePacket<{ id: number }>("assignId");
const Move = definePacket<{ x: number }>("move", { channel: Channel.UnreliableOrdered });

describe("NetworkPeerLibrary", () => {
  let sockets: any[];
  let dataChannels: any[];
  /** `readyState` of the data channels a joiner creates. */
  let dataChannelState: string;

  beforeEach(() => {
    sockets = [];
    dataChannels = [];
    dataChannelState = "open";
    vi.stubGlobal(
      "WebSocket",
      Object.assign(
        vi.fn(function (this: any, url: string) {
          Object.assign(this, {
            url,
            readyState: 1,
            send: vi.fn(),
            close: vi.fn(),
            onerror: null,
            onopen: null,
            onclose: null,
            onmessage: null,
          });
          sockets.push(this);
        }),
        { OPEN: 1 },
      ),
    );
    vi.stubGlobal(
      "RTCPeerConnection",
      vi.fn(function (this: any) {
        Object.assign(this, {
          onicecandidate: null,
          close: vi.fn(),
          createDataChannel: vi.fn((label: string, options: unknown) => {
            const channel = { label, options, readyState: dataChannelState, send: vi.fn() };
            dataChannels.push(channel);
            return channel;
          }),
          createOffer: vi.fn().mockResolvedValue({ type: "offer", sdp: "v=0" }),
          setLocalDescription: vi.fn().mockResolvedValue(undefined),
        });
      }),
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const init = async () => {
    const lib = new NetworkPeerLibrary();
    await lib.__init(makeInitContext(env));
    return lib;
  };

  /** Host, with the signaling server giving room `ABC234`. */
  const host = async (lib: NetworkPeerLibrary) => {
    const hosting = lib.host();
    sockets.at(-1).onmessage({ data: JSON.stringify({ type: "room", room: "ABC234" }) });
    return hosting;
  };

  /** Join, with the host's welcome arriving through the signaling socket. */
  const join = async (lib: NetworkPeerLibrary, room = "ABC234") => {
    const joining = lib.join(room);
    await new Promise((resolve) => setTimeout(resolve));
    await sockets.at(-1).onmessage({
      data: JSON.stringify({ type: "welcome", id: "client-7", token: "t0k3n" }),
    });
    return joining;
  };

  describe("metadata", () => {
    it("should use the 'network' key and run before the ECS", () => {
      const lib = new NetworkPeerLibrary();
      expect(lib.key).toBe("network");
      expect(lib.relationships.runAfter).toStrictEqual(["ecs"]);
    });

    it("should require the signaling server's port", async () => {
      const ctx = makeInitContext({ SERVER_ADDRESS: "127.0.0.1" });
      await expect(new NetworkPeerLibrary().__init(ctx)).rejects.toThrow();
    });

    it("should not connect during __init", async () => {
      await init();
      expect(WebSocket).not.toHaveBeenCalled();
    });
  });

  describe("before hosting or joining", () => {
    it("should throw on send and report not connected", async () => {
      const lib = await init();

      expect(() => lib.packets.send(Play)).toThrow("call host() or join() first");
      expect(() => lib.sendData("hi")).toThrow("call host() or join() first");
      expect(lib.isConnected()).toBe(false);
      expect(lib.getReceivedPackets()).toStrictEqual([]);
      expect(lib.isHost).toBe(false);
      expect(lib.server).toBeUndefined();
    });

    it("should throw when the app is not initialized", async () => {
      await expect(new NetworkPeerLibrary().host()).rejects.toThrow("not initialized");
    });
  });

  describe("host", () => {
    it("should open a room on the signaling server", async () => {
      const lib = await init();
      const server = await host(lib);

      expect(sockets[0].url).toBe("ws://127.0.0.1:9000");
      expect(lib.isHost).toBe(true);
      expect(lib.room).toBe("ABC234");
      expect(lib.server).toBe(server);
      expect(lib.isConnected()).toBe(true);
      expect(server.getConnectedClients()).toStrictEqual([lib.clientId]);
    });

    it("should loop the host's own packets back to its server, and the replies, in one tick", async () => {
      const lib = await init();
      const server = await host(lib);
      const assigned: unknown[] = [];
      server.packets.on(Play, (_, { clientId }) =>
        server.packets.sendToClient(clientId, AssignId, { id: 1 }),
      );
      lib.packets.on(AssignId, (data, { channel }) => assigned.push([data, channel]));

      lib.packets.send(Play);
      await lib.__run(ctx);
      expect(assigned).toStrictEqual([[{ id: 1 }, Channel.ReliableOrdered]]);
    });

    it("should not warn about loopback packets a system reads, then skips on the host", async () => {
      const lib = await init();
      const server = await host(lib);
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      for (let tick = 0; tick < 3; tick++) {
        server.packets.sendToAll(Move, { x: tick });
        await lib.__run(ctx);
        const moves = lib.packets.read(Move); // `applyMoves`: read first,
        if (lib.isHost) continue; //               then skip on the host
        expect(moves).toHaveLength(1);
      }
      expect(warn).not.toHaveBeenCalled();
    });

    it("should refuse to host or join twice", async () => {
      const lib = await init();
      await host(lib);

      await expect(lib.host()).rejects.toThrow("already hosting or joined");
      await expect(lib.join("ABC234")).rejects.toThrow("already hosting or joined");
    });

    it("should not let a hosting abandoned by leave() end the next session", async () => {
      const lib = await init();
      const hosting = lib.host();
      const abandoned = sockets[0];
      lib.leave();
      const joining = join(lib);
      abandoned.onclose();

      await expect(hosting).rejects.toThrow("could not reach the signaling server");
      await expect(joining).resolves.toBeUndefined();
      expect(sockets[1].close).not.toHaveBeenCalled();
      expect(lib.isConnected()).toBe(true);
    });

    it("should not resume a hosting abandoned by leave() once its room arrives", async () => {
      const lib = await init();
      const hosting = lib.host();
      lib.leave();
      sockets[0].onmessage({ data: JSON.stringify({ type: "room", room: "ABC234" }) });

      await expect(hosting).rejects.toThrow("left while hosting");
      expect(lib.isHost).toBe(false);
      expect(lib.room).toBeUndefined();
    });

    it("should reject, and allow a retry, when the signaling server is unreachable", async () => {
      const lib = await init();
      const hosting = lib.host();
      sockets[0].onclose();

      await expect(hosting).rejects.toThrow("could not reach the signaling server");
      expect(lib.isHost).toBe(false);
      await expect(host(lib)).resolves.toBeDefined();
    });
  });

  describe("join", () => {
    it("should open the four channels to the host of the room", async () => {
      const lib = await init();
      await join(lib);

      expect(sockets[0].url).toBe("ws://127.0.0.1:9000/?room=ABC234");
      expect(dataChannels.map((channel) => channel.label)).toStrictEqual([
        "reliable-ordered",
        "reliable-unordered",
        "unreliable-ordered",
        "unreliable-unordered",
      ]);
      expect(lib.clientId).toBe("client-7");
      expect(lib.isHost).toBe(false);
      expect(lib.server).toBeUndefined();
      expect(lib.isConnected()).toBe(true);

      lib.packets.send(Play);
      expect(dataChannels[0].send).toHaveBeenCalledWith(
        new Uint8Array([4, ...new TextEncoder().encode("play")]),
      );
    });

    it("should not let a join abandoned by leave() end the next session", async () => {
      const lib = await init();
      const joining = lib.join("ABC234");
      const rejection = expect(joining).rejects.toThrow("could not connect to the server");
      await new Promise((resolve) => setTimeout(resolve));
      const abandoned = sockets[0];
      lib.leave();
      const server = await host(lib);
      abandoned.onclose({ code: 1000 });

      await rejection;
      expect(sockets[1].close).not.toHaveBeenCalled();
      expect(lib.server).toBe(server);
    });

    it("should reject when the channels never open", async () => {
      vi.useFakeTimers();
      vi.spyOn(console, "error").mockImplementation(() => {});
      dataChannelState = "connecting";
      const lib = await init();
      const joining = lib.join("ABC234");
      const rejection = expect(joining).rejects.toThrow("could not connect to the server");

      await vi.advanceTimersByTimeAsync(10_000);
      await rejection;
      expect(sockets[0].close).toHaveBeenCalled();
      expect(lib.isConnected()).toBe(false);
    });
  });

  describe("leave", () => {
    it("should close every connection and allow hosting again", async () => {
      const lib = await init();
      await join(lib);

      lib.leave();
      expect(sockets[0].close).toHaveBeenCalled();
      expect(lib.isConnected()).toBe(false);
      expect(lib.clientId).toBeUndefined();
      await expect(host(lib)).resolves.toBeDefined();
    });

    it("should leave on __clear", async () => {
      const lib = await init();
      await host(lib);

      await lib.__clear(ctx);
      expect(sockets[0].close).toHaveBeenCalled();
      expect(lib.isHost).toBe(false);
    });
  });

  describe("expose", () => {
    it("should reflect the live state", async () => {
      const lib = await init();
      const api = lib.expose();
      expect(api.isHost).toBe(false);

      const server = await host(lib);
      expect(api.isHost).toBe(true);
      expect(api.server).toBe(server);
      expect(api.room).toBe("ABC234");
      expect(api.clientId).toBe(lib.clientId);
      expect(api.packets).toBe(lib.packets);
      expect(api.isConnected()).toBe(true);
    });
  });
});
