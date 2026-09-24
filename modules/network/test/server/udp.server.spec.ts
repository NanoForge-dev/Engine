import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UDPServer } from "../../src/server/udp.server.network";

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
  serve.mockImplementation(() => ({ stop: vi.fn() }));
  vi.stubGlobal("Bun", { serve, file });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

/** Options handed to `Bun.serve` by the server under test. */
const getServeOptions = () => serve.mock.calls[0]?.[0];

/**
 * Drive a signaling connection through the same sequence Bun uses: `fetch`
 * performs the upgrade and seeds `ws.data`, then `websocket.open` fires.
 */
const connect = (ip = "127.0.0.1") => {
  const options = getServeOptions();
  let data: any;

  const server = {
    requestIP: vi.fn(() => ({ address: ip, family: "IPv4", port: 1234 })),
    upgrade: vi.fn((_request: unknown, opts: { data: unknown }) => {
      data = opts.data;
      return true;
    }),
  };

  options.fetch({}, server);
  const webSocket = { data, send: vi.fn() };
  options.websocket.open(webSocket);
  return { webSocket, options, peerConnection: webSocket.data.peerConnection };
};

/** Minimal stand-in for an `RTCDataChannel` handed to `ondatachannel`. */
const makeDataChannel = () => ({
  send: vi.fn(),
  onopen: null as null | (() => void),
  onmessage: null as null | ((event: { data: ArrayBuffer }) => void),
  onclose: null as null | (() => void),
  onerror: null as null | ((event: unknown) => void),
});

describe("UDPServer", () => {
  describe("before listen", () => {
    it("should have no connected clients initially", () => {
      const server = new UDPServer(9100, "127.0.0.1", "END");
      expect(server.getConnectedClients()).toStrictEqual([]);
    });

    it("should return an empty packets map when no clients are connected", () => {
      const server = new UDPServer(9100, "127.0.0.1", "END");
      expect(server.getReceivedPackets()).toStrictEqual(new Map());
    });

    it("should not throw when sendToClient is called with an unknown clientId", () => {
      const server = new UDPServer(9100, "127.0.0.1", "END");
      expect(() => server.sendToClient(99, new Uint8Array([1, 2, 3]))).not.toThrow();
    });

    it("should not throw when sendToEverybody is called with no clients", () => {
      const server = new UDPServer(9100, "127.0.0.1", "END");
      expect(() => server.sendToEverybody(new Uint8Array([1, 2, 3]))).not.toThrow();
    });
  });

  describe("after listen", () => {
    it("should start a Bun server on the configured host and port", () => {
      const server = new UDPServer(9101, "0.0.0.0", "MAGIC");
      server.listen();
      expect(serve).toHaveBeenCalledWith(
        expect.objectContaining({ port: 9101, hostname: "0.0.0.0" }),
      );
    });

    it("should register the websocket lifecycle handlers", () => {
      const server = new UDPServer(9102, "0.0.0.0", "END");
      server.listen();
      expect(getServeOptions().websocket).toEqual({
        open: expect.any(Function),
        message: expect.any(Function),
        close: expect.any(Function),
      });
    });

    it("should create a peer connection for each signaling client", () => {
      const server = new UDPServer(9103, "0.0.0.0", "END");
      server.listen();
      const { peerConnection } = connect();
      expect(peerConnection).toBeDefined();
      expect(peerConnection.ondatachannel).toEqual(expect.any(Function));
    });

    it("should close the peer connection when the signaling socket closes", () => {
      const server = new UDPServer(9104, "0.0.0.0", "END");
      server.listen();
      const { webSocket, options, peerConnection } = connect();

      options.websocket.close(webSocket);
      expect(peerConnection.close).toHaveBeenCalled();
    });
  });

  describe("signaling", () => {
    it("should answer an offer and send it back to the client", async () => {
      const server = new UDPServer(9105, "0.0.0.0", "END");
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
      const server = new UDPServer(9106, "0.0.0.0", "END");
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
      const server = new UDPServer(9107, "0.0.0.0", "END");
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
      const server = new UDPServer(9108, "0.0.0.0", "END");
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
      const server = new UDPServer(9109, "0.0.0.0", "END");
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
      const server = new UDPServer(9110, "0.0.0.0", "END");
      server.listen();
      const { peerConnection } = connect();

      peerConnection.ondatachannel({ channel: makeDataChannel() });
      expect(server.getConnectedClients()).toStrictEqual([0]);
    });

    it("should remove a client when its data channel closes", () => {
      const server = new UDPServer(9111, "0.0.0.0", "END");
      server.listen();
      const { peerConnection } = connect();

      const channel = makeDataChannel();
      peerConnection.ondatachannel({ channel });
      channel.onclose?.();
      expect(server.getConnectedClients()).toStrictEqual([]);
    });

    it("should parse a packet received on the data channel", () => {
      const magicBytes = new TextEncoder().encode("END");
      const payload = new Uint8Array([42, 43]);
      const chunk = new Uint8Array([...payload, ...magicBytes]);

      const server = new UDPServer(9112, "0.0.0.0", "END");
      server.listen();
      const { peerConnection } = connect();

      const channel = makeDataChannel();
      peerConnection.ondatachannel({ channel });
      channel.onmessage?.({ data: chunk.buffer as ArrayBuffer });

      const packets = server.getReceivedPackets();
      expect(packets.get(0)).toHaveLength(1);
      expect(packets.get(0)?.[0]).toStrictEqual(payload);
    });

    it("should send framed packets over the data channel", () => {
      const server = new UDPServer(9113, "0.0.0.0", "END");
      server.listen();
      const { peerConnection } = connect();

      const channel = makeDataChannel();
      peerConnection.ondatachannel({ channel });
      server.sendToEverybody(new Uint8Array([1, 2]));

      expect(channel.send).toHaveBeenCalledWith(
        new Uint8Array([1, 2, ...new TextEncoder().encode("END")]),
      );
    });
  });
  describe("nat traversal", () => {
    const iceServers = [{ urls: "stun:stun.example.com:3478" }];

    const hostCandidate = (ip: string) => `candidate:1 1 UDP 2122317823 ${ip} 50000 typ host`;
    const srflxCandidate =
      "candidate:2 1 UDP 1685921535 203.0.113.9 50000 typ srflx raddr 0.0.0.0 rport 0";

    it("should pass the configured ice servers to the peer connection", async () => {
      const { RTCPeerConnection } = await import("node-datachannel/polyfill");
      const server = new UDPServer(9120, "0.0.0.0", "END", undefined, undefined, { iceServers });
      server.listen();
      connect();

      expect(RTCPeerConnection).toHaveBeenCalledWith(expect.objectContaining({ iceServers }));
    });

    it("should not multiplex onto a fixed port when none is configured", async () => {
      const { RTCPeerConnection } = await import("node-datachannel/polyfill");
      const server = new UDPServer(9121, "0.0.0.0", "END");
      server.listen();
      connect();

      const config = vi.mocked(RTCPeerConnection).mock.calls[0]?.[0] as any;
      expect(config.enableIceUdpMux).toBeUndefined();
      expect(config.portRangeBegin).toBeUndefined();
    });

    it("should pin every peer to one multiplexed port when ICE_PORT is set", async () => {
      const { RTCPeerConnection } = await import("node-datachannel/polyfill");
      const server = new UDPServer(9122, "0.0.0.0", "END", undefined, undefined, { port: 50000 });
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
      const server = new UDPServer(9123, "0.0.0.0", "END", undefined, undefined, {
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

      const sent = JSON.parse(vi.mocked(webSocket.send).mock.calls[0]?.[0]);
      expect(sent.answer.sdp).toContain(`a=${hostCandidate("203.0.113.7")}`);
      expect(sent.answer.sdp).not.toContain("10.244.3.17");
    });

    it("should leave srflx candidates untouched when rewriting", async () => {
      const server = new UDPServer(9124, "0.0.0.0", "END", undefined, undefined, {
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

      const sent = JSON.parse(vi.mocked(webSocket.send).mock.calls[0]?.[0]);
      expect(sent.answer.sdp).toContain(srflxCandidate);
    });

    it("should rewrite trickled host candidates", () => {
      const server = new UDPServer(9125, "0.0.0.0", "END", undefined, undefined, {
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

      const sent = JSON.parse(vi.mocked(webSocket.send).mock.calls[0]?.[0]);
      expect(sent.candidate.candidate).toBe(hostCandidate("203.0.113.7"));
      expect(sent.candidate.sdpMid).toBe("0");
    });

    it("should leave candidates alone when no address is advertised", () => {
      const server = new UDPServer(9126, "0.0.0.0", "END");
      server.listen();
      const { webSocket, peerConnection } = connect();

      peerConnection.onicecandidate({
        candidate: {
          candidate: hostCandidate("10.244.3.17"),
          toJSON: () => ({ candidate: hostCandidate("10.244.3.17") }),
        },
      });

      const sent = JSON.parse(vi.mocked(webSocket.send).mock.calls[0]?.[0]);
      expect(sent.candidate.candidate).toBe(hostCandidate("10.244.3.17"));
    });
  });
});
