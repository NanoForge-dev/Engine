import { afterEach, describe, expect, it, vi } from "vitest";

import { UDPServer } from "../src/udp.server.network";

vi.mock("ws", () => ({
  WebSocketServer: vi.fn(function (this: any) {
    this.on = vi.fn();
  }),
}));

vi.mock("wrtc", () => ({
  RTCPeerConnection: vi.fn(function (this: any) {
    this.onconnectionstatechange = null;
    this.onicecandidate = null;
    this.ondatachannel = null;
    this.setRemoteDescription = vi.fn().mockResolvedValue(undefined);
    this.addIceCandidate = vi.fn().mockResolvedValue(undefined);
    this.createAnswer = vi.fn().mockResolvedValue({});
    this.setLocalDescription = vi.fn().mockResolvedValue(undefined);
    this.close = vi.fn();
  }),
}));

describe("UDPServer", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

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
    it("should start a WebSocketServer on the configured host and port", async () => {
      const { WebSocketServer } = await import("ws");
      const server = new UDPServer(9101, "0.0.0.0", "MAGIC");
      server.listen();
      expect(WebSocketServer).toHaveBeenCalledWith({ port: 9101, host: "0.0.0.0" });
    });

    it("should register a connection handler on the WebSocketServer", async () => {
      const { WebSocketServer } = await import("ws");
      const server = new UDPServer(9102, "0.0.0.0", "END");
      server.listen();
      const wss = vi.mocked(WebSocketServer).mock.instances[0] as any;
      expect(wss.on).toHaveBeenCalledWith("connection", expect.any(Function));
    });
  });
});
