import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UDPClient } from "../../src/client/udp.client.network";
import { Channel, PacketSequencer } from "../../src/shared/channels";

const welcome = { type: "welcome", id: "client-0", token: "t0k3n" };

/** Stand-in for an `RTCDataChannel` returned by `createDataChannel`. */
const makeDataChannel = (label: string) => ({
  label,
  readyState: "connecting",
  binaryType: "",
  send: vi.fn(),
  onopen: null as any,
  onmessage: null as any,
  onerror: null as any,
  onclose: null as any,
});

describe("UDPClient", () => {
  let ws: any;
  let pc: any;
  let channels: Map<string, ReturnType<typeof makeDataChannel>>;

  /** Connect, then have the server send its welcome on the signaling socket. */
  const connectWelcomed = async (client: UDPClient) => {
    const connecting = client.connect();
    await ws.onmessage({ data: JSON.stringify(welcome) });
    await connecting;
  };

  beforeEach(() => {
    vi.stubGlobal(
      "WebSocket",
      Object.assign(
        vi.fn(function () {
          return (ws = {
            readyState: 0,
            binaryType: "",
            send: vi.fn(),
            onerror: null,
            onopen: null,
            onmessage: null,
            onclose: null,
          });
        }),
        { OPEN: 1 },
      ),
    );

    channels = new Map();
    vi.stubGlobal(
      "RTCPeerConnection",
      vi.fn(function () {
        return (pc = {
          createDataChannel: vi.fn((label: string) => {
            const channel = makeDataChannel(label);
            channels.set(label, channel);
            return channel;
          }),
          onicecandidate: null,
          remoteDescription: null as unknown,
          createOffer: vi.fn().mockResolvedValue({}),
          setLocalDescription: vi.fn().mockResolvedValue(undefined),
          setRemoteDescription: vi.fn(async (description: unknown) => {
            pc.remoteDescription = description;
          }),
          addIceCandidate: vi.fn().mockResolvedValue(undefined),
        });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("before connect", () => {
    it("should report not connected before connect is called", () => {
      const client = new UDPClient(8081, "127.0.0.1", false);
      expect(client.isConnected(Channel.UnreliableOrdered)).toBe(false);
      expect(client.isConnected(Channel.UnreliableUnordered)).toBe(false);
    });

    it("should return no received packets before any data arrives", () => {
      const client = new UDPClient(8081, "127.0.0.1", false);
      expect(client.getReceivedPackets(Channel.UnreliableUnordered)).toStrictEqual([]);
    });

    it("should not throw when sendData is called before connect", () => {
      const client = new UDPClient(8081, "127.0.0.1", false);
      vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() =>
        client.sendData(Channel.UnreliableUnordered, new Uint8Array([1, 2, 3])),
      ).not.toThrow();
    });
  });
  describe("channels", () => {
    it("should open one unordered, unretransmitted data channel per unreliable channel", async () => {
      const client = new UDPClient(8081, "127.0.0.1", false);
      await connectWelcomed(client);

      expect(pc.createDataChannel.mock.calls).toStrictEqual([
        ["unreliable-ordered", { ordered: false, maxRetransmits: 0 }],
        ["unreliable-unordered", { ordered: false, maxRetransmits: 0 }],
      ]);
    });

    it("should report each channel connected once its data channel opens", async () => {
      const client = new UDPClient(8081, "127.0.0.1", false);
      await connectWelcomed(client);
      channels.get("unreliable-unordered")!.readyState = "open";

      expect(client.isConnected(Channel.UnreliableUnordered)).toBe(true);
      expect(client.isConnected(Channel.UnreliableOrdered)).toBe(false);
    });

    it("should send unordered payloads as they are", async () => {
      const client = new UDPClient(8081, "127.0.0.1", false);
      await connectWelcomed(client);
      client.sendData(Channel.UnreliableUnordered, new Uint8Array([1, 2]));

      expect(channels.get("unreliable-unordered")!.send).toHaveBeenCalledWith(
        new Uint8Array([1, 2]),
      );
      expect(channels.get("unreliable-ordered")!.send).not.toHaveBeenCalled();
    });

    it("should number ordered payloads", async () => {
      const client = new UDPClient(8081, "127.0.0.1", false);
      await connectWelcomed(client);
      client.sendData(Channel.UnreliableOrdered, new Uint8Array([7]));
      client.sendData(Channel.UnreliableOrdered, new Uint8Array([8]));

      expect(channels.get("unreliable-ordered")!.send.mock.calls).toStrictEqual([
        [new Uint8Array([0, 0, 0, 0, 7])],
        [new Uint8Array([0, 0, 0, 1, 8])],
      ]);
    });

    it("should keep packets of each channel apart", async () => {
      const client = new UDPClient(8081, "127.0.0.1", false);
      await connectWelcomed(client);
      const sender = new PacketSequencer();

      channels.get("unreliable-unordered")!.onmessage({ data: new Uint8Array([1]).buffer });
      channels
        .get("unreliable-ordered")!
        .onmessage({ data: sender.wrap(new Uint8Array([2])).buffer });

      expect(client.getReceivedPackets(Channel.UnreliableUnordered)).toStrictEqual([
        new Uint8Array([1]),
      ]);
      expect(client.getReceivedPackets(Channel.UnreliableOrdered)).toStrictEqual([
        new Uint8Array([2]),
      ]);
      expect(client.getReceivedPackets(Channel.UnreliableOrdered)).toStrictEqual([]);
    });

    it("should drop late ordered packets", async () => {
      const client = new UDPClient(8081, "127.0.0.1", false);
      await connectWelcomed(client);
      const sender = new PacketSequencer();
      const first = sender.wrap(new Uint8Array([1]));
      const second = sender.wrap(new Uint8Array([2]));

      const channel = channels.get("unreliable-ordered")!;
      channel.onmessage({ data: second.buffer });
      channel.onmessage({ data: first.buffer });

      expect(client.getReceivedPackets(Channel.UnreliableOrdered)).toStrictEqual([
        new Uint8Array([2]),
      ]);
    });

    it("should stop sending on a channel once its data channel closes", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const client = new UDPClient(8081, "127.0.0.1", false);
      await connectWelcomed(client);
      const channel = channels.get("unreliable-unordered")!;
      channel.onclose();

      client.sendData(Channel.UnreliableUnordered, new Uint8Array([1]));
      expect(channel.send).not.toHaveBeenCalled();
    });
  });

  describe("ice candidates", () => {
    const candidate = { candidate: "candidate:1" };

    it("should queue candidates received before the answer", async () => {
      const client = new UDPClient(8081, "127.0.0.1", false);
      await connectWelcomed(client);
      await ws.onmessage({ data: JSON.stringify({ type: "ice", candidate }) });

      expect(pc.addIceCandidate).not.toHaveBeenCalled();

      await ws.onmessage({ data: JSON.stringify({ type: "answer", answer: { type: "answer" } }) });
      expect(pc.addIceCandidate).toHaveBeenCalledWith(candidate);
    });

    it("should apply candidates directly once the answer is set", async () => {
      const client = new UDPClient(8081, "127.0.0.1", false);
      await connectWelcomed(client);
      await ws.onmessage({ data: JSON.stringify({ type: "answer", answer: { type: "answer" } }) });
      await ws.onmessage({ data: JSON.stringify({ type: "ice", candidate }) });

      expect(pc.addIceCandidate).toHaveBeenCalledTimes(1);
      expect(pc.addIceCandidate).toHaveBeenCalledWith(candidate);
    });
  });

  describe("ice servers", () => {
    it("should create the peer connection without ice servers by default", async () => {
      const client = new UDPClient(8081, "127.0.0.1", false);
      await connectWelcomed(client);
      expect(RTCPeerConnection).toHaveBeenCalledWith({ iceServers: [] });
    });

    it("should create the peer connection with the configured ice servers", async () => {
      const iceServers = [{ urls: "stun:stun.example.com:3478" }];
      const client = new UDPClient(8081, "127.0.0.1", false, iceServers);
      await connectWelcomed(client);
      expect(RTCPeerConnection).toHaveBeenCalledWith({ iceServers });
    });
  });

  describe("session", () => {
    it("should store the client id and token from the welcome", async () => {
      const session = {};
      const client = new UDPClient(8081, "127.0.0.1", false, [], session);
      await connectWelcomed(client);

      expect(client.getClientId()).toBe("client-0");
      expect(session).toStrictEqual({ id: "client-0", token: "t0k3n" });
    });

    it("should join the TCP session with its token", async () => {
      const client = new UDPClient(8081, "127.0.0.1", false, [], { token: "t0k3n" });
      await connectWelcomed(client);
      expect(vi.mocked(WebSocket)).toHaveBeenCalledWith("ws://127.0.0.1:8081/?token=t0k3n");
    });

    it("should reject, without a pending timer, when the offer fails", async () => {
      vi.useFakeTimers();
      vi.mocked(RTCPeerConnection).mockImplementationOnce(function () {
        throw new Error("no webrtc");
      });
      const client = new UDPClient(8081, "127.0.0.1", false);

      await expect(client.connect()).rejects.toThrow("no webrtc");
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should reject when the signaling socket closes before the welcome", async () => {
      const client = new UDPClient(8081, "127.0.0.1", false);
      const connecting = client.connect();
      ws.onclose();

      await expect(connecting).rejects.toThrow("UDP signaling closed before the server welcome");
    });

    it("should reject when the signaling socket errors before the welcome", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const client = new UDPClient(8081, "127.0.0.1", false);
      const connecting = client.connect();
      ws.onerror(new Event("error"));

      await expect(connecting).rejects.toThrow("UDP connection error");
    });
  });
});
