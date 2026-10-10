import type { Context, InitContext } from "@nanoforge-dev/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Channel, NetworkClientLibrary, NetworkData, definePacket } from "../../src/client";
import { encodeTypedPacket } from "../../src/shared/packet";

const makeInitContext = (env: Record<string, string>): InitContext => ({
  vars: { get: () => undefined, set: () => {} },
  env,
  files: new Map(),
});

const welcome = { type: "welcome", id: "client-0", token: "t0k3n" };

const tcpOnly = { SERVER_TCP_PORT: "8080", SERVER_ADDRESS: "127.0.0.1" };
const udpOnly = { SERVER_UDP_PORT: "8081", SERVER_ADDRESS: "127.0.0.1" };
const both = { SERVER_TCP_PORT: "8080", SERVER_UDP_PORT: "8081", SERVER_ADDRESS: "127.0.0.1" };

const utf8 = (text: string) => new TextEncoder().encode(text);

/** The payload bytes of each received packet. */
const bytesOf = (packets: NetworkData[]) => packets.map((packet) => packet.bytes());

/** The mocked TCP socket, the first WebSocket opened when TCP is configured. */
const tcpSocket = () => vi.mocked(WebSocket).mock.instances[0] as any;

/** The mocked data channel labelled `label`. */
const dataChannel = (label: string) =>
  (vi.mocked(RTCPeerConnection).mock.instances[0] as any).createDataChannel.mock.results.find(
    ({ value }: { value: { label: string } }) => value.label === label,
  )?.value;

describe("NetworkClientLibrary", () => {
  /** How the server answers each socket opened by the test, in order. Defaults to a welcome. */
  let answers: ("welcome" | "close")[];
  /** `readyState` of the data channels the client creates. */
  let dataChannelState: string;

  beforeEach(() => {
    answers = [];
    dataChannelState = "open";
    vi.stubGlobal(
      "WebSocket",
      Object.assign(
        vi.fn(function (this: any) {
          this.readyState = 0;
          this.binaryType = "";
          this.send = vi.fn();
          this.onerror = null;
          this.onopen = null;
          this.onmessage = null;
          this.onclose = null;
          const answer = answers.shift() ?? "welcome";
          setTimeout(() => {
            if (answer === "close") return this.onclose?.();
            this.readyState = 1;
            this.onmessage?.({ data: JSON.stringify(welcome) });
          });
        }),
        { OPEN: 1 },
      ),
    );

    vi.stubGlobal(
      "RTCPeerConnection",
      vi.fn(function (this: any) {
        this.onicecandidate = null;
        this.createDataChannel = vi.fn(function (this: any, label: string) {
          return {
            label,
            readyState: dataChannelState,
            send: vi.fn(),
            onopen: null,
            onmessage: null,
            onerror: null,
            onclose: null,
          };
        });
        this.createOffer = vi.fn().mockResolvedValue({});
        this.setLocalDescription = vi.fn().mockResolvedValue(undefined);
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("metadata", () => {
    it("should expose the reserved 'network' key", () => {
      expect(new NetworkClientLibrary().key).toBe("network");
    });
  });

  describe("config validation", () => {
    it("should throw when neither TCP nor UDP port is provided", async () => {
      const ctx = makeInitContext({ SERVER_ADDRESS: "127.0.0.1" });
      await expect(new NetworkClientLibrary().__init(ctx)).rejects.toThrow();
    });
  });

  describe("initialization", () => {
    it("should initialize a TCP client when only SERVER_TCP_PORT is provided", async () => {
      const ctx = makeInitContext({
        SERVER_TCP_PORT: "8080",
        SERVER_ADDRESS: "127.0.0.1",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);
      expect(() => lib.sendData(new Uint8Array([1]))).not.toThrow();
      expect(() =>
        lib.sendData(new Uint8Array([1]), { channel: Channel.UnreliableOrdered }),
      ).toThrow("Channel unreliable-ordered needs SERVER_UDP_PORT to be set");
    });

    it("should hand ICE_SERVERS from the environment to the peer connection", async () => {
      const ctx = makeInitContext({
        SERVER_UDP_PORT: "8081",
        SERVER_ADDRESS: "127.0.0.1",
        ICE_SERVERS: "stun:stun.example.com:3478",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);
      expect(RTCPeerConnection).toHaveBeenCalledWith({
        iceServers: [{ urls: "stun:stun.example.com:3478" }],
      });
    });

    it("should initialize a UDP client when only SERVER_UDP_PORT is provided", async () => {
      const ctx = makeInitContext({
        SERVER_UDP_PORT: "8081",
        SERVER_ADDRESS: "127.0.0.1",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);
      expect(() =>
        lib.sendData(new Uint8Array([1]), { channel: Channel.UnreliableUnordered }),
      ).not.toThrow();
      expect(() => lib.sendData(new Uint8Array([1]))).toThrow(
        "Channel reliable-ordered needs SERVER_TCP_PORT to be set",
      );
    });

    it("should initialize both TCP and UDP clients when both ports are provided", async () => {
      const ctx = makeInitContext({
        SERVER_TCP_PORT: "8080",
        SERVER_UDP_PORT: "8081",
        SERVER_ADDRESS: "127.0.0.1",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);
      expect(() => lib.sendData(new Uint8Array([1]))).not.toThrow();
      expect(() =>
        lib.sendData(new Uint8Array([1]), { channel: Channel.UnreliableUnordered }),
      ).not.toThrow();
    });

    it("should link UDP to the session received over TCP", async () => {
      const ctx = makeInitContext({
        SERVER_TCP_PORT: "8080",
        SERVER_UDP_PORT: "8081",
        SERVER_ADDRESS: "127.0.0.1",
      });
      const lib = new NetworkClientLibrary();
      await lib.__init(ctx);

      expect(vi.mocked(WebSocket).mock.calls.map(([url]) => url)).toStrictEqual([
        "ws://127.0.0.1:8080",
        "ws://127.0.0.1:8081/?token=t0k3n",
      ]);
      expect(lib.clientId).toBe("client-0");
    });

    it("should still connect UDP, without a token, when TCP fails, then reject", async () => {
      answers = ["close"];
      const ctx = makeInitContext({
        SERVER_TCP_PORT: "8080",
        SERVER_UDP_PORT: "8081",
        SERVER_ADDRESS: "127.0.0.1",
      });
      const lib = new NetworkClientLibrary();

      await expect(lib.__init(ctx)).rejects.toThrow(
        "NetworkClientLibrary: could not connect to the server",
      );
      expect(vi.mocked(WebSocket).mock.calls[1]?.[0]).toBe("ws://127.0.0.1:8081");
      expect(lib.clientId).toBe("client-0");
    });

    it("should default WSS when not provided", async () => {
      const ctx = makeInitContext({ SERVER_TCP_PORT: "8080", SERVER_ADDRESS: "127.0.0.1" });
      const lib = new NetworkClientLibrary();
      await expect(lib.__init(ctx)).resolves.toBeUndefined();
    });
  });

  describe("connection", () => {
    it("should open only the configured transports during __init", async () => {
      await new NetworkClientLibrary().__init(makeInitContext(udpOnly));

      expect(vi.mocked(WebSocket).mock.calls.map(([url]) => url)).toStrictEqual([
        "ws://127.0.0.1:8081",
      ]);
    });

    it("should open all four channels by default when both ports are configured", async () => {
      const lib = new NetworkClientLibrary();
      await lib.__init(makeInitContext(both));

      expect(Object.values(Channel).map((channel) => lib.isConnected({ channel }))).toStrictEqual([
        true,
        true,
        true,
        true,
      ]);
    });

    it("should wait until every channel is open", async () => {
      dataChannelState = "connecting";
      const lib = new NetworkClientLibrary();

      let initialized = false;
      const init = lib.__init(makeInitContext(udpOnly)).then(() => (initialized = true));
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(initialized).toBe(false);

      dataChannel("unreliable-ordered").readyState = "open";
      dataChannel("unreliable-unordered").readyState = "open";
      await init;
      expect(initialized).toBe(true);
    });

    it("should reject when the channels are not open in time", async () => {
      dataChannelState = "connecting";
      vi.useFakeTimers();

      const init = new NetworkClientLibrary().__init(makeInitContext(udpOnly));
      const rejection = expect(init).rejects.toThrow(
        "channels unreliable-ordered, unreliable-unordered not open after 10000ms",
      );
      await vi.advanceTimersByTimeAsync(10_000);
      await rejection;
    });
  });

  describe("channels", () => {
    it("should send on ReliableOrdered when no channel is given", async () => {
      const lib = new NetworkClientLibrary();
      await lib.__init(makeInitContext(tcpOnly));

      lib.sendData(new Uint8Array([1]));
      expect(tcpSocket().send).toHaveBeenCalledWith(new Uint8Array([0, 0, 1]));
    });

    it("should send each reliable channel over the same TCP socket", async () => {
      const lib = new NetworkClientLibrary();
      await lib.__init(makeInitContext(tcpOnly));

      lib.sendData(new Uint8Array([1]), { channel: Channel.ReliableOrdered });
      lib.sendData(new Uint8Array([2]), { channel: Channel.ReliableUnordered });

      expect(tcpSocket().send.mock.calls).toStrictEqual([
        [new Uint8Array([0, 0, 1])],
        [new Uint8Array([1, 0, 2])],
      ]);
    });

    it("should send strings as UTF-8 and other values as JSON", async () => {
      const lib = new NetworkClientLibrary();
      await lib.__init(makeInitContext(both));

      lib.sendData({ type: "play" });
      lib.sendData("hi", { channel: Channel.UnreliableUnordered });

      expect(tcpSocket().send).toHaveBeenCalledWith(
        new Uint8Array([0, 0, ...utf8('{"type":"play"}')]),
      );
      expect(dataChannel("unreliable-unordered").send).toHaveBeenCalledWith(
        new Uint8Array([0, ...utf8("hi")]),
      );
    });

    it("should open one data channel per unreliable channel", async () => {
      const lib = new NetworkClientLibrary();
      await lib.__init(makeInitContext(udpOnly));

      const peerConnection = vi.mocked(RTCPeerConnection).mock.instances[0] as any;
      expect(
        peerConnection.createDataChannel.mock.calls.map(([label]: [string]) => label),
      ).toStrictEqual(["unreliable-ordered", "unreliable-unordered"]);
    });

    it("should send unreliable channels on their own data channel", async () => {
      const lib = new NetworkClientLibrary();
      await lib.__init(makeInitContext(udpOnly));

      lib.sendData(new Uint8Array([3]), { channel: Channel.UnreliableUnordered });
      expect(dataChannel("unreliable-unordered").send).toHaveBeenCalledWith(new Uint8Array([0, 3]));
      expect(dataChannel("unreliable-ordered").send).not.toHaveBeenCalled();
    });

    it("should read one channel, or every channel with reliable ones first", async () => {
      const lib = new NetworkClientLibrary();
      await lib.__init(makeInitContext(both));

      dataChannel("unreliable-unordered").onmessage({ data: new Uint8Array([0, 9]).buffer });
      tcpSocket().onmessage({ data: new Uint8Array([1, 0, 2]).buffer });
      tcpSocket().onmessage({ data: new Uint8Array([0, 0, 1]).buffer });

      expect(bytesOf(lib.getReceivedPackets({ channel: Channel.ReliableUnordered }))).toStrictEqual(
        [new Uint8Array([2])],
      );
      expect(bytesOf(lib.getReceivedPackets())).toStrictEqual([
        new Uint8Array([1]),
        new Uint8Array([9]),
      ]);
      expect(lib.getReceivedPackets()).toStrictEqual([]);
    });

    it("should return packets that read back as JSON", async () => {
      const lib = new NetworkClientLibrary();
      await lib.__init(makeInitContext(tcpOnly));

      tcpSocket().onmessage({ data: new Uint8Array([0, 0, ...utf8('{"type":"move"}')]).buffer });

      const [packet] = lib.getReceivedPackets();
      expect(packet).toBeInstanceOf(NetworkData);
      expect(packet?.json()).toStrictEqual({ type: "move" });
    });

    it("should report connected only once every configured channel is", async () => {
      const lib = new NetworkClientLibrary();
      await lib.__init(makeInitContext(both));
      tcpSocket().readyState = 1;
      dataChannel("unreliable-ordered").readyState = "connecting";

      expect(lib.isConnected({ channel: Channel.ReliableOrdered })).toBe(true);
      expect(lib.isConnected({ channel: Channel.UnreliableOrdered })).toBe(false);
      expect(lib.isConnected()).toBe(false);

      dataChannel("unreliable-ordered").readyState = "open";
      expect(lib.isConnected()).toBe(true);
    });

    it("should report not connected before init", () => {
      expect(new NetworkClientLibrary().isConnected()).toBe(false);
    });
  });

  describe("packets", () => {
    const ctx = {} as Context;
    const Move = definePacket<{ x: number }>("move", { channel: Channel.UnreliableUnordered });
    const Play = definePacket("play");

    /** Deliver a typed packet as the server would, on a reliable channel or a data channel. */
    const receive = (packet: Uint8Array, channel: Channel) =>
      channel === Channel.UnreliableUnordered
        ? dataChannel(channel).onmessage({ data: packet.slice().buffer })
        : tcpSocket().onmessage({ data: new Uint8Array([0, ...packet]).buffer });

    it("should dispatch typed packets in __run, reliable ones first", async () => {
      const lib = new NetworkClientLibrary();
      await lib.__init(makeInitContext(both));
      const calls: unknown[] = [];
      lib.packets.on(Move, (move, info) => calls.push([move, info]));
      lib.packets.on(Play, (play, info) => calls.push([play, info]));

      receive(encodeTypedPacket(Move, { x: 1 }), Channel.UnreliableUnordered);
      receive(encodeTypedPacket(Play, undefined), Channel.ReliableOrdered);
      tcpSocket().onmessage({ data: new Uint8Array([0, 0, 7]).buffer });
      expect(calls).toStrictEqual([]);

      await lib.__run(ctx);
      expect(calls).toStrictEqual([
        [undefined, { channel: Channel.ReliableOrdered, ctx }],
        [{ x: 1 }, { channel: Channel.UnreliableUnordered, ctx }],
      ]);
      expect(lib.packets.read(Move)).toStrictEqual([
        { channel: Channel.UnreliableUnordered, data: { x: 1 } },
      ]);
      expect(bytesOf(lib.getReceivedPackets())).toStrictEqual([new Uint8Array([7])]);
    });

    it("should keep typed packets out of getReceivedPackets until __run", async () => {
      const lib = new NetworkClientLibrary();
      await lib.__init(makeInitContext(tcpOnly));
      const listener = vi.fn();
      lib.packets.on(Play, listener);

      receive(encodeTypedPacket(Play, undefined), Channel.ReliableOrdered);
      expect(lib.getReceivedPackets()).toStrictEqual([]);
      await lib.__run(ctx);
      expect(listener).toHaveBeenCalledOnce();
    });

    it("should drop sendData packets left unread for a whole tick", async () => {
      const lib = new NetworkClientLibrary();
      await lib.__init(makeInitContext(tcpOnly));

      tcpSocket().onmessage({ data: new Uint8Array([0, 0, 1]).buffer });
      await lib.__run(ctx);
      expect(bytesOf(lib.getReceivedPackets())).toStrictEqual([new Uint8Array([1])]);

      tcpSocket().onmessage({ data: new Uint8Array([0, 0, 2]).buffer });
      await lib.__run(ctx);
      await lib.__run(ctx);
      expect(lib.getReceivedPackets()).toStrictEqual([]);
    });

    it("should not lose packets drained by a listener", async () => {
      const lib = new NetworkClientLibrary();
      await lib.__init(makeInitContext(tcpOnly));
      const listener = vi.fn(() => {
        receive(encodeTypedPacket(Play, undefined), Channel.ReliableOrdered);
        lib.getReceivedPackets();
      });
      lib.packets.on(Play, listener);

      receive(encodeTypedPacket(Play, undefined), Channel.ReliableOrdered);
      await lib.__run(ctx);
      await lib.__run(ctx);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it("should send on the definition's channel unless another is given", async () => {
      const lib = new NetworkClientLibrary();
      await lib.__init(makeInitContext(both));

      lib.packets.send(Move, { x: 1 });
      lib.packets.send(Play, undefined, { channel: Channel.ReliableUnordered });
      expect(dataChannel("unreliable-unordered").send).toHaveBeenCalledWith(
        encodeTypedPacket(Move, { x: 1 }),
      );
      expect(tcpSocket().send).toHaveBeenCalledWith(
        new Uint8Array([1, ...encodeTypedPacket(Play, undefined)]),
      );
    });

    it("should run before the ECS", () => {
      expect(new NetworkClientLibrary().relationships.runAfter).toStrictEqual(["ecs"]);
    });
  });

  describe("expose", () => {
    it("delegates to the library", async () => {
      const lib = new NetworkClientLibrary();
      await lib.__init(makeInitContext(tcpOnly));
      const api = lib.expose();

      api.sendData(new Uint8Array([5]), { channel: Channel.ReliableUnordered });
      expect(tcpSocket().send).toHaveBeenCalledWith(new Uint8Array([1, 0, 5]));
      expect(api.getReceivedPackets()).toStrictEqual([]);
      expect(() => api.isConnected({ channel: Channel.UnreliableOrdered })).toThrow(
        "SERVER_UDP_PORT",
      );
      expect(api.clientId).toBe("client-0");
      expect(api.packets).toBe(lib.packets);
    });
  });
});
