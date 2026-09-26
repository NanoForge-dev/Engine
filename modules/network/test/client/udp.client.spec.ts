import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UDPClient } from "../../src/client/udp.client.network";

const welcome = { type: "welcome", id: "client-0", token: "t0k3n" };

describe("UDPClient", () => {
  let ws: any;

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

    vi.stubGlobal(
      "RTCPeerConnection",
      vi.fn(function () {
        return {
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
        };
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
  describe("ice servers", () => {
    it("should create the peer connection without ice servers by default", async () => {
      const client = new UDPClient(8081, "127.0.0.1", "END", false);
      await connectWelcomed(client);
      expect(RTCPeerConnection).toHaveBeenCalledWith({ iceServers: [] });
    });

    it("should create the peer connection with the configured ice servers", async () => {
      const iceServers = [{ urls: "stun:stun.example.com:3478" }];
      const client = new UDPClient(8081, "127.0.0.1", "END", false, iceServers);
      await connectWelcomed(client);
      expect(RTCPeerConnection).toHaveBeenCalledWith({ iceServers });
    });
  });

  describe("session", () => {
    it("should store the client id and token from the welcome", async () => {
      const session = {};
      const client = new UDPClient(8081, "127.0.0.1", "END", false, [], session);
      await connectWelcomed(client);

      expect(client.getClientId()).toBe("client-0");
      expect(session).toStrictEqual({ id: "client-0", token: "t0k3n" });
    });

    it("should join the TCP session with its token", async () => {
      const client = new UDPClient(8081, "127.0.0.1", "END", false, [], { token: "t0k3n" });
      await connectWelcomed(client);
      expect(vi.mocked(WebSocket)).toHaveBeenCalledWith("ws://127.0.0.1:8081/?token=t0k3n");
    });

    it("should reject, without a pending timer, when the offer fails", async () => {
      vi.useFakeTimers();
      vi.mocked(RTCPeerConnection).mockImplementationOnce(function () {
        throw new Error("no webrtc");
      });
      const client = new UDPClient(8081, "127.0.0.1", "END", false);

      await expect(client.connect()).rejects.toThrow("no webrtc");
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should reject when the signaling socket closes before the welcome", async () => {
      const client = new UDPClient(8081, "127.0.0.1", "END", false);
      const connecting = client.connect();
      ws.onclose();

      await expect(connecting).rejects.toThrow("UDP signaling closed before the server welcome");
    });

    it("should reject when the signaling socket errors before the welcome", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const client = new UDPClient(8081, "127.0.0.1", "END", false);
      const connecting = client.connect();
      ws.onerror(new Event("error"));

      await expect(connecting).rejects.toThrow("UDP connection error");
    });
  });
});
