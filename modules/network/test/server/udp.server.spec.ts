import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClientRegistry, type ConnectionInfo } from "../../src/server/client-registry";
import { UDPServer } from "../../src/server/udp.server.network";
import { Channel, PacketSequencer } from "../../src/shared/channels";

vi.mock("node-datachannel/polyfill", () => ({
  RTCPeerConnection: vi.fn(function (this: any) {
    this.onicecandidate = null;
    this.onconnectionstatechange = null;
    this.onicecandidate = null;
    this.ondatachannel = null;
    this.remoteDescription = null;
    this.localDescription = { type: "answer", sdp: "v=0" };
    this.setRemoteDescription = vi.fn().mockImplementation(function (this: any) {
      this.remoteDescription = { type: "offer" };
      return Promise.resolve(undefined);
    });
    this.addIceCandidate = vi.fn().mockResolvedValue(undefined);
    this.createAnswer = vi.fn().mockResolvedValue({ type: "answer", sdp: "v=0" });
    this.setLocalDescription = vi.fn().mockResolvedValue(undefined);
    this.close = vi.fn();
  }),
}));

const serve = vi.fn();
const file = vi.fn((path: string) => ({ path }));

beforeEach(() => {
  let nextId = 0;
  vi.spyOn(crypto, "randomUUID").mockImplementation(
    () => `client-${nextId++}` as ReturnType<typeof crypto.randomUUID>,
  );
  serve.mockImplementation(() => ({ stop: vi.fn() }));
  vi.stubGlobal("Bun", { serve, file });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

/** Options handed to `Bun.serve` by the server under test. */
const getServeOptions = () => serve.mock.calls[0]?.[0];

/**
 * Drive a signaling connection through the same sequence Bun uses: `fetch`
 * performs the upgrade and seeds `ws.data`, then `websocket.open` fires.
 */
const connect = (ip = "127.0.0.1", url = "http://localhost:9100/") => {
  const options = getServeOptions();
  let data: any;

  const server = {
    requestIP: vi.fn(() => ({ address: ip, family: "IPv4", port: 1234 })),
    upgrade: vi.fn((_request: unknown, opts: { data: unknown }) => {
      data = opts.data;
      return true;
    }),
  };

  const response = options.fetch(new Request(url), server);
  const webSocket = { data, send: vi.fn(), close: vi.fn() };
  if (data) options.websocket.open(webSocket);
  return { webSocket, options, response, peerConnection: webSocket.data?.peerConnection };
};

/** Parse the last signaling message sent to the client. */
const getLastSent = (webSocket: { send: ReturnType<typeof vi.fn> }) =>
  JSON.parse(webSocket.send.mock.calls.at(-1)?.[0]);

/** A TCP connection, as attached by the TCP server. */
const tcpConnection = (): ConnectionInfo => ({
  transport: "tcp",
  address: "127.0.0.1",
  port: 1234,
  family: "IPv4",
  params: {},
  connectedAt: 0,
});

/** Minimal stand-in for an `RTCDataChannel` handed to `ondatachannel`. */
const makeDataChannel = (label: string = Channel.UnreliableUnordered) => ({
  label,
  send: vi.fn(),
  close: vi.fn(),
  onopen: null as null | (() => void),
  onmessage: null as null | ((event: { data: ArrayBuffer }) => void),
  onclose: null as null | (() => void),
  onerror: null as null | ((event: unknown) => void),
});

describe("UDPServer", () => {
  describe("before listen", () => {
    it("should have no connected clients initially", () => {
      const server = new UDPServer(9100, "127.0.0.1");
      expect(server.getConnectedClients()).toStrictEqual([]);
    });

    it("should return an empty packets map when no clients are connected", () => {
      const server = new UDPServer(9100, "127.0.0.1");
      expect(server.getReceivedPackets(Channel.UnreliableUnordered)).toStrictEqual(new Map());
    });

    it("should not throw when sendToClient is called with an unknown clientId", () => {
      const server = new UDPServer(9100, "127.0.0.1");
      vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() =>
        server.sendToClient(Channel.UnreliableUnordered, "unknown", new Uint8Array([1, 2, 3])),
      ).not.toThrow();
    });

    it("should not throw when sendToEverybody is called with no clients", () => {
      const server = new UDPServer(9100, "127.0.0.1");
      expect(() =>
        server.sendToEverybody(Channel.UnreliableUnordered, new Uint8Array([1, 2, 3])),
      ).not.toThrow();
    });
  });

  describe("after listen", () => {
    it("should start a Bun server on the configured host and port", () => {
      const server = new UDPServer(9101, "0.0.0.0");
      server.listen();
      expect(serve).toHaveBeenCalledWith(
        expect.objectContaining({ port: 9101, hostname: "0.0.0.0" }),
      );
    });

    it("should register the websocket lifecycle handlers", () => {
      const server = new UDPServer(9102, "0.0.0.0");
      server.listen();
      expect(getServeOptions().websocket).toEqual({
        open: expect.any(Function),
        message: expect.any(Function),
        close: expect.any(Function),
      });
    });

    it("should create a peer connection for each signaling client", () => {
      const server = new UDPServer(9103, "0.0.0.0");
      server.listen();
      const { peerConnection } = connect();
      expect(peerConnection).toBeDefined();
      expect(peerConnection.ondatachannel).toEqual(expect.any(Function));
    });

    it("should close the peer connection when the signaling socket closes", () => {
      const server = new UDPServer(9104, "0.0.0.0");
      server.listen();
      const { webSocket, options, peerConnection } = connect();

      options.websocket.close(webSocket);
      expect(peerConnection.close).toHaveBeenCalled();
    });

    it("should close every peer connection on close", () => {
      const server = new UDPServer(9114, "0.0.0.0");
      server.listen();
      const first = connect().peerConnection;
      const second = connect("127.0.0.2").peerConnection;

      server.close();
      expect(first.close).toHaveBeenCalled();
      expect(second.close).toHaveBeenCalled();
    });
  });

  describe("sessions", () => {
    it("should send a welcome with the client id and session token on open", () => {
      const server = new UDPServer(9130, "0.0.0.0");
      server.listen();
      const { webSocket } = connect();

      expect(JSON.parse(webSocket.send.mock.calls[0]?.[0])).toStrictEqual({
        type: "welcome",
        id: "client-0",
        token: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
    });

    it("should join the TCP session when its token is presented", () => {
      const registry = new ClientRegistry();
      const tcp = registry.attach(null, tcpConnection())!;
      const server = new UDPServer(9131, "0.0.0.0", undefined, undefined, {}, registry);
      server.listen();

      const { webSocket, peerConnection } = connect("127.0.0.1", `http://h/?token=${tcp.token}`);
      expect(getLastSent(webSocket)).toStrictEqual({ type: "welcome", ...tcp });

      peerConnection.ondatachannel({ channel: makeDataChannel() });
      expect(server.getConnectedClients()).toStrictEqual([tcp.id]);
      expect(Object.keys(server.getClientInfo(tcp.id)!.transports)).toStrictEqual(["tcp", "udp"]);
    });

    it("should reject an upgrade presenting an unknown session token", () => {
      const server = new UDPServer(9132, "0.0.0.0");
      server.listen();

      const { response, webSocket } = connect("127.0.0.1", "http://h/?token=forged");
      expect(response.status).toBe(401);
      expect(webSocket.data).toBeUndefined();
    });

    it("should leave the session when the signaling socket closes", () => {
      const registry = new ClientRegistry();
      const tcp = registry.attach(null, tcpConnection())!;
      const server = new UDPServer(9133, "0.0.0.0", undefined, undefined, {}, registry);
      server.listen();
      const { webSocket, options, peerConnection } = connect(
        "127.0.0.1",
        `http://h/?token=${tcp.token}`,
      );
      peerConnection.ondatachannel({ channel: makeDataChannel() });

      options.websocket.close(webSocket);
      expect(server.getConnectedClients()).toStrictEqual([]);
      expect(Object.keys(registry.get(tcp.id)!.transports)).toStrictEqual(["tcp"]);
    });
  });

  describe("signaling", () => {
    it("should answer an offer and send it back to the client", async () => {
      const server = new UDPServer(9105, "0.0.0.0");
      server.listen();
      const { webSocket, options, peerConnection } = connect();

      await options.websocket.message(
        webSocket,
        JSON.stringify({ type: "offer", offer: { type: "offer", sdp: "v=0" } }),
      );

      expect(peerConnection.setRemoteDescription).toHaveBeenCalledWith({
        type: "offer",
        sdp: "v=0",
      });
      expect(peerConnection.createAnswer).toHaveBeenCalled();
      expect(peerConnection.setLocalDescription).toHaveBeenCalled();
      expect(webSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "answer", answer: { type: "answer", sdp: "v=0" } }),
      );
    });

    it("should queue ice candidates received before the remote description", async () => {
      const server = new UDPServer(9106, "0.0.0.0");
      server.listen();
      const { webSocket, options, peerConnection } = connect();

      await options.websocket.message(
        webSocket,
        JSON.stringify({ type: "ice", candidate: { candidate: "a=candidate:1" } }),
      );

      expect(peerConnection.addIceCandidate).not.toHaveBeenCalled();
      expect(webSocket.data.pendingCandidates).toHaveLength(1);
    });

    it("should flush queued ice candidates once the offer is applied", async () => {
      const server = new UDPServer(9107, "0.0.0.0");
      server.listen();
      const { webSocket, options, peerConnection } = connect();

      await options.websocket.message(
        webSocket,
        JSON.stringify({ type: "ice", candidate: { candidate: "a=candidate:1" } }),
      );
      await options.websocket.message(
        webSocket,
        JSON.stringify({ type: "offer", offer: { type: "offer", sdp: "v=0" } }),
      );

      expect(peerConnection.addIceCandidate).toHaveBeenCalledWith({ candidate: "a=candidate:1" });
      expect(webSocket.data.pendingCandidates).toHaveLength(0);
    });

    it("should apply ice candidates directly once a remote description exists", async () => {
      const server = new UDPServer(9108, "0.0.0.0");
      server.listen();
      const { webSocket, options, peerConnection } = connect();

      await options.websocket.message(
        webSocket,
        JSON.stringify({ type: "offer", offer: { type: "offer", sdp: "v=0" } }),
      );
      await options.websocket.message(
        webSocket,
        JSON.stringify({ type: "ice", candidate: { candidate: "a=candidate:2" } }),
      );

      expect(peerConnection.addIceCandidate).toHaveBeenCalledWith({ candidate: "a=candidate:2" });
      expect(webSocket.data.pendingCandidates).toHaveLength(0);
    });

    it("should accept a signaling frame delivered as binary", async () => {
      const server = new UDPServer(9109, "0.0.0.0");
      server.listen();
      const { webSocket, options, peerConnection } = connect();

      await options.websocket.message(
        webSocket,
        Buffer.from(JSON.stringify({ type: "offer", offer: { type: "offer", sdp: "v=0" } })),
      );

      expect(peerConnection.setRemoteDescription).toHaveBeenCalled();
    });
  });

  describe("data channel lifecycle", () => {
    it("should register a client when a data channel is opened", () => {
      const server = new UDPServer(9110, "0.0.0.0");
      server.listen();
      const { peerConnection } = connect();

      peerConnection.ondatachannel({ channel: makeDataChannel() });
      expect(server.getConnectedClients()).toStrictEqual(["client-0"]);
    });

    it("should remove a client when its data channel closes", () => {
      const server = new UDPServer(9111, "0.0.0.0");
      server.listen();
      const { peerConnection } = connect();

      const channel = makeDataChannel();
      peerConnection.ondatachannel({ channel });
      channel.onclose?.();
      expect(server.getConnectedClients()).toStrictEqual([]);
    });

    it("should keep both data channels of one client", () => {
      const server = new UDPServer(9112, "0.0.0.0");
      server.listen();
      const { peerConnection } = connect();

      const ordered = makeDataChannel(Channel.UnreliableOrdered);
      const unordered = makeDataChannel(Channel.UnreliableUnordered);
      peerConnection.ondatachannel({ channel: ordered });
      peerConnection.ondatachannel({ channel: unordered });

      expect(server.getConnectedClients(Channel.UnreliableOrdered)).toStrictEqual(["client-0"]);
      expect(server.getConnectedClients(Channel.UnreliableUnordered)).toStrictEqual(["client-0"]);

      ordered.onclose?.();
      expect(server.getConnectedClients(Channel.UnreliableOrdered)).toStrictEqual([]);
      expect(server.getConnectedClients()).toStrictEqual(["client-0"]);
    });

    it("should close a data channel with an unknown label", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const server = new UDPServer(9115, "0.0.0.0");
      server.listen();
      const { peerConnection } = connect();

      const channel = makeDataChannel("game");
      peerConnection.ondatachannel({ channel });
      expect(channel.close).toHaveBeenCalled();
      expect(server.getConnectedClients()).toStrictEqual([]);
    });

    it("should return each unordered packet as it was received", () => {
      const server = new UDPServer(9116, "0.0.0.0");
      server.listen();
      const { peerConnection } = connect();

      const channel = makeDataChannel(Channel.UnreliableUnordered);
      peerConnection.ondatachannel({ channel });
      channel.onmessage?.({ data: new Uint8Array([42, 43]).buffer as ArrayBuffer });

      const packets = server.getReceivedPackets(Channel.UnreliableUnordered);
      expect(packets.get("client-0")).toStrictEqual([new Uint8Array([42, 43])]);
      expect(server.getReceivedPackets(Channel.UnreliableOrdered).has("client-0")).toBe(false);
    });

    it("should drop late ordered packets", () => {
      const server = new UDPServer(9117, "0.0.0.0");
      server.listen();
      const { peerConnection } = connect();

      const channel = makeDataChannel(Channel.UnreliableOrdered);
      peerConnection.ondatachannel({ channel });
      const sender = new PacketSequencer();
      const first = sender.wrap(new Uint8Array([1]));
      const second = sender.wrap(new Uint8Array([2]));
      const third = sender.wrap(new Uint8Array([3]));

      channel.onmessage?.({ data: second.buffer });
      channel.onmessage?.({ data: first.buffer });
      channel.onmessage?.({ data: third.buffer });

      expect(server.getReceivedPackets(Channel.UnreliableOrdered).get("client-0")).toStrictEqual([
        new Uint8Array([2]),
        new Uint8Array([3]),
      ]);
    });

    it("should send each payload on the data channel of its channel", () => {
      const server = new UDPServer(9113, "0.0.0.0");
      server.listen();
      const { peerConnection } = connect();

      const ordered = makeDataChannel(Channel.UnreliableOrdered);
      const unordered = makeDataChannel(Channel.UnreliableUnordered);
      peerConnection.ondatachannel({ channel: ordered });
      peerConnection.ondatachannel({ channel: unordered });

      server.sendToEverybody(Channel.UnreliableUnordered, new Uint8Array([1, 2]));
      server.sendToClient(Channel.UnreliableOrdered, "client-0", new Uint8Array([3]));
      server.sendToClient(Channel.UnreliableOrdered, "client-0", new Uint8Array([4]));

      expect(unordered.send.mock.calls).toStrictEqual([[new Uint8Array([1, 2])]]);
      expect(ordered.send.mock.calls).toStrictEqual([
        [new Uint8Array([0, 0, 0, 0, 3])],
        [new Uint8Array([0, 0, 0, 1, 4])],
      ]);
    });
  });
  describe("nat traversal", () => {
    const iceServers = [{ urls: "stun:stun.example.com:3478" }];

    const hostCandidate = (ip: string) => `candidate:1 1 UDP 2122317823 ${ip} 50000 typ host`;
    const srflxCandidate =
      "candidate:2 1 UDP 1685921535 203.0.113.9 50000 typ srflx raddr 0.0.0.0 rport 0";

    it("should pass the configured ice servers to the peer connection", async () => {
      const { RTCPeerConnection } = await import("node-datachannel/polyfill");
      const server = new UDPServer(9120, "0.0.0.0", undefined, undefined, { iceServers });
      server.listen();
      connect();

      expect(RTCPeerConnection).toHaveBeenCalledWith(expect.objectContaining({ iceServers }));
    });

    it("should not multiplex onto a fixed port when none is configured", async () => {
      const { RTCPeerConnection } = await import("node-datachannel/polyfill");
      const server = new UDPServer(9121, "0.0.0.0");
      server.listen();
      connect();

      const config = vi.mocked(RTCPeerConnection).mock.calls[0]?.[0] as any;
      expect(config.enableIceUdpMux).toBeUndefined();
      expect(config.portRangeBegin).toBeUndefined();
    });

    it("should pin every peer to one multiplexed port when ICE_PORT is set", async () => {
      const { RTCPeerConnection } = await import("node-datachannel/polyfill");
      const server = new UDPServer(9122, "0.0.0.0", undefined, undefined, { port: 50000 });
      server.listen();
      connect();
      connect();

      for (const call of vi.mocked(RTCPeerConnection).mock.calls) {
        expect(call[0]).toEqual(
          expect.objectContaining({
            enableIceUdpMux: true,
            portRangeBegin: 50000,
            portRangeEnd: 50000,
          }),
        );
      }
    });

    it("should rewrite host candidates in the answer to the advertised address", async () => {
      const server = new UDPServer(9123, "0.0.0.0", undefined, undefined, {
        advertiseIp: "203.0.113.7",
      });
      server.listen();
      const { webSocket, options, peerConnection } = connect();

      peerConnection.localDescription = {
        type: "answer",
        sdp: `v=0\r\na=${hostCandidate("10.244.3.17")}\r\na=${srflxCandidate}\r\n`,
      };

      await options.websocket.message(
        webSocket,
        JSON.stringify({ type: "offer", offer: { type: "offer", sdp: "v=0" } }),
      );

      const sent = JSON.parse(vi.mocked(webSocket.send).mock.calls.at(-1)?.[0]);
      expect(sent.answer.sdp).toContain(`a=${hostCandidate("203.0.113.7")}`);
      expect(sent.answer.sdp).not.toContain("10.244.3.17");
    });

    it("should leave srflx candidates untouched when rewriting", async () => {
      const server = new UDPServer(9124, "0.0.0.0", undefined, undefined, {
        advertiseIp: "203.0.113.7",
      });
      server.listen();
      const { webSocket, options, peerConnection } = connect();

      peerConnection.localDescription = {
        type: "answer",
        sdp: `v=0\r\na=${srflxCandidate}\r\n`,
      };

      await options.websocket.message(
        webSocket,
        JSON.stringify({ type: "offer", offer: { type: "offer", sdp: "v=0" } }),
      );

      const sent = JSON.parse(vi.mocked(webSocket.send).mock.calls.at(-1)?.[0]);
      expect(sent.answer.sdp).toContain(srflxCandidate);
    });

    it("should rewrite trickled host candidates", () => {
      const server = new UDPServer(9125, "0.0.0.0", undefined, undefined, {
        advertiseIp: "203.0.113.7",
      });
      server.listen();
      const { webSocket, peerConnection } = connect();

      peerConnection.onicecandidate({
        candidate: {
          candidate: hostCandidate("10.244.3.17"),
          toJSON: () => ({ candidate: hostCandidate("10.244.3.17"), sdpMid: "0" }),
        },
      });

      const sent = JSON.parse(vi.mocked(webSocket.send).mock.calls.at(-1)?.[0]);
      expect(sent.candidate.candidate).toBe(hostCandidate("203.0.113.7"));
      expect(sent.candidate.sdpMid).toBe("0");
    });

    it("should leave candidates alone when no address is advertised", () => {
      const server = new UDPServer(9126, "0.0.0.0");
      server.listen();
      const { webSocket, peerConnection } = connect();

      peerConnection.onicecandidate({
        candidate: {
          candidate: hostCandidate("10.244.3.17"),
          toJSON: () => ({ candidate: hostCandidate("10.244.3.17") }),
        },
      });

      const sent = JSON.parse(vi.mocked(webSocket.send).mock.calls.at(-1)?.[0]);
      expect(sent.candidate.candidate).toBe(hostCandidate("10.244.3.17"));
    });
  });
});
