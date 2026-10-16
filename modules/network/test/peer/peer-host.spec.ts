import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PeerHost } from "../../src/peer/peer-host";
import { ClientRegistry } from "../../src/server/client-registry";
import { CHANNELS, Channel, PacketSequencer } from "../../src/shared/channels";

/** Stand-in for a data channel a joiner opened, labelled `label`. */
const makeDataChannel = (label: string) => ({
  label,
  readyState: "connecting",
  binaryType: "",
  send: vi.fn(),
  close: vi.fn(),
  onopen: null as null | (() => void),
  onmessage: null as null | ((event: { data: unknown }) => void),
  onclose: null as null | (() => void),
  onerror: null as null | ((event: unknown) => void),
});

describe("PeerHost", () => {
  let socket: any;
  let peers: any[];
  /** Resolves the pending `setRemoteDescription`, to hold the offer handler mid-await. */
  let applyRemote: () => void;
  let registry: ClientRegistry;

  beforeEach(() => {
    let nextId = 0;
    vi.spyOn(crypto, "randomUUID").mockImplementation(
      () => `client-${nextId++}` as ReturnType<typeof crypto.randomUUID>,
    );
    peers = [];
    vi.stubGlobal(
      "WebSocket",
      Object.assign(
        vi.fn(function () {
          return (socket = {
            readyState: 1,
            send: vi.fn(),
            close: vi.fn(),
            onerror: null,
            onclose: null,
            onmessage: null,
          });
        }),
        { OPEN: 1 },
      ),
    );
    vi.stubGlobal(
      "RTCPeerConnection",
      vi.fn(function () {
        const pc: any = {
          remoteDescription: null,
          localDescription: null,
          connectionState: "new",
          onicecandidate: null,
          onconnectionstatechange: null,
          ondatachannel: null,
          setRemoteDescription: vi.fn(
            (description: unknown) =>
              new Promise<void>((resolve) => {
                applyRemote = () => {
                  pc.remoteDescription = description;
                  resolve();
                };
              }),
          ),
          addIceCandidate: vi.fn().mockResolvedValue(undefined),
          createAnswer: vi.fn().mockResolvedValue({ type: "answer", sdp: "v=0 answer" }),
          setLocalDescription: vi.fn(async (description: unknown) => {
            pc.localDescription = description;
          }),
          close: vi.fn(),
        };
        peers.push(pc);
        return pc;
      }),
    );
    registry = new ClientRegistry();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const fromServer = (message: unknown) => socket.onmessage({ data: JSON.stringify(message) });
  const fromJoiner = (from: string, data: unknown) => fromServer({ type: "signal", from, data });
  const sent = () => socket.send.mock.calls.map(([frame]: [string]) => JSON.parse(frame));
  const flush = () => new Promise((resolve) => setTimeout(resolve));

  const openHost = async () => {
    const host = new PeerHost(registry, [{ urls: "stun:stun.example.com" }]);
    const opening = host.open("ws://127.0.0.1:9000");
    fromServer({ type: "room", room: "ABC234" });
    expect(await opening).toBe("ABC234");
    return host;
  };

  /** Run a joiner's offer through to its four open data channels. */
  const connectJoiner = async (host: PeerHost, from = "joiner-a") => {
    fromJoiner(from, { type: "offer", offer: { type: "offer", sdp: "v=0" } });
    const pc = peers.at(-1);
    applyRemote();
    await flush();
    const channels = CHANNELS.map((label) => makeDataChannel(label));
    for (const channel of channels) pc.ondatachannel({ channel });
    for (const channel of channels) {
      channel.readyState = "open";
      channel.onopen?.();
    }
    const welcome = sent().find((frame: any) => frame.data.type === "welcome");
    return { pc, channels, id: welcome?.data.id as string, host };
  };

  describe("signaling", () => {
    it("should resolve the room the signaling server gives", async () => {
      await openHost();
      expect(WebSocket).toHaveBeenCalledWith("ws://127.0.0.1:9000");
    });

    it("should reject when the signaling socket closes before a room", async () => {
      const opening = new PeerHost(registry).open("ws://127.0.0.1:9000");
      socket.onclose();
      await expect(opening).rejects.toThrow("Signaling closed before giving a room");
    });

    it("should answer a joiner's offer through the signaling server", async () => {
      await openHost();
      fromJoiner("joiner-a", { type: "offer", offer: { type: "offer", sdp: "v=0" } });
      applyRemote();
      await flush();

      expect(RTCPeerConnection).toHaveBeenCalledWith({
        iceServers: [{ urls: "stun:stun.example.com" }],
      });
      expect(sent()).toStrictEqual([
        {
          type: "signal",
          to: "joiner-a",
          data: { type: "answer", answer: { type: "answer", sdp: "v=0 answer" } },
        },
      ]);
    });

    it("should queue ICE candidates that arrive while the offer is being applied", async () => {
      await openHost();
      fromJoiner("joiner-a", { type: "offer", offer: { type: "offer", sdp: "v=0" } });
      fromJoiner("joiner-a", { type: "ice", candidate: { candidate: "c1" } });
      const pc = peers[0];
      expect(peers).toHaveLength(1);
      expect(pc.addIceCandidate).not.toHaveBeenCalled();

      applyRemote();
      await flush();
      fromJoiner("joiner-a", { type: "ice", candidate: { candidate: "c2" } });
      expect(pc.addIceCandidate.mock.calls).toStrictEqual([
        [{ candidate: "c1" }],
        [{ candidate: "c2" }],
      ]);
    });

    it("should trickle the host's ICE candidates to the joiner", async () => {
      await openHost();
      fromJoiner("joiner-a", { type: "offer", offer: { type: "offer", sdp: "v=0" } });
      peers[0].onicecandidate({ candidate: { candidate: "h1" } });

      expect(sent()).toStrictEqual([
        { type: "signal", to: "joiner-a", data: { type: "ice", candidate: { candidate: "h1" } } },
      ]);
    });

    it("should not open a peer connection before a joiner's offer", async () => {
      await openHost();
      fromJoiner("joiner-a", {});
      fromJoiner("joiner-a", { type: "ice", candidate: { candidate: "c1" } });
      expect(peers).toHaveLength(0);
    });

    it("should drop a joiner rather than send a frame the server would refuse", async () => {
      await openHost();
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      fromJoiner("joiner-a", { type: "offer", offer: { type: "offer", sdp: "v=0" } });
      peers[0].createAnswer.mockResolvedValue({ type: "answer", sdp: "a".repeat(64 * 1024) });
      applyRemote();
      await flush();

      expect(socket.send).not.toHaveBeenCalled();
      expect(peers[0].close).toHaveBeenCalled();
      expect(error).toHaveBeenCalledWith(expect.stringContaining("too large"));
    });

    it("should forget its room when the signaling socket closes", async () => {
      const host = await openHost();
      expect(host.room).toBe("ABC234");
      socket.onclose();
      expect(host.room).toBeUndefined();
    });

    it("should ignore frames that are not objects", async () => {
      await openHost();
      fromJoiner("joiner-a", "offer");
      socket.onmessage({ data: "{not json" });
      expect(peers).toHaveLength(0);
    });
  });

  describe("joiners", () => {
    it("should welcome a joiner, and connect it, once its four channels are open", async () => {
      const host = await openHost();
      const connected = vi.fn();
      registry.onConnect(connected);
      fromJoiner("joiner-a", { type: "offer", offer: { type: "offer", sdp: "v=0" } });
      applyRemote();
      await flush();
      const channels = CHANNELS.map((label) => makeDataChannel(label));
      for (const channel of channels) peers[0].ondatachannel({ channel });
      for (const channel of channels.slice(0, 3)) {
        channel.readyState = "open";
        channel.onopen?.();
      }
      expect(connected).not.toHaveBeenCalled();
      expect(host.getConnectedClients(Channel.ReliableOrdered)).toStrictEqual([]);

      channels[3]!.readyState = "open";
      channels[3]!.onopen?.();
      expect(sent().at(-1)).toStrictEqual({
        type: "signal",
        to: "joiner-a",
        data: { type: "welcome", id: "client-0", token: expect.any(String) },
      });
      expect(connected).toHaveBeenCalledWith(
        expect.objectContaining({ id: "client-0", transports: { peer: expect.anything() } }),
      );
      expect(host.getConnectedClients(Channel.ReliableOrdered)).toStrictEqual(["client-0"]);
      expect(channels.map((channel) => channel.binaryType)).toStrictEqual(
        CHANNELS.map(() => "arraybuffer"),
      );
    });

    it("should let the connect listeners send to the new joiner", async () => {
      const host = await openHost();
      registry.onConnect(({ id }) =>
        host.sendToClient(Channel.ReliableOrdered, id, new Uint8Array([9])),
      );
      const { channels } = await connectJoiner(host);

      expect(channels[0]!.send).toHaveBeenCalledWith(new Uint8Array([9]));
    });

    it("should close a data channel with an unknown label", async () => {
      await openHost();
      fromJoiner("joiner-a", { type: "offer", offer: { type: "offer", sdp: "v=0" } });
      vi.spyOn(console, "error").mockImplementation(() => {});
      const chat = makeDataChannel("chat");
      peers[0].ondatachannel({ channel: chat });
      expect(chat.close).toHaveBeenCalled();
    });

    it("should send and receive on each channel, sequencing UnreliableOrdered", async () => {
      const host = await openHost();
      const { channels, id } = await connectJoiner(host);
      const [reliable, , ordered] = channels;

      host.sendToClient(Channel.ReliableOrdered, id, new Uint8Array([1]));
      host.sendToEverybody(Channel.UnreliableOrdered, new Uint8Array([2]));
      expect(reliable!.send).toHaveBeenCalledWith(new Uint8Array([1]));
      expect(ordered!.send).toHaveBeenCalledWith(new PacketSequencer().wrap(new Uint8Array([2])));

      const sequencer = new PacketSequencer();
      const first = sequencer.wrap(new Uint8Array([7]));
      const second = sequencer.wrap(new Uint8Array([8]));
      reliable!.onmessage?.({ data: new Uint8Array([5]).buffer });
      ordered!.onmessage?.({ data: second.buffer });
      ordered!.onmessage?.({ data: first.buffer });
      ordered!.onmessage?.({ data: "text" });

      expect(host.getReceivedPackets(Channel.ReliableOrdered).get(id)).toStrictEqual([
        new Uint8Array([5]),
      ]);
      expect(host.getReceivedPackets(Channel.UnreliableOrdered).get(id)).toStrictEqual([
        new Uint8Array([8]),
      ]);
      expect(host.getReceivedPackets(Channel.UnreliableOrdered).get(id)).toStrictEqual([]);
    });

    it("should disconnect a joiner when one of its channels closes", async () => {
      const host = await openHost();
      const disconnected = vi.fn();
      registry.onDisconnect(disconnected);
      const { pc, channels, id } = await connectJoiner(host);

      channels[1]!.onclose?.();
      expect(pc.close).toHaveBeenCalled();
      expect(disconnected).toHaveBeenCalledWith(expect.objectContaining({ id }));
      expect(host.getConnectedClients(Channel.ReliableOrdered)).toStrictEqual([]);
    });

    it("should disconnect a joiner whose connection failed", async () => {
      const host = await openHost();
      const { pc, id } = await connectJoiner(host);

      pc.connectionState = "failed";
      pc.onconnectionstatechange();
      expect(registry.get(id)).toBeUndefined();
    });

    it("should disconnect a joiner whose signaling socket closed, welcomed or not", async () => {
      const host = await openHost();
      const disconnected = vi.fn();
      registry.onDisconnect(disconnected);
      const { id } = await connectJoiner(host, "joiner-a");
      fromJoiner("joiner-b", { type: "offer", offer: { type: "offer", sdp: "v=0" } });

      fromServer({ type: "leave", from: "joiner-a" });
      fromServer({ type: "leave", from: "joiner-b" });
      expect(peers[0].close).toHaveBeenCalled();
      expect(peers[1].close).toHaveBeenCalled();
      expect(disconnected.mock.calls).toStrictEqual([[expect.objectContaining({ id })]]);
      expect(host.getConnectedClients(Channel.ReliableOrdered)).toStrictEqual([]);
    });

    it("should close every connection without notifying", async () => {
      const host = await openHost();
      const disconnected = vi.fn();
      registry.onDisconnect(disconnected);
      const { pc } = await connectJoiner(host);

      host.close();
      expect(socket.close).toHaveBeenCalled();
      expect(pc.close).toHaveBeenCalled();
      expect(disconnected).not.toHaveBeenCalled();
    });
  });

  describe("local player", () => {
    it("should loop the host's own player back through in-memory queues", async () => {
      const host = await openHost();
      const { id, transport } = host.attachLocal();
      const joiner = await connectJoiner(host);

      expect(registry.get(id)?.transports).toStrictEqual({ local: expect.anything() });
      expect(transport.isConnected(Channel.UnreliableOrdered)).toBe(true);
      expect(host.getConnectedClients(Channel.ReliableOrdered)).toStrictEqual([id, joiner.id]);

      host.sendToEverybody(Channel.ReliableOrdered, new Uint8Array([1]));
      host.sendToClient(Channel.ReliableOrdered, id, new Uint8Array([2]));
      expect(transport.getReceivedPackets(Channel.ReliableOrdered)).toStrictEqual([
        new Uint8Array([1]),
        new Uint8Array([2]),
      ]);
      expect(transport.getReceivedPackets(Channel.ReliableOrdered)).toStrictEqual([]);

      transport.sendData(Channel.UnreliableUnordered, new Uint8Array([3]));
      expect(host.getReceivedPackets(Channel.UnreliableUnordered).get(id)).toStrictEqual([
        new Uint8Array([3]),
      ]);
    });
  });
});
