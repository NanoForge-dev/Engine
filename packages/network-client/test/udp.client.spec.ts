import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UDPClient } from "../src/udp.client.network";

describe("UDPClient", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "WebSocket",
      Object.assign(
        vi.fn(() => ({
          readyState: 0,
          binaryType: "",
          send: vi.fn(),
          onerror: null,
          onopen: null,
          onmessage: null,
          onclose: null,
        })),
        { OPEN: 1 },
      ),
    );

    vi.stubGlobal(
      "RTCPeerConnection",
      vi.fn(() => ({
        createDataChannel: vi.fn(() => ({
          readyState: "closed",
          send: vi.fn(),
          onopen: null,
          onmessage: null,
          onerror: null,
          onclose: null,
        })),
        onicecandidate: null,
        createOffer: vi.fn().mockResolvedValue({}),
        setLocalDescription: vi.fn().mockResolvedValue(undefined),
        setRemoteDescription: vi.fn().mockResolvedValue(undefined),
        addIceCandidate: vi.fn().mockResolvedValue(undefined),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("before connect", () => {
    it("should report not connected before connect is called", () => {
      const client = new UDPClient(8081, "127.0.0.1", "END", false);
      expect(client.isConnected()).toBe(false);
    });

    it("should return no received packets before any data arrives", () => {
      const client = new UDPClient(8081, "127.0.0.1", "END", false);
      expect(client.getReceivedPackets()).toStrictEqual([]);
    });

    it("should not throw when sendData is called before connect", () => {
      const client = new UDPClient(8081, "127.0.0.1", "END", false);
      expect(() => client.sendData(new Uint8Array([1, 2, 3]))).not.toThrow();
    });
  });
});
